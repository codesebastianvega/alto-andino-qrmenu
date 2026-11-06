-- Migration: Create Bento Mediterráneo and update Bento Criollo Antioqueño (La Paisa)
-- Brand ID: a63da806-a62a-49b9-a833-07e0976785ad
-- Category ID: b0000c01-0000-4000-a000-000000000001 (BOKU Bentos Caseros)

DO $$
BEGIN
    -- 1. Insert or update Bento Mediterráneo (Fresco y Balanceado)
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
        requires_kitchen,
        station,
        subcategory,
        modifier_groups,
        created_at,
        updated_at
    ) VALUES (
        'b0000b18-0000-4000-a000-000000000018',
        'a63da806-a62a-49b9-a833-07e0976785ad',
        'Bento Mediterráneo (Fresco y Balanceado)',
        'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        19000,
        7500,
        60.53,
        'b0000c01-0000-4000-a000-000000000001',
        '/bento-mediterraneo.jpg',
        true,
        'in',
        true,
        'kitchen',
        'Bentos Caseros',
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
        requires_kitchen = EXCLUDED.requires_kitchen,
        station = EXCLUDED.station,
        subcategory = EXCLUDED.subcategory,
        updated_at = NOW();

    -- 2. Update Bento Criollo Antioqueño (La Paisa)
    UPDATE products
    SET 
        name = 'Bento Criollo Antioqueño (La Paisa)',
        description = 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        price = 19000,
        subcategory = 'Bentos Caseros',
        is_active = true,
        updated_at = NOW()
    WHERE id = 'b0000b11-0000-4000-a000-000000000001';

END $$;
