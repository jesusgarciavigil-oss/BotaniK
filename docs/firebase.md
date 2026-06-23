# Firebase y Firestore en BotaniK

BotaniK usa Firebase/Firestore directamente desde el cliente. Esto condiciona la seguridad real de la aplicación: cualquier validación hecha solo en JavaScript debe considerarse insuficiente si no está respaldada por reglas de Firestore adecuadas.

Este documento describe el uso actual detectado en `js/main.js`. No incluye valores reales de configuración, claves, credenciales ni secretos.

## SDK y dependencias detectadas

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

## Colecciones detectadas

### `cuentas_familia`

Propósito aparente: guardar cuentas familiares usadas para login y registro.

Campos principales detectados:

- `email`
- `pass`

Operaciones detectadas:

- Lectura: busqueda por `email` durante el login/registro.
- Creación: alta de una cuenta familiar nueva.
- Edición: no detectada.
- Eliminación: no detectada.
- Escucha en tiempo real: no detectada.

Funcionalidades relacionadas:

- Login familiar.
- Registro de nueva cuenta familiar.
- Panel de administración, donde se listan cuentas familiares.

Notas:

- La gestión de contraseñas como campo de documento es un riesgo documentado en `docs/seguridad.md`.
- Existen accesos especiales hardcodeados en cliente que no forman parte de esta colección o no siempre dependen de ella.

### `perfiles`

Propósito aparente: guardar los perfiles infantiles o exploradores asociados a una cuenta familiar.

Campos principales detectados:

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

Operaciones detectadas:

- Lectura: busqueda por `usuarioEmail` para cargar perfiles de una familia.
- Lectura global: el panel de administración lee perfiles para estadísticas, listados, mensajes y simulaciones.
- Creación: alta de un nuevo explorador.
- Edición: actualización de nombre, fecha de nacimiento, avatar, modo experto y base.
- Eliminación: borrado de perfiles.
- Escucha en tiempo real: no detectada.

Funcionalidades relacionadas:

- Selector de perfiles.
- Creación y edición de exploradores.
- Avatares por emoji o imagen.
- Configuración de base por GPS o manual.
- Cabecera con perfil activo.
- Panel de administración.
- Segmentación de mensajes por cuenta o explorador.

Notas:

- La relación entre cuenta familiar y perfil parece depender del campo `usuarioEmail`.
- La autorización real para leer o modificar perfiles queda pendiente de confirmar con reglas de Firestore.

### `capturas`

Propósito aparente: almacenar capturas de plantas, recompensas convertidas en capturas especiales y capturas simuladas desde administración.

Campos principales detectados:

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

Campos usados en capturas especiales o simuladas:

- Algunos documentos usan valores administrativos en campos de ubicación.
- Algunas capturas simuladas pueden no incluir todos los campos de una captura generada por IA. Pendiente de confirmar si esto es intencionado.

Operaciones detectadas:

- Lectura por `perfil`: cálculo de XP, nivel, contador de álbum y carga del álbum.
- Lectura por `perfil` y `nombreCientifico`: control de especie repetida y bonificaciones.
- Lectura global: estadísticas, feed de administración y moderación.
- Creación: captura de planta desde cámara/IA, recompensa de XP entregada como captura especial e inyección simulada desde administración.
- Edición: cambio de `nombreComun` y `nombreCientifico` desde moderación.
- Eliminación: borrado desde panel de moderación.
- Escucha en tiempo real: no detectada directamente sobre esta colección.

Funcionalidades relacionadas:

- Radar/cámara.
- Análisis de plantas con IA.
- Sistema de XP, rareza, niveles y anti-farmeo.
- Álbum de cromos.
- Modal de detalle de planta.
- Panel de administración y moderación.
- Simulador de capturas.

Notas:

- El campo `foto` puede contener imágenes en base64 o datos embebidos. Esto puede afectar rendimiento, costes y privacidad si el volumen crece.
- La autorización para leer, editar o borrar capturas debe revisarse en reglas de Firestore.

### `alertas_xp`

Propósito aparente: cola de recompensas o bonus de XP enviados desde administración a un perfil.

Campos principales detectados:

- `perfilId`
- `xp`
- `titulo`
- `textMessage`
- `mensaje`
- `estado`
- `timestamp`

Operaciones detectadas:

- Creación: el panel de administración crea alertas de XP para un perfil.
- Escucha en tiempo real: el cliente escucha alertas pendientes por `perfilId` y `estado`.
- Edición: al entregarse una alerta, se actualiza `estado` a entregado.
- Lectura: mediante la escucha en tiempo real.
- Eliminación: no detectada.

Funcionalidades relacionadas:

- Bonificación de XP desde panel de administración.
- Notificacion de recompensa en vivo.
- Creación automática de una captura especial asociada a la recompensa.

Notas:

- Pendiente de confirmar si existe limpieza posterior de alertas entregadas.
- La protección de esta colección es crítica: un usuario no debería poder inyectarse XP a sí mismo desde cliente.

### `alertas_comunidad`

Propósito aparente: almacenar comunicados o mensajes segmentados para exploradores, cuentas o zonas geográficas.

Campos principales detectados:

- `targetType`
- `targetValue`
- `textMessage`
- `timestamp`

Operaciones detectadas:

- Lectura global: el cliente carga los comunicados y filtra localmente cuáles aplican al perfil activo.
- Creación: el panel de administración crea comunicados segmentados.
- Edición: no detectada.
- Eliminación: no detectada.
- Escucha en tiempo real: no detectada.

Segmentaciones detectadas:

- `global`
- `pais`
- `provincial`
- `comarcal`
- `cuenta`
- `explorador`

Funcionalidades relacionadas:

- Banner de comunicado satelital.
- Buzón histórico.
- Marcado local de leidos mediante `localStorage`.
- Panel de administración para emitir mensajes.

Notas:

- El filtrado de elegibilidad se hace en cliente después de leer la colección. Pendiente de revisar si las reglas limitan el acceso según usuario o perfil.
- El estado de lectura no parece guardarse en Firestore; se guarda localmente por perfil en `localStorage`.

## Flujos principales

### Login y registro familiar

El código busca cuentas en `cuentas_familia` por `email`. En modo registro crea un documento nuevo con email y clave. En modo login compara la clave introducida con el dato almacenado o con accesos especiales definidos en cliente.

Pendiente de confirmar: reglas de Firestore que impiden leer cuentas ajenas o manipular registros.

### Creación y selección de perfiles

Tras el acceso familiar, el código consulta `perfiles` por `usuarioEmail`. Permite crear, editar, seleccionar y eliminar perfiles. La base del perfil se guarda en el campo `base` tras GPS o entrada manual.

Pendiente de confirmar: reglas que garanticen que una cuenta solo gestiona sus propios perfiles.

### Capturas de plantas

El radar/cámara envía una imagen a una función serverless de análisis con IA. Si se acepta como planta, el cliente crea un documento en `capturas` con datos botánicos, foto, XP, ubicación y perfil asociado.

Antes de guardar se consulta `capturas` por `perfil` y `nombreCientifico` para calcular si es nueva especie, nuevo territorio o muestra repetida.

### XP y recompensas

El XP total se calcula leyendo `capturas` del perfil activo y sumando el campo `xp`. Las recompensas administrativas usan `alertas_xp`: el cliente escucha alertas pendientes, las marca como entregadas y crea una captura especial que suma XP.

### Mensajes y comunicados

Los comunicados se guardan en `alertas_comunidad`. El cliente lee la colección, filtra según `targetType` y `targetValue`, muestra banner/buzón y guarda el estado de lectura en `localStorage`.

### Panel de administración

El panel lee `cuentas_familia`, `perfiles` y `capturas` para estadísticas, feed, cuentas y moderación. También crea `alertas_xp`, crea `alertas_comunidad`, edita/borra capturas y genera capturas simuladas.

Pendiente de confirmar: protección real de estas operaciones mediante reglas o autenticación. En el código actual hay control de acceso en cliente, pero eso no equivale a autorización segura.

## Riesgos o puntos pendientes

- No se ven reglas de Firestore en el repositorio.
- La seguridad real depende de esas reglas.
- No se debe confiar en validaciones solo de cliente.
- Hay que revisar permisos por cuenta, perfil y administración.
- Hay que confirmar si las lecturas globales usadas por administración están restringidas a usuarios autorizados.
- Hay que confirmar si existen índices necesarios para consultas compuestas como `perfil` + `nombreCientifico` o `perfilId` + `estado`.
- La guía específica de riesgos y expectativas de seguridad está en `docs/firestore-seguridad.md`.

## Recomendaciones futuras

- Documentar las reglas esperadas de Firestore por colección y tipo de usuario.
- Añadir un archivo de reglas de Firestore al repositorio si procede.
- Valorar Firebase Auth u otro sistema de autenticación real.
- Separar configuración sensible y no incluir secretos reales en el cliente ni en documentación.
- Revisar índices y consultas si el proyecto crece.
- Definir permisos específicos para cuenta familiar, perfil infantil y administración.
