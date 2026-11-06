-- =============================================================================
-- ALUNA OS - MIGRACIÓN DE INTEGRIDAD RELACIONAL Y LIMPIEZA DE DEUDA TÉCNICA
-- Fecha: 2026-11-06
-- Propósito:
--   1. Conectar automáticamente orders.customer_id -> customers.id mediante
--      trigger BEFORE INSERT/UPDATE y backfill de órdenes históricas.
--   2. Depurar los 3 pedidos fantasma de prueba identificados en auditoría.
--   3. Migrar datos residuales y eliminar tablas duplicadas/obsoletas:
--      - product_ingredients (reemplazada por recipes + recipe_ingredients)
--      - banners (reemplazada por promo_banners)
--      - favorites (reemplazada por almacenamiento local en storefront)
--   4. Desambiguar semánticamente shifts (reloj checador de personal) vs
--      cash_shifts (arqueos y turnos de caja).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. DEPURACIÓN DE PEDIDOS FANTASMA DE PRUEBA
-- -----------------------------------------------------------------------------
UPDATE public.orders
SET
  status = 'cancelled',
  payment_status = 'cancelled',
  cancellation_reason = 'Pedido de prueba descartado en auditoría contable',
  updated_at = NOW()
WHERE id IN (
  '022afa44-0294-4396-af36-dfe47e53e409',
  '3f3a1096-9b2a-4267-8533-484f1a765584',
  '91bd48a0-6baf-467b-8dd3-e170f63e4b11'
);

-- -----------------------------------------------------------------------------
-- 2. TRIGGER AUTOMÁTICO: orders.customer_id <-> public.customers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_auto_link_order_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
  v_clean_name TEXT;
  v_customer_id UUID;
BEGIN
  -- Si ya viene con customer_id asignado o no tiene brand_id, respetar
  IF NEW.customer_id IS NOT NULL OR NEW.brand_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Normalizar teléfono (solo dígitos; quitar prefijo 57 si tiene 12 dígitos)
  v_clean_phone := regexp_replace(COALESCE(NEW.customer_phone, ''), '\D', '', 'g');
  IF length(v_clean_phone) = 12 AND left(v_clean_phone, 3) = '573' THEN
    v_clean_phone := substring(v_clean_phone FROM 3);
  END IF;

  -- Limpiar nombre de etiquetas [Dir: ...] y [FIADO ...]
  v_clean_name := trim(regexp_replace(COALESCE(NEW.customer_name, ''), '\[[^\]]*\]', '', 'g'));

  -- Ignorar clientes anónimos de mostrador sin teléfono válido
  IF length(v_clean_phone) < 7 AND (
    v_clean_name = '' OR
    lower(v_clean_name) IN (
      'sin nombre',
      'cliente sin nombre',
      'cliente',
      'cliente whatsapp',
      'cliente mostrador',
      'cliente mostrador / whatsapp',
      'cliente invitado',
      'anonimo',
      'anónimo'
    ) OR
    lower(v_clean_name) LIKE 'test_%'
  ) THEN
    RETURN NEW;
  END IF;

  -- 1. Buscar cliente existente por teléfono en la misma marca
  IF length(v_clean_phone) >= 7 THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE brand_id = NEW.brand_id
      AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') LIKE '%' || v_clean_phone || '%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- 2. Si no se encontró por teléfono, buscar por nombre exacto
  IF v_customer_id IS NULL AND v_clean_name <> '' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE brand_id = NEW.brand_id
      AND lower(trim(name)) = lower(v_clean_name)
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- 3. Si no existe, crear el registro en public.customers
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      brand_id,
      name,
      phone,
      notes
    ) VALUES (
      NEW.brand_id,
      CASE WHEN v_clean_name <> '' THEN v_clean_name ELSE 'Cliente' END,
      CASE
        WHEN length(v_clean_phone) >= 7 THEN v_clean_phone
        ELSE 'sintel:' || regexp_replace(lower(v_clean_name), '[^a-z0-9]+', '_', 'g')
      END,
      NULLIF(trim(COALESCE(NEW.delivery_address, '')), '')
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_customer_id;

    -- En caso de colisión concurrente, recuperar el ID
    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id
      FROM public.customers
      WHERE brand_id = NEW.brand_id
        AND (
          (length(v_clean_phone) >= 7 AND phone = v_clean_phone)
          OR lower(trim(name)) = lower(v_clean_name)
        )
      LIMIT 1;
    END IF;
  END IF;

  NEW.customer_id := v_customer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_link_order_customer ON public.orders;
CREATE TRIGGER trg_auto_link_order_customer
BEFORE INSERT OR UPDATE OF customer_phone, customer_name
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_link_order_customer();

-- -----------------------------------------------------------------------------
-- 3. BACKFILL DE ÓRDENES HISTÓRICAS (VINCULAR orders.customer_id)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, customer_phone, customer_name
    FROM public.orders
    WHERE customer_id IS NULL
      AND status <> 'cancelled'
  LOOP
    -- Al actualizar customer_name a su mismo valor se dispara trg_auto_link_order_customer
    UPDATE public.orders
    SET customer_name = r.customer_name
    WHERE id = r.id;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. LIMPIEZA DE TABLAS OBSOLETAS Y DUPLICADAS
-- -----------------------------------------------------------------------------

-- 4.1 Deprecar y eliminar public.product_ingredients (reemplazada por recipes + recipe_ingredients)
DROP TABLE IF EXISTS public.product_ingredients CASCADE;

-- 4.2 Deprecar y eliminar public.banners (reemplazada por promo_banners)
DROP TABLE IF EXISTS public.banners CASCADE;

-- 4.3 Deprecar y eliminar public.favorites (no utilizada en producción)
DROP TABLE IF EXISTS public.favorites CASCADE;

-- -----------------------------------------------------------------------------
-- 5. DESAMBIGUACIÓN EXPLÍCITA: shifts (Asistencia) vs cash_shifts (Caja)
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.shifts IS
  'Control de asistencia y reloj checador de personal (clock_in / clock_out en useStaff). NO usar para arqueos de caja.';

COMMENT ON TABLE public.cash_shifts IS
  'Turnos operativos y arqueos de dinero en caja (base inicial, ventas efectivo/digital, cierre Z en useOperations).';

CREATE OR REPLACE VIEW public.staff_attendance_shifts AS
SELECT * FROM public.shifts;

COMMIT;
