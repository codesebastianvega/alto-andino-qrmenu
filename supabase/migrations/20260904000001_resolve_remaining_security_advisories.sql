-- ==============================================================================
-- MIGRATION: 20260904000001_resolve_remaining_security_advisories.sql
-- DESCRIPTION: Resuelve las advertencias restantes del linter de Supabase:
--   1. public_bucket_allows_listing en bucket 'products'
--   2. anon / authenticated security_definer_function_executable en funciones de analítica
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CORREGIR BUCKET PÚBLICO QUE PERMITE LISTAR (Linter 0025: public_bucket_allows_listing)
-- Los buckets públicos sirven archivos por URL directa sin necesidad de listar
-- toda la tabla storage.objects. Eliminamos las políticas de listado indiscriminado.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated full access to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view products" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Políticas específicas para que los usuarios autenticados puedan subir y gestionar imágenes:
CREATE POLICY "Authenticated users can upload products storage" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Authenticated users can update products storage" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can delete products storage" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'products');


-- ------------------------------------------------------------------------------
-- 2. CAMBIAR FUNCIONES DE ANALÍTICA A 'SECURITY INVOKER' (Linter 0028 & 0029)
-- Al pasar a SECURITY INVOKER:
--   - Ya NO son SECURITY DEFINER (desaparecen las alertas 0028 y 0029).
--   - Se ejecutan respetando las políticas RLS del usuario que las invoca.
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- analytics_cohorts (3 y 4 argumentos)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_cohorts' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone, uuid) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_cohorts(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon;
  END IF;

  -- analytics_forecasting (3 y 4 argumentos)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_forecasting' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone, uuid) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_forecasting(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon;
  END IF;

  -- analytics_revpash (3 y 4 argumentos)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 3) THEN
    ALTER FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'analytics_revpash' AND pronargs = 4) THEN
    ALTER FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone, uuid) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.analytics_revpash(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon;
  END IF;

  -- get_monthly_order_count
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_monthly_order_count') THEN
    ALTER FUNCTION public.get_monthly_order_count(uuid) SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.get_monthly_order_count(uuid) FROM PUBLIC, anon;
  END IF;

  -- get_my_brand_id
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_my_brand_id') THEN
    ALTER FUNCTION public.get_my_brand_id() SECURITY INVOKER;
    REVOKE EXECUTE ON FUNCTION public.get_my_brand_id() FROM PUBLIC, anon;
  END IF;

  -- Eliminar función de prueba
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager_test') THEN
    DROP FUNCTION public.is_brand_manager_test(uuid);
  END IF;

  -- Revocar anon en funciones internas de autorización RLS
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_brand_manager') THEN
    REVOKE EXECUTE ON FUNCTION public.is_brand_manager(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.is_brand_manager(uuid) TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_superadmin') THEN
    REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
  END IF;
END $$;
