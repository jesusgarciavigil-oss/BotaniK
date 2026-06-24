# Changelog

El proyecto sigue versionado con SemVer.

## [0.1.0] - 2026-06-24

### Añadido

- Repositorio público inicial de BotaniK.
- Estructura separada en `index.html`, `css/styles.css` y `js/main.js`.
- Función serverless `api/analyze-plant.js` para análisis con Gemini.
- Documentación de seguridad, Firebase, publicación pública y tareas externas.

### Cambiado

- Gemini deja de llamarse directamente desde el cliente.
- Renderizado dinámico saneado para eliminar `innerHTML` de `js/main.js`.

### Seguridad

- Retiradas credenciales visibles conocidas del cliente.
- Panel admin cliente deshabilitado hasta tener autenticación y autorización real.
- Añadida checklist de publicación pública.
- Añadida guía externa para Vercel, Gemini y Firebase.

### Pendiente

- Habilitar panel admin con autorización real.
- Revisar y consolidar reglas reales de Firestore.
- Pulido visual y UX.
- Preparar futura versión `1.0.0`.
