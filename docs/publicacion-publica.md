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
- [x] Riesgos de accesos hardcodeados y panel admin cliente documentados en [accesos-admin.md](accesos-admin.md).
- [x] `firestore.rules.example` creado como guía orientativa para revisar reglas reales.
- [x] Primera reducción de `innerHTML` realizada en avatares, buzón y selectores sencillos.
- [x] Credenciales reales hardcodeadas retiradas del cliente en esta rama de preparación pública.
- [x] Reducción de `innerHTML` ampliada a perfiles, dropdown de perfiles y cromos del álbum.
- [x] Usos restantes de `innerHTML` eliminados de `js/main.js`, incluido panel admin deshabilitado.

### Pendiente bloqueante

- [ ] Confirmar las reglas reales desplegadas en Firebase Console.
- [ ] Comparar las reglas reales con `firestore.rules.example`.
- [ ] Bloquear lectura y escritura amplia en Firestore.
- [ ] Confirmar que el panel admin cliente no permite acciones sensibles sin protección real mediante reglas, Auth o backend.
- [ ] Mantener deshabilitado el panel admin mientras no exista autenticación y autorización real.
- [ ] Confirmar que no quedan accesos admin, accesos familiares de prueba, contraseñas ni controles hardcodeados visibles en cliente antes de publicar.
- [ ] Revocar claves Gemini antiguas que hayan estado expuestas cuando producción ya use la función serverless.
- [ ] Confirmar que Vercel tiene `GEMINI_API_KEY` configurada como variable de entorno.
- [ ] Probar un despliegue de Vercel Preview antes de promover cambios a Production.
- [ ] Revisar que no hay datos personales reales, emails reales, contraseñas ni capturas sensibles en código o documentación.
- [ ] Confirmar que cualquier clave, contraseña o acceso real que haya estado hardcodeado queda revocado, cambiado o invalidado antes de publicar.

### Pendiente recomendable / futuro

- [ ] Migrar login familiar a Firebase Auth o backend.
- [ ] Mover acciones admin sensibles a backend o funciones serverless.
- [ ] Definir roles reales para cuenta familiar, perfil infantil y administración.
- [ ] Mover imágenes a Firebase Storage u otro almacenamiento adecuado.
- [ ] Vigilar que no se reintroduzcan plantillas HTML interpoladas con datos de Firestore, formularios o servicios externos.
- [ ] Revisar XSS en cualquier plantilla dinámica nueva.
- [ ] Valorar limpieza de historial Git si se quiere una publicación más limpia.
- [ ] Valorar crear un repositorio público limpio desde cero con el código saneado como primer commit.
- [ ] Revisar historial Git y ramas antiguas como parte de una auditoría más pulcra, sin bloquear esta rama si no quedan secretos activos.

## Checklist antes de publicar

- Rotar o revocar claves de Gemini que hayan estado expuestas en cliente.
- Confirmar que la variable `GEMINI_API_KEY` está configurada en Vercel y no aparece en código cliente.
- Revisar la configuración de Firebase usada por la aplicación.
- Revisar y endurecer reglas de Firestore antes de confiar en la seguridad de los datos. Esta revisión bloquea la publicación pública.
- Revisar `firestore.rules.example` como guía orientativa y compararla con las reglas reales desplegadas.
- Revisar los accesos hardcodeados y el panel admin cliente según [accesos-admin.md](accesos-admin.md).
- No publicar el repositorio si las reglas reales permiten lectura o escritura amplia.
- No publicar el repositorio si las operaciones admin no están protegidas por reglas, Auth o backend.
- No reactivar el panel admin en cliente hasta tener protección real fuera del navegador.
- Mantener la revisión XSS como control permanente para evitar reintroducir HTML interpolado con datos externos.
- Revisar la lógica de login familiar y administración implementada en cliente.
- Revisar emails, nombres, datos personales o identificadores reales que no deban ser públicos.
- Cambiar o invalidar cualquier contraseña real que haya estado hardcodeada.
- Confirmar que el historial antiguo no contiene secretos activos. Si alguna clave o contraseña antigua sigue funcionando, eso sí bloquea la publicación.
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

También hay que revisar la guía específica de accesos hardcodeados y panel admin cliente: [accesos-admin.md](accesos-admin.md).

La publicación debe quedar bloqueada si no se ha confirmado que las reglas reales de Firestore impiden lecturas y escrituras no autorizadas sobre cuentas, perfiles, capturas, recompensas, mensajes y acciones de administración.

El panel admin actual debe tratarse como interfaz de administración, no como frontera de seguridad. Las acciones sensibles necesitan reglas, roles, Firebase Auth o backend antes de considerarse seguras.

## Historial Git

No se limpiará el historial Git en esta fase. La prioridad antes de publicar es que ninguna clave, contraseña o acceso antiguo siga activo.

Si una clave o credencial apareció alguna vez en código versionado, debe asumirse expuesta y revocarse, cambiarse o invalidarse. La limpieza de historial queda como tarea futura opcional para una publicación más pulcra.

Más adelante, cuando la app esté funcionando correctamente, se puede valorar crear un repositorio público limpio desde cero con el estado saneado como primer commit.

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
