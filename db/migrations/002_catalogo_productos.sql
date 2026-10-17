-- Catálogo inicial. ON CONFLICT evita error si algún producto ya existe.
INSERT INTO productos (codigo, nombre) VALUES
  ('P001', 'Martillo'),
  ('P002', 'Pinzas'),
  ('P003', 'Desarmador'),
  ('P004', 'Flexómetro'),
  ('P005', 'Llave ajustable')
ON CONFLICT (codigo) DO NOTHING;
