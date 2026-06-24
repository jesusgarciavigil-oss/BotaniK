# Firebase y Firestore en BotaniK

BotaniK usa Firebase/Firestore directamente desde el cliente para cuentas familiares, perfiles, capturas, recompensas y mensajes. Esto hace que Firestore Rules sean la frontera real de seguridad: los filtros y validaciones en JavaScript ayudan a la interfaz, pero no bastan para proteger datos.

Este documento describe el uso actual detectado en `js/main.js`. No incluye valores reales de configuración, claves, credenciales ni secretos.

## SDK y dependencias

- Firebase cargado desde CDN.
- Firestore modular cargado desde CDN.
- Funciones usadas de Firestore:
  - `getFirestore`
  - `collection`
  - `addDoc`
  - `getDocs`
  - `doc`
  - `deleteDoc`
  - `query`
  - `where`
  - `updateDoc`
  - `onSnapshot`

## Colecciones

### `cuentas_familia`

Propósito: registro y login familiar.

Campos principales:

- `email`
- `pass`

Operaciones:

- Lectura por `email` durante login/registro.
- Creación de cuenta familiar.

Riesgos:

- El modelo actual no usa Firebase Auth.
- El campo `pass` se gestiona como dato de aplicación.
- Si las reglas permiten lecturas amplias, se podrían exponer cuentas.

Expectativa de reglas:

- Evitar lectura global de cuentas.
- Evitar que clientes no autorizados lean campos sensibles.
- Migrar este flujo a Firebase Auth o backend en una versión futura.

### `perfiles`

Propósito: perfiles infantiles o exploradores asociados a una cuenta familiar.

Campos principales:

- `nombre`
- `fechaNacimiento`
- `avatar`
- `esExperto`
- `usuarioEmail`
- `base`

Campos detectados dentro de `base`:

- `lat`
- `lng`
- `pais`
- `provincia`
- `comarca`
- `municipio`
- `queryLabel`

Operaciones:

- Lectura por `usuarioEmail`.
- Creación, edición y eliminación de perfiles.
- Lectura global prevista para panel admin, actualmente deshabilitado hasta tener autorización real.

Riesgos:

- Puede contener datos infantiles o familiares.
- Puede incluir avatares en base64.
- La asociación por `usuarioEmail` desde cliente no es autorización real.

Expectativa de reglas:

- Cada cuenta solo debería leer y modificar sus propios perfiles.
- Las operaciones admin deben requerir rol, Auth o backend.

### `capturas`

Propósito: capturas de plantas, álbum, XP, rarezas, recompensas y capturas simuladas.

Campos principales:

- `nombreComun`
- `nombreCientifico`
- `rareza`
- `descripcion`
- `foto`
- `fecha`
- `timestamp`
- `xp`
- `loc`
- `municipioId`
- `comarcaId`
- `provinciaId`
- `paisId`
- `perfil`
- `usuarioEmail`
- `tipoHoja`
- `origen`
- `validaParaEvolucion`

Operaciones:

- Lectura por `perfil` para XP, nivel, contador y álbum.
- Lectura por `perfil` y `nombreCientifico` para controlar especies repetidas.
- Creación de capturas desde radar/cámara tras análisis serverless con Gemini.
- Creación de capturas especiales por recompensas.
- Edición y eliminación previstas en panel admin, que debe permanecer protegido fuera del cliente.

Riesgos:

- Puede contener fotos base64.
- Puede incluir ubicación y datos asociados a perfiles.
- El XP se calcula desde cliente.
- Edición o borrado global deben protegerse con autorización real.

Expectativa de reglas:

- Cada cuenta/perfil solo debería leer sus propias capturas.
- La creación debería validar propietario, perfil y campos permitidos.
- Moderación y borrado global deben requerir administración real.
- A futuro, las imágenes deberían moverse a almacenamiento adecuado.

### `alertas_xp`

Propósito: recompensas o bonus de XP enviados a perfiles.

Campos principales:

- `perfilId`
- `xp`
- `titulo`
- `textMessage`
- `mensaje`
- `estado`
- `timestamp`

Operaciones:

- Escucha en tiempo real de alertas pendientes por `perfilId` y `estado`.
- Actualización de `estado` al entregarse.
- Creación prevista desde administración real.

Riesgos:

- Si un cliente puede crear alertas, puede inyectar XP.
- Si un cliente puede marcar alertas arbitrarias, puede alterar recompensas.

Expectativa de reglas:

- Solo administración real debería crear alertas.
- Cada perfil solo debería leer alertas dirigidas a él.
- El cambio de estado debería estar limitado y validado.

### `alertas_comunidad`

Propósito: comunicados y mensajes segmentados.

Campos principales:

- `targetType`
- `targetValue`
- `textMessage`
- `timestamp`

Segmentaciones detectadas:

- `global`
- `pais`
- `provincial`
- `comarcal`
- `cuenta`
- `explorador`

Operaciones:

- Lectura de comunicados y filtrado en cliente.
- Estado de lectura local mediante `localStorage`.
- Creación prevista desde administración real.

Riesgos:

- Si la colección es legible globalmente, pueden verse mensajes no destinados al usuario.
- La creación de comunicados debe estar restringida.

Expectativa de reglas:

- Limitar lectura según destinatario o diseño de segmentación.
- Restringir creación a administración real.
- Tratar el filtrado en cliente como ayuda de interfaz, no como seguridad.

## Flujos principales

### Login y registro familiar

El código busca cuentas en `cuentas_familia` por `email`. En registro crea un documento nuevo. En login compara la clave introducida con el dato almacenado.

Pendiente: migrar a Firebase Auth o backend para una autenticación robusta.

### Perfiles

Tras el acceso familiar, el código consulta `perfiles` por `usuarioEmail`. Permite crear, editar, seleccionar y eliminar perfiles. La base del perfil se guarda en `base` tras GPS o entrada manual.

Pendiente: reglas que garanticen que una cuenta solo gestiona sus propios perfiles.

### Capturas y álbum

El radar/cámara envía una imagen a `/api/analyze-plant`. Si se acepta como planta, el cliente crea un documento en `capturas` con datos botánicos, foto, XP, ubicación y perfil asociado.

Antes de guardar se consulta `capturas` por `perfil` y `nombreCientifico` para calcular repetición, territorio y bonificaciones.

### Recompensas

El XP total se calcula leyendo `capturas` del perfil activo. Las recompensas usan `alertas_xp`: el cliente escucha alertas pendientes, las marca como entregadas y crea una captura especial que suma XP.

### Mensajes

Los comunicados se guardan en `alertas_comunidad`. El cliente filtra según `targetType` y `targetValue`, muestra banner/buzón y guarda lectura en `localStorage`.

### Panel admin

El panel admin cliente está deshabilitado hasta tener autorización real. Las operaciones históricas de administración, como lecturas globales, XP, comunicados, edición, borrado o simulaciones, deben protegerse con Auth, reglas, roles o backend antes de reactivarse.

## Reglas Firestore

Existe una plantilla orientativa en [`../firestore.rules.example`](../firestore.rules.example).

Esa plantilla:

- Deniega por defecto.
- Documenta riesgos por colección.
- Sirve como referencia para revisar reglas reales.
- No debe desplegarse sin adaptación, pruebas y una estrategia de autenticación/roles.

## Recomendaciones futuras

- Migrar login familiar a Firebase Auth o backend.
- Definir permisos por cuenta, perfil y administración.
- Mover acciones admin sensibles a funciones serverless.
- Versionar reglas reales de Firestore cuando exista un modelo de Auth/roles.
- Revisar índices para consultas compuestas como `perfil` + `nombreCientifico` o `perfilId` + `estado`.
- Mover imágenes a Firebase Storage u otro almacenamiento si el proyecto crece.
