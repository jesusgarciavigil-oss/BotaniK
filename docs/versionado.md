# Versionado de BotaniK

BotaniK usará versionado SemVer para controlar la evolución del proyecto de forma clara y revisable.

La versión actual inicial es `0.1.0`.

## Criterio general

Las versiones `0.x.x` representan una fase pública temprana o prototipo avanzado. La aplicación puede funcionar y estar publicada, pero todavía conserva pendientes relevantes antes de considerarse estable.

La versión `1.0.0` queda reservada para una versión estable con panel admin protegido mediante autorización real, seguridad externa validada y pulido visual suficiente.

## Tipos de versión

- `PATCH`: correcciones pequeñas, documentación, bugs menores o ajustes compatibles.
- `MINOR`: funcionalidades nuevas o mejoras importantes compatibles.
- `MAJOR`: cambios incompatibles o salto a una versión estable `1.0.0`.

## Cómo actualizar la versión

Para publicar una nueva versión:

1. Modificar el archivo `VERSION`.
2. Añadir una entrada nueva en `CHANGELOG.md`.
3. Actualizar `README.md` si procede.
4. Crear un tag Git cuando toque.

## Estado actual

`0.1.0` marca la base pública inicial saneada: estructura separada, Gemini fuera del cliente, documentación de seguridad y despliegue, y panel admin cliente deshabilitado hasta tener una solución real de autenticación y autorización.
