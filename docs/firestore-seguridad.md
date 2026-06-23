# Seguridad de Firebase y Firestore en BotaniK

BotaniK usa Firestore directamente desde el cliente para cuentas familiares, perfiles, capturas, mensajes y panel de administración. Esto significa que la seguridad real no puede depender del JavaScript servido al navegador: debe estar respaldada por reglas de Firestore, autenticación y autorización verificables.

Este documento no contiene reglas reales desplegadas ni valores sensibles. Es una guía de auditoría y una lista de expectativas mínimas antes de hacer público el repositorio.

## Estado actual

- La configuración Firebase está en `js/main.js` y se entrega al navegador.
- La app usa Firestore modular desde CDN.
- El login familiar no usa Firebase Auth.
- Las cuentas familiares usan documentos de aplicación con email y clave.
- El panel de administración se activa mediante lógica de cliente.
- No hay archivo de reglas Firestore en el repositorio.
- No se ha confirmado desde este repositorio qué reglas están desplegadas en Firebase.

La configuración Firebase visible no debe tratarse como el único problema. El riesgo principal es que las reglas permitan leer o escribir datos sin autorización suficiente.

## Colecciones y expectativas de seguridad

### `cuentas_familia`

Uso actual: registro y login familiar.

Riesgos:

- Contiene claves familiares como datos de aplicación.
- Si cualquier cliente puede leer documentos ajenos, podría exponer cuentas.
- Si cualquier cliente puede crear o modificar cuentas sin control, se puede manipular el acceso.

Expectativa mínima:

- Una cuenta no debería poder leer datos de otras cuentas.
- El campo de clave no debería ser legible desde clientes no autorizados.
- A futuro, este flujo debería migrar a Firebase Auth o backend.

### `perfiles`

Uso actual: perfiles infantiles, avatares, fecha de nacimiento, modo experto y base.

Riesgos:

- Contiene datos de menores o familiares.
- Puede incluir imágenes base64 como avatar.
- La relación con cuenta depende de `usuarioEmail`.
- Si las reglas son permisivas, un usuario podría leer, editar o borrar perfiles ajenos.

Expectativa mínima:

- Cada cuenta familiar solo debería leer y modificar sus propios perfiles.
- Las operaciones admin deberían requerir rol o autorización real.
- No se debería confiar solo en filtros `where("usuarioEmail", "==", usuarioEmailActual)` del cliente.

### `capturas`

Uso actual: plantas capturadas, fotos, XP, rareza, ubicación y álbum.

Riesgos:

- Contiene imágenes en base64.
- Contiene ubicaciones y datos asociados a perfil/email.
- El XP se calcula en cliente y se guarda en documentos.
- El panel admin puede editar o borrar capturas desde cliente.

Expectativa mínima:

- Cada cuenta/perfil solo debería leer sus capturas.
- La creación de capturas debería validar propietario, perfil y campos permitidos.
- Edición y borrado global deberían estar restringidos a administración real.
- A futuro, imágenes deberían ir a almacenamiento adecuado y Firestore debería guardar metadatos.

### `alertas_xp`

Uso actual: recompensas de XP enviadas desde administración y consumidas por el cliente.

Riesgos:

- Si un cliente puede crear alertas de XP, puede inyectarse recompensas.
- Si un cliente puede marcar alertas arbitrarias como entregadas, puede alterar el flujo.
- La entrega crea capturas especiales con XP.

Expectativa mínima:

- Solo administración real debería crear alertas de XP.
- Cada perfil solo debería leer alertas dirigidas a él.
- El cambio de estado debería estar limitado a la alerta correspondiente y al perfil destinatario.

### `alertas_comunidad`

Uso actual: comunicados segmentados y buzón.

Riesgos:

- El cliente lee la colección y filtra localmente.
- Un usuario podría ver mensajes no destinados a su cuenta si las reglas permiten lectura global.
- La creación de comunicados desde panel admin se hace desde cliente.

Expectativa mínima:

- La lectura debería limitarse por destinatario o por reglas compatibles con la segmentación.
- La creación de comunicados debería quedar restringida a administración real.
- El filtrado en cliente debe considerarse solo una ayuda de interfaz, no seguridad.

## Panel de administración

El panel admin lee datos globales y permite acciones sensibles: listar cuentas, listar perfiles, moderar capturas, emitir comunicados, inyectar XP y simular capturas.

Riesgos críticos:

- Cualquier control admin implementado solo en JavaScript puede ser manipulado desde el navegador.
- Las funciones expuestas en `window` no son una frontera de seguridad.
- Si las reglas Firestore no bloquean estas operaciones, un usuario podría ejecutar acciones admin manualmente.

Expectativa mínima:

- Las acciones admin deben estar protegidas por reglas, claims, Firebase Auth o backend.
- Las lecturas globales no deberían estar disponibles para usuarios normales.
- Las operaciones de moderación, XP y comunicados deberían moverse progresivamente a backend/serverless.

## `innerHTML` y datos externos

Varias pantallas renderizan datos de Firestore con `innerHTML`, especialmente perfiles, dropdowns, panel admin, buzón y álbum.

Riesgos:

- XSS si un campo de Firestore contiene HTML o JavaScript inesperado.
- Inyección visual o manipulación de interfaz.
- Mayor riesgo si el repositorio se publica y alguien entiende los campos exactos.

Expectativa mínima:

- Sustituir progresivamente `innerHTML` por `textContent` y creación segura de nodos.
- Sanitizar cualquier HTML que deba renderizarse como HTML real.
- Priorizar buzón, panel admin, perfiles y campos procedentes de usuario.

## Bloqueantes antes de publicación pública

- Confirmar reglas Firestore reales en Firebase Console.
- Revisar si cualquier usuario puede leer `cuentas_familia`, `perfiles`, `capturas`, `alertas_xp` o `alertas_comunidad`.
- Verificar que acciones admin no dependen solo de JavaScript cliente.
- Revisar datos personales, emails reales, imágenes y ubicaciones.
- Rotar secretos que ya estuvieron expuestos en cliente o historial.

## Cambios futuros recomendados

- Migrar login familiar a Firebase Auth o un backend equivalente.
- Definir roles: cuenta familiar, perfil infantil y administración.
- Mover acciones admin sensibles a funciones serverless.
- Crear reglas Firestore versionadas y documentadas.
- Mover imágenes a Firebase Storage u otro almacenamiento adecuado.
- Reducir `innerHTML` con datos externos.

## Qué no debe asumirse

- No asumir que Firebase es seguro solo porque la app filtra datos en cliente.
- No asumir que una contraseña admin en JavaScript protege el panel.
- No asumir que ocultar botones o pantallas impide llamadas manuales a Firestore.
- No publicar el repositorio como seguro sin validar reglas desplegadas.
