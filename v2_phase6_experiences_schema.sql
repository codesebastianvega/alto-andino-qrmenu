-- Fase 6: Experiencias
-- Tabla principal de experiencias (catas, talleres, tours, etc.)
CREATE TABLE experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  short_description text,
  type text DEFAULT 'event' CHECK (type IN ('event', 'workshop', 'tasting', 'tour', 'dinner', 'premium')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  capacity int NOT NULL DEFAULT 10,
  duration_minutes int DEFAULT 60,
  image_url text,
  gallery_urls text[],
  includes text[],
  location text,
  is_active boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  next_date timestamptz,
  dates jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabla de reservas / bookings
CREATE TABLE experience_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid REFERENCES experiences(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  guests int DEFAULT 1,
  selected_date timestamptz NOT NULL,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Experiencias de ejemplo
INSERT INTO experiences (title, short_description, description, type, price, capacity, duration_minutes, location, includes, is_active, dates) VALUES
(
  'Cata de Cafés de Origen',
  'Descubre los sabores únicos del café colombiano en una experiencia sensorial guiada.',
  'Sumérgete en el mundo del café de especialidad colombiano. Guiados por nuestro barista experto, explorarás las diferencias entre granos de Huila, Nariño y Sierra Nevada. Incluye degustación de 5 variedades, maridaje con chocolate artesanal y un pack de café para llevar a casa.',
  'tasting',
  85000,
  12,
  90,
  'Terraza 2do Piso',
  ARRAY['Degustación de 5 cafés', 'Maridaje con chocolate artesanal', 'Pack de café para llevar', 'Certificado de catador'],
  true,
  '[{"date": "2026-03-08", "start_time": "10:00", "end_time": "11:30", "spots_left": 12}, {"date": "2026-03-15", "start_time": "10:00", "end_time": "11:30", "spots_left": 12}]'::jsonb
),
(
  'Taller de Latte Art',
  'Aprende técnicas de latte art con nuestro barista profesional.',
  'Un taller práctico donde aprenderás las técnicas fundamentales del latte art: corazón, rosetta y tulipán. Cada participante practica con equipo profesional y se lleva un delantal de regalo.',
  'workshop',
  120000,
  8,
  120,
  'Barra Principal',
  ARRAY['Equipo profesional', 'Materiales incluidos', 'Delantal de regalo', 'Bebida de cortesía'],
  true,
  '[{"date": "2026-03-09", "start_time": "15:00", "end_time": "17:00", "spots_left": 8}]'::jsonb
),
(
  'Cena Ancestral Andina',
  'Una experiencia gastronómica que rinde homenaje a los sabores ancestrales de los Andes.',
  'Menú de 5 tiempos preparado con ingredientes autóctonos: quinua, amaranto, trucha andina y tubérculos olvidados. Acompañado de chicha artesanal y música en vivo. Una noche para reconectar con nuestras raíces culinarias.',
  'dinner',
  180000,
  20,
  180,
  'Salón Principal',
  ARRAY['Menú 5 tiempos', 'Chicha artesanal ilimitada', 'Música en vivo', 'Recetario digital'],
  true,
  '[{"date": "2026-03-14", "start_time": "19:00", "end_time": "22:00", "spots_left": 20}]'::jsonb
);
