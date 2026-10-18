# Informe de entrega: Inspecciones de calidad v1.0

**Responsable:** Carlos Pacheco · **Octubre 2026**

**Se entregó la pantalla de inspecciones de calidad completa, publicada y probada.** Registra inspecciones, calcula el resultado automáticamente y muestra el historial con filtros y totales.

## Qué se entregó

|                       |                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Demo                  | [inspecciones-calidad.vercel.app](https://inspecciones-calidad.vercel.app)                           |
| Código                | [github.com/Carlos-Devss/inspecciones-calidad](https://github.com/Carlos-Devss/inspecciones-calidad) |
| Manual de usuario     | [manual-de-usuario.md](manual-de-usuario.md)                                                         |
| Documentación técnica | [arquitectura.md](arquitectura.md)                                                                   |

## Criterios de aceptación

| Criterio                                                 | Estado | Cómo se comprueba                              |
| -------------------------------------------------------- | ------ | ---------------------------------------------- |
| Elegir producto, guardar y ver la inspección en la tabla | ✓      | Prueba automática y QA en producción           |
| La inspección se conserva al recargar                    | ✓      | Guardada en PostgreSQL                         |
| Un registro inválido no se guarda                        | ✓      | Validación en pantalla, API y base de datos    |
| Filtros y tarjetas siempre coinciden                     | ✓      | Salen de la misma respuesta; prueba automática |
| Clasificación y porcentaje global según las reglas       | ✓      | 4 pruebas obligatorias y prueba del global     |
| Estados de carga, error, vacío y confirmación            | ✓      | Pruebas automáticas                            |
| Publicado con URL accesible                              | ✓      | Vercel y Neon                                  |

## Decisiones principales

1. **El resultado no se guarda: se calcula al leer.** Si cambia el límite, todo el historial se reclasifica sin tocar datos.
2. **Validación en tres capas:** pantalla, API y base de datos.
3. **Tabla y tarjetas salen de la misma respuesta**, así nunca se contradicen.
4. **Neon como base de datos:** su plan gratuito no pausa ni borra la base, así que la demo siempre está disponible.
5. **Ambientes separados:** la demo tiene su propia base; desarrollo y pruebas usan otra.
6. **Calidad automática:** nada llega a producción sin pasar las 98 pruebas.

## Por confirmar con negocio

| Punto                       | Decisión tomada                                            |
| --------------------------- | ---------------------------------------------------------- |
| Fechas futuras              | No se permiten                                             |
| Reinspección del mismo lote | Sí se permite                                              |
| Formato del lote            | Texto libre, máximo 50 caracteres                          |
| "Más reciente"              | Por fecha de inspección; si empatan, la última capturada   |
| Límites de 5% y 10%         | Fijos en el sistema; cambiarlos requiere un ajuste técnico |

## Riesgos y pendientes

- **Volumen:** el listado carga todas las inspecciones. Con miles de registros habría que paginar.
- **Arranque en frío:** la primera carga tras un rato sin uso tarda un poco más.
- **Navegadores:** probado en Chrome y en Safari de iPhone; falta Firefox.

## Siguiente versión recomendada

1. Límites de tolerancia por producto, configurables sin programar.
2. Exportar a CSV lo que esté filtrado.
3. Tamaño de muestra sugerido según el tamaño del lote (norma AQL / ISO 2859).
4. Tipos de defecto y fotos como evidencia.
5. Corrección de capturas con historial, en lugar de borrarlas.
6. Inicio de sesión y roles (inspector y supervisor).
