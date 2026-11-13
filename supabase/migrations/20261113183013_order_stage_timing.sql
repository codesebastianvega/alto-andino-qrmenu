-- Record operational stages centrally, including changes from older clients.
-- Existing orders are deliberately not backfilled with guessed timestamps.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preparing_at timestamptz,
  ADD COLUMN IF NOT EXISTS on_table_at timestamptz,
  ADD COLUMN IF NOT EXISTS on_the_way_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS kitchen_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS bar_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.record_order_stage_timing()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  v_at timestamptz := clock_timestamp();
  v_previous_at timestamptz;
  v_history jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_started_at := COALESCE(NEW.created_at, v_at);
    NEW.status_history := jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', NEW.status_started_at));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_history := COALESCE(OLD.status_history, '[]'::jsonb);
    IF jsonb_array_length(v_history) = 0 THEN
      v_previous_at := COALESCE(OLD.status_started_at, CASE OLD.status
        WHEN 'new' THEN OLD.created_at WHEN 'waiting_payment' THEN OLD.created_at
        WHEN 'preparing' THEN OLD.preparing_at
        WHEN 'ready' THEN COALESCE(OLD.ready_at, GREATEST(OLD.kitchen_ready_at, OLD.bar_ready_at))
        WHEN 'on_table' THEN OLD.on_table_at
        WHEN 'on_the_way' THEN OLD.on_the_way_at
        WHEN 'delivered' THEN OLD.delivered_at WHEN 'cancelled' THEN OLD.cancelled_at END);
      v_history := jsonb_build_array(jsonb_build_object('status', OLD.status, 'at', v_previous_at));
    END IF;
    NEW.status_started_at := v_at;
    NEW.status_history := v_history || jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', v_at));
  ELSE
    -- Payments, notes and duplicate status submissions must not restart clocks.
    NEW.status_started_at := OLD.status_started_at;
    NEW.status_history := OLD.status_history;
    NEW.preparing_at := OLD.preparing_at;
    NEW.on_table_at := OLD.on_table_at;
    NEW.on_the_way_at := OLD.on_the_way_at;
    NEW.ready_at := OLD.ready_at;
    NEW.delivered_at := OLD.delivered_at;
    NEW.cancelled_at := OLD.cancelled_at;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'preparing' THEN NEW.preparing_at := COALESCE(NEW.preparing_at, v_at); END IF;
    IF NEW.status = 'ready' THEN NEW.ready_at := CASE WHEN TG_OP = 'UPDATE' THEN COALESCE(OLD.ready_at, v_at) ELSE COALESCE(NEW.ready_at, v_at) END; END IF;
    IF NEW.status = 'on_table' THEN NEW.on_table_at := COALESCE(NEW.on_table_at, v_at); END IF;
    IF NEW.status = 'on_the_way' THEN NEW.on_the_way_at := COALESCE(NEW.on_the_way_at, v_at); END IF;
    IF NEW.status = 'delivered' THEN NEW.delivered_at := v_at; END IF;
    IF NEW.status = 'cancelled' THEN NEW.cancelled_at := v_at; END IF;
  END IF;
  IF NEW.kitchen_status = 'preparing' AND (TG_OP = 'INSERT' OR OLD.kitchen_status IS DISTINCT FROM NEW.kitchen_status) THEN
    NEW.kitchen_started_at := v_at;
  END IF;
  IF NEW.bar_status = 'preparing' AND (TG_OP = 'INSERT' OR OLD.bar_status IS DISTINCT FROM NEW.bar_status) THEN
    NEW.bar_started_at := v_at;
  END IF;
  IF NEW.kitchen_status = 'ready' AND (TG_OP = 'INSERT' OR OLD.kitchen_status IS DISTINCT FROM NEW.kitchen_status) THEN NEW.kitchen_ready_at := v_at; END IF;
  IF NEW.bar_status = 'ready' AND (TG_OP = 'INSERT' OR OLD.bar_status IS DISTINCT FROM NEW.bar_status) THEN NEW.bar_ready_at := v_at; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_record_stage_timing ON public.orders;
CREATE TRIGGER orders_record_stage_timing BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.record_order_stage_timing();

-- Exercise the same trigger on isolated temporary rows, never real orders.
CREATE TEMP TABLE order_timing_smoke (LIKE public.orders INCLUDING DEFAULTS) ON COMMIT DROP;
CREATE TRIGGER order_timing_smoke_record BEFORE INSERT OR UPDATE ON order_timing_smoke
FOR EACH ROW EXECUTE FUNCTION public.record_order_stage_timing();
DO $$
DECLARE v_id uuid := gen_random_uuid(); v_row record; v_ready timestamptz; v_start timestamptz;
BEGIN
  INSERT INTO order_timing_smoke (id, status, origin, fulfillment_type, total_amount)
  VALUES (v_id, 'new', 'takeaway', 'takeaway', 0);
  UPDATE order_timing_smoke SET status = 'preparing', kitchen_status = 'preparing' WHERE id = v_id;
  UPDATE order_timing_smoke SET status = 'ready', kitchen_status = 'ready' WHERE id = v_id RETURNING ready_at INTO v_ready;
  UPDATE order_timing_smoke SET status = 'on_the_way' WHERE id = v_id RETURNING status_started_at INTO v_start;
  UPDATE order_timing_smoke SET total_amount = 1 WHERE id = v_id;
  SELECT * INTO v_row FROM order_timing_smoke WHERE id = v_id;
  IF v_row.status_started_at IS DISTINCT FROM v_start OR v_row.ready_at IS DISTINCT FROM v_ready
    OR v_row.preparing_at IS NULL OR v_row.kitchen_started_at IS NULL OR v_row.on_the_way_at IS NULL
    OR jsonb_array_length(v_row.status_history) <> 4 THEN RAISE EXCEPTION 'Order timing smoke test failed'; END IF;
  UPDATE order_timing_smoke SET status = 'preparing' WHERE id = v_id;
  UPDATE order_timing_smoke SET status = 'ready' WHERE id = v_id;
  UPDATE order_timing_smoke SET status = 'delivered' WHERE id = v_id;
  SELECT * INTO v_row FROM order_timing_smoke WHERE id = v_id;
  IF v_row.delivered_at IS NULL OR v_row.ready_at IS DISTINCT FROM v_ready OR jsonb_array_length(v_row.status_history) <> 7
    THEN RAISE EXCEPTION 'Order timing rework smoke test failed'; END IF;
END;
$$;
