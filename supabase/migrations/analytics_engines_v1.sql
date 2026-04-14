-- Analytics Engines v1: Forecasting, RevPASH, and Cohorts

-- 1. Forecasting: Previsión de Cierre
CREATE OR REPLACE FUNCTION public.analytics_forecasting(
    p_brand_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sales NUMERIC;
    v_days_elapsed NUMERIC;
    v_total_days NUMERIC;
    v_run_rate NUMERIC;
    v_projected_sales NUMERIC;
    v_prev_period_sales NUMERIC;
    v_gap_analysis NUMERIC;
BEGIN
    -- Total sales in current period
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_sales
    FROM public.orders
    WHERE brand_id = p_brand_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND status NOT IN ('cancelled');

    -- Days calculations
    v_days_elapsed := GREATEST(EXTRACT(DAY FROM (LEAST(NOW(), p_end_date) - p_start_date)) + 1, 1);
    v_total_days := EXTRACT(DAY FROM (p_end_date - p_start_date)) + 1;

    -- Run Rate
    v_run_rate := v_total_sales / v_days_elapsed;
    v_projected_sales := v_run_rate * v_total_days;

    -- Previous period sales (same duration)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_prev_period_sales
    FROM public.orders
    WHERE brand_id = p_brand_id
      AND created_at >= (p_start_date - (p_end_date - p_start_date) - interval '1 day')
      AND created_at < p_start_date
      AND status NOT IN ('cancelled');

    -- Gap to equal previous period
    IF v_total_days > v_days_elapsed THEN
        v_gap_analysis := (v_prev_period_sales - v_total_sales) / (v_total_days - v_days_elapsed);
    ELSE
        v_gap_analysis := 0;
    END IF;

    RETURN jsonb_build_object(
        'total_sales', v_total_sales,
        'projected_sales', v_projected_sales,
        'prev_period_sales', v_prev_period_sales,
        'deviation_pct', CASE WHEN v_prev_period_sales > 0 THEN ((v_projected_sales / v_prev_period_sales) - 1) * 100 ELSE 0 END,
        'daily_gap_to_prev', GREATEST(v_gap_analysis, 0)
    );
END;
$$;

-- 2. RevPASH / Hourly Efficiency
CREATE OR REPLACE FUNCTION public.analytics_revpash(
    p_brand_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(t)
    INTO v_result
    FROM (
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour_of_day,
            COUNT(*) as order_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_ticket,
            -- Dwell time simulation (if we had closed_at, we would use it)
            -- For now, we use a constant or random for demo purposes if field is missing
            2.5 as turnover_rate 
        FROM public.orders
        WHERE brand_id = p_brand_id
          AND created_at >= p_start_date
          AND created_at <= p_end_date
          AND status NOT IN ('cancelled')
        GROUP BY 1
        ORDER BY 1
    ) t;

    RETURN v_result;
END;
$$;

-- 3. Cohorts / Customer Retention
CREATE OR REPLACE FUNCTION public.analytics_cohorts(
    p_brand_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH customer_stats AS (
        SELECT 
            customer_phone,
            COUNT(*) as total_orders,
            MIN(created_at) as first_order_date
        FROM public.orders
        WHERE brand_id = p_brand_id
          AND customer_phone IS NOT NULL
          AND customer_phone != ''
          AND status NOT IN ('cancelled')
        GROUP BY 1
    ),
    period_orders AS (
        SELECT DISTINCT customer_phone
        FROM public.orders
        WHERE brand_id = p_brand_id
          AND created_at >= p_start_date
          AND created_at <= p_end_date
          AND customer_phone IS NOT NULL
          AND customer_phone != ''
          AND status NOT IN ('cancelled')
    ),
    segmentation AS (
        SELECT 
            CASE 
                WHEN cs.first_order_date >= p_start_date THEN 'Nuevo'
                WHEN cs.total_orders > 1 THEN 'Recurrente'
                ELSE 'Esporádico'
            END as segment,
            COUNT(*) as count
        FROM period_orders po
        JOIN customer_stats cs ON po.customer_phone = cs.customer_phone
        GROUP BY 1
    )
    SELECT jsonb_object_agg(segment, count)
    INTO v_result
    FROM segmentation;

    RETURN v_result;
END;
$$;
