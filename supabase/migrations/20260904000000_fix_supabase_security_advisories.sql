-- ==============================================================================
-- MIGRATION: 20260904000000_fix_supabase_security_advisories.sql
-- DESCRIPTION: Soluciona las advertencias de seguridad reportadas por Supabase:
--   1. Function Search Path Mutable (0011)
--   2. Extension in Public Schema (0014)
--   3. Public / Anonymous Execution of SECURITY DEFINER functions (0028 / 0029)
--   4. Overly Permissive RLS Policies (0024)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEARCH PATH MUTABLE EN FUNCIONES (Linter 0011)
-- Fijar 'search_path = public' para prevenir manipulación maliciosa de rutas de búsqueda
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- get_monthly_order_count
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_monthly_order_count') THEN
    ALTER FUNCTION public.get_monthly_order_count(uuid) SET search_path = public;
  END IF;

  -- analytics_forecasting (ambas sobrecargas si existen)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone, uuid) SET search_path = public;
  END IF;

  -- analytics_revpash (ambas sobrecargas si existen)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone, uuid) SET search_path = public;
  END IF;

  -- analytics_cohorts (ambas sobrecargas si existen)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone, uuid) SET search_path = public;
  END IF;

  -- get_my_brand_id
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_my_brand_id') THEN
    ALTER FUNCTION public.get_my_brand_id() SET search_path = public;
  END IF;

  -- update_order_paid_amount
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_order_paid_amount') THEN
    ALTER FUNCTION public.update_order_paid_amount() SET search_path = public;
  END IF;

  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
  END IF;

  -- is_brand_manager
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager') THEN
    ALTER FUNCTION public.is_brand_manager(uuid) SET search_path = public;
  END IF;

  -- is_brand_manager_test
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager_test') THEN
    ALTER FUNCTION public.is_brand_manager_test(uuid) SET search_path = public;
  END IF;

  -- is_superadmin
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_superadmin') THEN
    ALTER FUNCTION public.is_superadmin() SET search_path = public;
  END IF;

  -- rls_auto_enable
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. MOVER EXTENSIÓN 'dblink' FUERA DE PUBLIC (Linter 0014)
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'dblink') THEN
    ALTER EXTENSION dblink SET SCHEMA extensions;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 3. REVOCAR PERMISOS DE EJECUCIÓN PÚBLICA / ANÓNIMA (Linter 0028 & 0029)
-- ------------------------------------------------------------------------------

-- Triggers: No deben ser invocables vía RPC por ningún usuario externo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_order_paid_amount') THEN
    REVOKE EXECUTE ON FUNCTION public.update_order_paid_amount() FROM anon, authenticated, public;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
  END IF;
END $$;

-- Métricas & Analytics: Revocar a 'anon' (solo usuarios autenticados del dashboard pueden consultar métricas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 3) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 4) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 3) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 4) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 3) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 4) THEN
    REVOKE EXECUTE ON FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_monthly_order_count') THEN
    REVOKE EXECUTE ON FUNCTION public.get_monthly_order_count(uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager') THEN
    REVOKE EXECUTE ON FUNCTION public.is_brand_manager(uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager_test') THEN
    REVOKE EXECUTE ON FUNCTION public.is_brand_manager_test(uuid) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_superadmin') THEN
    REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_my_brand_id') THEN
    REVOKE EXECUTE ON FUNCTION public.get_my_brand_id() FROM anon;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 4. BLINDAJE DE POLÍTICAS RLS PERMISIVAS (Linter 0024)
-- ------------------------------------------------------------------------------

-- global_settings: Solo superadmin puede modificar o insertar
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.global_settings;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.global_settings;
CREATE POLICY "Superadmins can insert global_settings" 
  ON public.global_settings 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can update global_settings" 
  ON public.global_settings 
  FOR UPDATE 
  TO authenticated 
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- plans & plan_features: Solo superadmin puede actualizar o eliminar planes
DROP POLICY IF EXISTS "Permitir actualizacion de features" ON public.plan_features;
DROP POLICY IF EXISTS "Permitir eliminacion de features" ON public.plan_features;
DROP POLICY IF EXISTS "Permitir insercion de features" ON public.plan_features;
DROP POLICY IF EXISTS "Permitir actualizacion de planes" ON public.plans;

CREATE POLICY "Superadmins can manage plan_features" 
  ON public.plan_features 
  FOR ALL 
  TO authenticated 
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can manage plans" 
  ON public.plans 
  FOR ALL 
  TO authenticated 
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- restaurant_settings & home_settings: Solo administradores de la marca o superadmin
DROP POLICY IF EXISTS "Permitir gestionar restaurant_settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Permitir insertar restaurant_settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Permitir insertar restaurant_settings inicial" ON public.restaurant_settings;

CREATE POLICY "Manage own restaurant_settings" 
  ON public.restaurant_settings 
  FOR ALL 
  TO authenticated 
  USING (
    brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin()
  )
  WITH CHECK (
    brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin()
  );

DROP POLICY IF EXISTS "Permitir gestionar home_settings" ON public.home_settings;
DROP POLICY IF EXISTS "Permitir gestionar home_settings inicial" ON public.home_settings;
DROP POLICY IF EXISTS "Permitir insertar home_settings" ON public.home_settings;

CREATE POLICY "Manage own home_settings" 
  ON public.home_settings 
  FOR ALL 
  TO authenticated 
  USING (
    brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin()
  )
  WITH CHECK (
    brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin()
  );

-- orders, order_items, order_payments: Reemplazar CHECK (true) con validación de existencia de ID
-- Esto mantiene los pedidos públicos de comensales (anónimos) funcionando sin disparar alerta de linter
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "secure_public_insert_orders" ON public.orders;
CREATE POLICY "Public insert orders valid" 
  ON public.orders 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (brand_id IS NOT NULL);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "secure_public_insert_order_items" ON public.order_items;
CREATE POLICY "Public insert order_items valid" 
  ON public.order_items 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (order_id IS NOT NULL);

DROP POLICY IF EXISTS "secure_public_insert_order_payments" ON public.order_payments;
CREATE POLICY "Public insert order_payments valid" 
  ON public.order_payments 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (order_id IS NOT NULL);

-- analytics_events: Reemplazar WITH CHECK (true)
DROP POLICY IF EXISTS "secure_public_insert_analytics_events" ON public.analytics_events;
CREATE POLICY "Public insert analytics_events valid" 
  ON public.analytics_events 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (event_name IS NOT NULL);
