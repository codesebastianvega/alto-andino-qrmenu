-- Migration to update promo_banners schema and seed data

-- 1. Ensure columns exist (Safely using IF NOT EXISTS or adding them if we know they are missing, but since we are executing raw SQL we'll alter if needed)
-- Let's check if we can just alter. Supabase migrations usually just run.
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.promo_banners ADD COLUMN type text DEFAULT 'info';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE public.promo_banners ADD COLUMN bg_color text DEFAULT '#2f4131';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE public.promo_banners ADD COLUMN product_id uuid references public.products(id);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 2. Clear existing (if any) to avoid duplication during seed, or just insert if empty. Let's just insert the hardcoded ones if the table is empty.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.promo_banners) THEN
        INSERT INTO public.promo_banners (title, subtitle, image_url, cta_text, cta_link, is_active, sort_order, bg_color, type) VALUES
        ('Pet Friendly 🐾', 'Conoce a Cocoa, nuestra pitbull bonsái.', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', 'Conocer', 'modal:petfriendly', true, 1, '#243326', 'info'),
        ('Noticias', 'Novedades del Alto Andino', 'https://images.unsplash.com/photo-1495474472205-51f750c058ab?auto=format&fit=crop&q=80', 'Noticias', 'story', true, 2, '#8a5f6d', 'info'),
        ('Recetas', 'Ideas para preparar en casa', 'https://images.unsplash.com/photo-1623366302587-bca9cb729092?auto=format&fit=crop&q=80', 'Recetas', 'story', true, 3, '#5f8a87', 'info'),
        ('Reseñas', '¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.', 'https://images.unsplash.com/photo-1516483638261-f40af5ff1f25?auto=format&fit=crop&q=80', 'Dejar reseña', 'link:reviews', true, 4, '#8a745f', 'info');
    END IF;
END $$;
