# Versionado de BotaniK

BotaniK usa versionado SemVer para controlar la evolución del proyecto de forma clara, revisable y fácil de mantener.

La versión activa del proyecto se mantiene en [`../VERSION`](../VERSION).

## Criterio general

Las versiones `0.x.x` representan la evolución inicial pública del proyecto. En esta etapa la aplicación ya puede estar publicada y contar con funcionalidades completas, pero el producto sigue creciendo mediante mejoras funcionales, refactorizaciones internas y ajustes de experiencia de usuario.

La versión `1.0.0` queda reservada para una primera versión estable de referencia, con la arquitectura principal consolidada, el panel admin integrado de forma definitiva, la experiencia visual pulida y la documentación técnica alineada con el estado final del proyecto.

## Tipos de versión

- `PATCH`: correcciones pequeñas, ajustes compatibles, documentación o bugs menores.
- `MINOR`: funcionalidades nuevas, mejoras importantes compatibles o refactorizaciones relevantes que mantengan el comportamiento esperado.
- `MAJOR`: cambios incompatibles, cambios estructurales grandes o salto a una versión estable `1.0.0`.

## Cómo actualizar la versión

Para publicar una nueva versión:

1. Modificar el archivo `VERSION`.
2. Añadir una entrada nueva en `CHANGELOG.md`.
3. Actualizar `README.md` si procede.
4. Actualizar esta guía si cambia el criterio de versionado.
5. Crear un tag Git cuando se decida marcar una release formal.
