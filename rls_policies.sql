-- Funciones de ayuda MÁS EFICIENTES para usar en Policies (sin causar recursión en perfiles)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_brand_id()
RETURNS uuid AS $$
  SELECT brand_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Habilitar RLS en las tablas que faltaban
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Y nos aseguramos que estén en las viejas también
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_settings ENABLE ROW LEVEL SECURITY;


-- 2. Limpiar policies existentes genéricas abiertas (puedes descomentar esto si sabes que no hay policies necesarias)
-- DROP POLICY IF EXISTS "Public select" ON public.products;
-- (Es mejor borrarlas desde el Dashboard para no borrar de más, o crear las nuevas como reemplazo).


-- 3. POLICIES PARA ADMINISTRADORES PRINCIPALES (Superadmin)
-- El SuperAdmin puede ver y hacer TODO en TODAS las tablas.
-- Lo definimos a nivel RLS en cada tabla que requiere control estricto.

CREATE POLICY "Superadmin ALL on brands" ON public.brands
FOR ALL USING (public.user_role() = 'superadmin');

CREATE POLICY "Superadmin ALL on plans" ON public.plans
FOR ALL USING (public.user_role() = 'superadmin');

CREATE POLICY "Superadmin ALL on plan_features" ON public.plan_features
FOR ALL USING (public.user_role() = 'superadmin');


-- 4. POLICIES PÚBLICAS (Lectura universal para los clientes finales)
-- Planes (para la landing de Aluna SaaS)
CREATE POLICY "Public read plans" ON public.plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Public read plan features" ON public.plan_features
FOR SELECT USING (true);

-- Brands (para que un comensal resuelva el dominio/slug)
CREATE POLICY "Public read active brands" ON public.brands
FOR SELECT USING (is_active = true);

-- Contenido del Menú público: Select solo
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Public read promo_banners" ON public.promo_banners FOR SELECT USING (true);
CREATE POLICY "Public read home_settings" ON public.home_settings FOR SELECT USING (true);
CREATE POLICY "Public read experiences" ON public.experiences FOR SELECT USING (true);

-- Órdenes: Los comensales pueden crear órdenes!
CREATE POLICY "Public insert orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- (Opcional, los clientes ven sus proias órdenes filtrando su session key o email localmente)
CREATE POLICY "Public select orders" ON public.orders
FOR SELECT USING (true); 

CREATE POLICY "Public insert experience_bookings" ON public.experience_bookings
FOR INSERT WITH CHECK (true);


-- 5. POLICIES PARA DUEÑOS Y STAFF (Escritura y lectura privada)

-- BRANDS: un owner puede ver y editar su propio brand.
CREATE POLICY "Owner UPDATE own brand" ON public.brands
FOR UPDATE USING (id = public.user_brand_id());

CREATE POLICY "Owner SELECT own brand" ON public.brands
FOR SELECT USING (id = public.user_brand_id());

-- TABLAS DE DATOS DEL NEGOCIO (Los dueños y staff pueden hacer TODO en su brand)
-- Automatizaremos esto asumiendo el patrón "brand_id = public.user_brand_id()"

CREATE POLICY "Brand team ALL on settings" ON public.restaurant_settings FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');
CREATE POLICY "Brand team ALL on home_settings" ON public.home_settings FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');
CREATE POLICY "Brand team ALL on business_hours" ON public.business_hours FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');
CREATE POLICY "Brand team ALL on promo_banners" ON public.promo_banners FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');

CREATE POLICY "Brand team ALL on products" ON public.products FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');
CREATE POLICY "Brand team ALL on categories" ON public.categories FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');

CREATE POLICY "Brand team ALL on orders" ON public.orders FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');

CREATE POLICY "Brand team ALL on staff" ON public.staff FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');

CREATE POLICY "Brand team ALL on experiences" ON public.experiences FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');
CREATE POLICY "Brand team ALL on experience_bookings" ON public.experience_bookings FOR ALL USING (brand_id = public.user_brand_id() OR public.user_role() = 'superadmin');


-- 6. PERFILES (Profiles)
-- Un usuario puede ver su perfil y modificarlo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Superadmin puede ver todos los perfiles
CREATE POLICY "Superadmin read all profiles" ON public.profiles FOR SELECT USING (public.user_role() = 'superadmin');
-- Dueño puede ver a sus staff
CREATE POLICY "Owner read brand profiles" ON public.profiles FOR SELECT USING (brand_id = public.user_brand_id());
