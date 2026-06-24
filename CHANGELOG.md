# Changelog

El proyecto sigue versionado con SemVer.

## [0.3.0] - 2026-06-24

### Cambiado

- Modularizada la app familiar para reducir la responsabilidad de `js/main.js`.
- Separada la lógica cliente en módulos `core`, `config`, `services` y `features`.
- `js/main.js` queda como orquestador principal de imports, inicialización, listeners, callbacks y estado visual compartido.
- Separadas responsabilidades de auth familiar, perfiles, álbum, modal de cromo, buzón, recompensas/XP, base GPS/manual, radar y capturas.
- Encapsulada la comunicación con el análisis IA en `js/services/plant-analysis.js`.
- Documentada la nueva estructura modular en `docs/estructura.md`.

### Limpieza

- Eliminados restos heredados del archivo monolítico, incluyendo helpers muertos y secciones vacías del orquestador.

### Sin cambios funcionales visibles

- No se prevén cambios visibles para usuarios finales.
- No se cambia el modelo de datos, endpoints, seguridad, CSS, diseño visual ni panel admin.

## [0.2.1] - 2026-06-24

### Corregido

- Corregido el cambio de pestañas del panel admin separado.
- Ajustadas las rutas del panel admin para que cargue correctamente desde `/admin` y `/admin/`.

## [0.2.0] - 2026-06-24

### Añadido

- Panel admin separado en `/admin/`.
- Login admin mediante funciones serverless de Vercel.
- Sesión admin temporal firmada con `ADMIN_SESSION_SECRET`.
- Variables documentadas `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`.

### Cambiado

- La app familiar deja de incluir el HTML del panel admin.
- La lógica admin se mueve fuera de `js/main.js` a `admin/admin.js`.
- El acceso admin antiguo desde el login familiar se sustituye por un aviso hacia `/admin/`.

### Seguridad

- La contraseña admin ya no vive en el cliente ni en Git.
- El panel admin solo se muestra tras validar sesión contra backend serverless.
- Firestore Rules siguen siendo el siguiente endurecimiento pendiente para proteger datos y operaciones frente a accesos directos.

### Pendiente

- Revisar y consolidar reglas reales de Firestore.
- Valorar mover operaciones admin sensibles a endpoints serverless específicos.
- Migrar login familiar a Firebase Auth o backend.
- Preparar futura versión `1.0.0`.

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
