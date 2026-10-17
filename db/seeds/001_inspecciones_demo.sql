-- Inspecciones ficticias para demostración. Cubren los tres resultados
-- e incluyen los bordes exactos de 5% (Aprobado) y 10% (Con observaciones).
INSERT INTO inspecciones
  (producto_codigo, lote, fecha, unidades_revisadas, unidades_defectuosas)
VALUES
  ('P001', 'L-2026-001', '2026-10-01', 200,  4), -- 2%     Aprobado
  ('P002', 'L-2026-002', '2026-10-02', 100,  5), -- 5%     Aprobado (borde)
  ('P003', 'L-2026-003', '2026-10-04', 150, 12), -- 8%     Con observaciones
  ('P004', 'L-2026-004', '2026-10-06',  80,  8), -- 10%    Con observaciones (borde)
  ('P005', 'L-2026-005', '2026-10-07', 120, 18), -- 15%    Rechazado
  ('P001', 'L-2026-006', '2026-10-09', 250,  0), -- 0%     Aprobado
  ('P002', 'L-2026-007', '2026-10-11',  60, 10), -- 16.67% Rechazado
  ('P003', 'L-2026-008', '2026-10-13', 300, 21), -- 7%     Con observaciones
  ('P004', 'L-2026-009', '2026-10-15',  90,  3), -- 3.33%  Aprobado
  ('P005', 'L-2026-010', '2026-10-16',  40,  7); -- 17.5%  Rechazado
