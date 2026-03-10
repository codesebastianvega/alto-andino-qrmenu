-- Fase 5: Analytics & Roles
-- Crear tabla de personal para acceso PIN y relaciones
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'waiter', 'kitchen', 'cashier')),
  pin varchar(4) NOT NULL
);

-- Agregar relación en los pedidos para saber qué mesero lo tomó (opcional)
ALTER TABLE orders ADD COLUMN waiter_id uuid REFERENCES staff(id) NULL;

-- Insertar usuario admin por defecto (PIN: 9999)
INSERT INTO staff (name, role, pin) VALUES ('Admin Principal', 'admin', '9999');
-- Insertar un mesero de prueba (PIN: 1111)
INSERT INTO staff (name, role, pin) VALUES ('Mesero 1', 'waiter', '1111');
-- Insertar un usuario de cocina (PIN: 2222)
INSERT INTO staff (name, role, pin) VALUES ('Cocina General', 'kitchen', '2222');
