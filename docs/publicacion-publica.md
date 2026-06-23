# Publicación pública del repositorio BotaniK

BotaniK todavía es un prototipo funcional y no debe publicarse como producción segura sin revisar antes secretos, configuración, reglas de datos y accesos. Este documento sirve como checklist inicial para preparar el repositorio antes de hacerlo público.

## Estado actual de preparación pública

Esta sección es el punto central de decisión antes de hacer público el repositorio. Cada punto debe actualizarse en commits posteriores cuando cambie de estado.

### Resuelto

- [x] Estructura del proyecto separada en `index.html`, `css/styles.css` y `js/main.js`.
- [x] Gemini movido a función serverless en `api/analyze-plant.js`.
- [x] `.env.example` creado sin claves reales.
- [x] `.gitignore` preparado para evitar subir `.env` y variantes locales.
- [x] Riesgos de Firestore y panel admin documentados en [firestore-seguridad.md](firestore-seguridad.md).
- [x] `firestore.rules.example` creado como guía orientativa para revisar reglas reales.
- [x] Primera reducción de `innerHTML` realizada en avatares, buzón y selectores sencillos.

### Pendiente bloqueante

- [ ] Confirmar las reglas reales desplegadas en Firebase Console.
- [ ] Comparar las reglas reales con `firestore.rules.example`.
- [ ] Bloquear lectura y escritura amplia en Firestore.
- [ ] Confirmar que el panel admin no permite acciones sensibles sin protección real mediante reglas, Auth o backend.
- [ ] Revisar o eliminar accesos admin, contraseñas o controles hardcodeados visibles en cliente.
- [ ] Revocar claves Gemini antiguas que hayan estado expuestas cuando producción ya use la función serverless.
- [ ] Confirmar que Vercel tiene `GEMINI_API_KEY` configurada como variable de entorno.
- [ ] Probar un despliegue de Vercel Preview antes de promover cambios a Production.
- [ ] Revisar que no hay datos personales reales, emails reales, contraseñas ni capturas sensibles en código o documentación.
- [ ] Revisar historial Git y ramas antiguas antes de hacer público el repositorio.

### Pendiente recomendable / futuro

- [ ] Migrar login familiar a Firebase Auth o backend.
- [ ] Mover acciones admin sensibles a backend o funciones serverless.
- [ ] Definir roles reales para cuenta familiar, perfil infantil y administración.
- [ ] Mover imágenes a Firebase Storage u otro almacenamiento adecuado.
- [ ] Terminar la reducción de `innerHTML` en perfiles, álbum y panel admin.
- [ ] Revisar XSS en plantillas grandes y datos renderizados desde Firestore o formularios.
- [ ] Valorar limpieza de historial Git si se quiere una publicación más limpia.

## Checklist antes de publicar

- Rotar o revocar claves de Gemini que hayan estado expuestas en cliente.
- Confirmar que la variable `GEMINI_API_KEY` está configurada en Vercel y no aparece en código cliente.
- Revisar la configuración de Firebase usada por la aplicación.
- Revisar y endurecer reglas de Firestore antes de confiar en la seguridad de los datos. Esta revisión bloquea la publicación pública.
- Revisar `firestore.rules.example` como guía orientativa y compararla con las reglas reales desplegadas.
- No publicar el repositorio si las reglas reales permiten lectura o escritura amplia.
- No publicar el repositorio si las operaciones admin no están protegidas por reglas, Auth o backend.
- Mantener la revisión XSS/`innerHTML` como pendiente hasta completar la limpieza de panel admin, álbum y perfiles.
- Revisar la lógica de login familiar y administración implementada en cliente.
- Revisar emails, nombres, datos personales o identificadores reales que no deban ser públicos.
- Revisar el historial Git para confirmar si secretos o credenciales estuvieron presentes en commits anteriores.
- Decidir si basta con rotar claves o si hace falta una limpieza de historial planificada.
- Configurar secretos en Vercel como variables de entorno cuando exista una capa preparada para leerlas de forma segura.
- No subir archivos `.env` ni variantes locales con valores reales.

## Riesgos que bloquean una publicación segura

- Claves o credenciales reales en código cliente.
- Llamadas sensibles a APIs externas directamente desde el navegador.
- Contraseñas o accesos especiales hardcodeados en JavaScript.
- Reglas de Firestore no revisadas o no documentadas.
- Panel de administración con operaciones sensibles protegidas solo desde el cliente.
- Validaciones de seguridad que dependan solo del cliente.
- Datos personales reales o emails que no deban exponerse.

## Firestore y panel de administración

Antes de publicar el repositorio hay que revisar la guía de seguridad de Firestore: [firestore-seguridad.md](firestore-seguridad.md).

La publicación debe quedar bloqueada si no se ha confirmado que las reglas reales de Firestore impiden lecturas y escrituras no autorizadas sobre cuentas, perfiles, capturas, recompensas, mensajes y acciones de administración.

El panel admin actual debe tratarse como interfaz de administración, no como frontera de seguridad. Las acciones sensibles necesitan reglas, roles, Firebase Auth o backend antes de considerarse seguras.

## Historial Git

Si una clave o credencial aparece en el estado actual del código, debe asumirse que también puede estar en el historial. Antes de hacer público el repositorio, la primera medida debe ser rotar o revocar esas claves.

La limpieza de historial debe tratarse como una tarea separada, planificada y revisada con cuidado. No debe hacerse de forma improvisada ni mezclarse con cambios funcionales.

## Variables de entorno

El archivo `.env.example` documenta nombres de variables esperadas sin valores reales. Los valores reales deben mantenerse fuera del repositorio.

En una web estática pura, las variables de entorno no protegen secretos si terminan embebidas en JavaScript servido al navegador. Para claves sensibles, la solución real pasa por mover la llamada a un backend, función serverless o capa controlada fuera del cliente.

## Qué no hacer

- No subir `.env` con valores reales.
- No copiar claves, tokens, contraseñas ni API keys en documentación.
- No confiar en ofuscación como seguridad real.
- No asumir que Firebase queda protegido solo por ocultar valores del cliente.
- No reescribir historial sin un plan claro y copia de seguridad.

## Decisión de publicación

No se debe hacer público el repositorio mientras exista cualquier punto marcado como pendiente bloqueante.

Esta documentación debe usarse como checklist de avance. Cada punto resuelto debe actualizarse aquí en commits posteriores, junto con la evidencia o documentación correspondiente cuando proceda.

La publicación pública debe tratarse como una decisión explícita, no como una consecuencia automática de que la app funcione o esté desplegada.
