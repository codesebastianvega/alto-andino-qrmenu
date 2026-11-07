-- Migration: Launch Nueva Línea Poke Premium (Tori Katsu & Salmón Fresh)
-- Brand ID: a63da806-a62a-49b9-a833-07e0976785ad (BOKU Bento)
-- Category: 6316a6dc-8a4c-4cc1-874b-4f3d362ed635 (BOKU Bowls)

DO $$
BEGIN
    -- 1. Insert or update new Poke Tori Katsu
    INSERT INTO products (
        id,
        brand_id,
        name,
        description,
        price,
        cost,
        margin,
        category_id,
        image_url,
        is_active,
        stock_status,
        available_portions,
        out_reason,
        depleted_ingredient_id,
        requires_kitchen,
        station,
        subcategory,
        modifier_groups,
        created_at,
        updated_at
    ) VALUES (
        'b0000b25-0000-4000-a000-000000000025',
        'a63da806-a62a-49b9-a833-07e0976785ad',
        'Poke Tori Katsu (Pechuga Crocante)',
        'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        22000,
        8500,
        61.36,
        '6316a6dc-8a4c-4cc1-874b-4f3d362ed635',
        '/img/products/boku-tori-katsu.webp',
        true,
        'in',
        50,
        null,
        null,
        true,
        'kitchen',
        'Bowls Poke Fresco',
        ARRAY['b0000b20-0000-4000-a000-000000000002', 'b0000b20-0000-4000-a000-000000000001']::text[],
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        category_id = EXCLUDED.category_id,
        image_url = EXCLUDED.image_url,
        is_active = EXCLUDED.is_active,
        stock_status = EXCLUDED.stock_status,
        available_portions = EXCLUDED.available_portions,
        out_reason = null,
        depleted_ingredient_id = null,
        requires_kitchen = EXCLUDED.requires_kitchen,
        station = EXCLUDED.station,
        subcategory = EXCLUDED.subcategory,
        updated_at = NOW();

    -- 2. Update Salmón Fresh to active promo of the day ($22.000) and unblock from Auto-86
    UPDATE products
    SET 
        name = 'Poke Salmón Fresh (Fresco o Salteado)',
        description = 'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        price = 22000,
        is_active = true,
        stock_status = 'in',
        available_portions = 50,
        out_reason = null,
        depleted_ingredient_id = null,
        updated_at = NOW()
    WHERE id = 'd07007ec-761b-4f40-bad5-799c1154b9ab';

    -- 3. Update home_settings hero for Boku Bento
    UPDATE home_settings
    SET 
        hero_h1 = '🔥 ¡NUEVA LÍNEA POKE PREMIUM! 🔥',
        hero_subtitle = 'Dos opciones brutales por solo $22.000 c/u: 🍣 Poke Salmón Fresh (Fresco o Salteado) o 🍗 Poke Tori Katsu. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.',
        updated_at = NOW()
    WHERE brand_id = 'a63da806-a62a-49b9-a833-07e0976785ad';

END $$;
