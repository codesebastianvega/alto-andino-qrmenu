-- Fase 4: Programación Horaria (Dayparting)
-- Añadir campos para controlar la visibilidad de categorías por hora

ALTER TABLE categories 
ADD COLUMN available_from time NULL,
ADD COLUMN available_to time NULL;

-- Comentarios explicativos
COMMENT ON COLUMN categories.available_from IS 'Hora de inicio de disponibilidad (ej. 07:00). Si es null, está disponible siempre (junto a available_to).';
COMMENT ON COLUMN categories.available_to IS 'Hora de fin de disponibilidad (ej. 11:30). Si es null, está disponible siempre.';
