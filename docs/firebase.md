# Firebase y Firestore en BotaniK

BotaniK usa Firebase/Firestore directamente desde el cliente. Esto condiciona la seguridad real de la aplicacion: cualquier validacion hecha solo en JavaScript debe considerarse insuficiente si no esta respaldada por reglas de Firestore adecuadas.

Este documento describe el uso actual detectado en `index.html`. No incluye valores reales de configuracion, claves, credenciales ni secretos.

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

Proposito aparente: guardar cuentas familiares usadas para login y registro.

Campos principales detectados:

- `email`
- `pass`

Operaciones detectadas:

- Lectura: busqueda por `email` durante el login/registro.
- Creacion: alta de una cuenta familiar nueva.
- Edicion: no detectada.
- Eliminacion: no detectada.
- Escucha en tiempo real: no detectada.

Funcionalidades relacionadas:

- Login familiar.
- Registro de nueva cuenta familiar.
- Panel de administracion, donde se listan cuentas familiares.

Notas:

- La gestion de contrasenas como campo de documento es un riesgo documentado en `docs/seguridad.md`.
- Existen accesos especiales hardcodeados en cliente que no forman parte de esta coleccion o no siempre dependen de ella.

### `perfiles`

Proposito aparente: guardar los perfiles infantiles o exploradores asociados a una cuenta familiar.

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
- Lectura global: el panel de administracion lee perfiles para estadisticas, listados, mensajes y simulaciones.
- Creacion: alta de un nuevo explorador.
- Edicion: actualizacion de nombre, fecha de nacimiento, avatar, modo experto y base.
- Eliminacion: borrado de perfiles.
- Escucha en tiempo real: no detectada.

Funcionalidades relacionadas:

- Selector de perfiles.
- Creacion y edicion de exploradores.
- Avatares por emoji o imagen.
- Configuracion de base por GPS o manual.
- Cabecera con perfil activo.
- Panel de administracion.
- Segmentacion de mensajes por cuenta o explorador.

Notas:

- La relacion entre cuenta familiar y perfil parece depender del campo `usuarioEmail`.
- La autorizacion real para leer o modificar perfiles queda pendiente de confirmar con reglas de Firestore.

### `capturas`

Proposito aparente: almacenar capturas de plantas, recompensas convertidas en capturas especiales y capturas simuladas desde administracion.

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

- Algunos documentos usan valores administrativos en campos de ubicacion.
- Algunas capturas simuladas pueden no incluir todos los campos de una captura generada por IA. Pendiente de confirmar si esto es intencionado.

Operaciones detectadas:

- Lectura por `perfil`: calculo de XP, nivel, contador de album y carga del album.
- Lectura por `perfil` y `nombreCientifico`: control de especie repetida y bonificaciones.
- Lectura global: estadisticas, feed de administracion y moderacion.
- Creacion: captura de planta desde camara/IA, recompensa de XP entregada como captura especial e inyeccion simulada desde administracion.
- Edicion: cambio de `nombreComun` y `nombreCientifico` desde moderacion.
- Eliminacion: borrado desde panel de moderacion.
- Escucha en tiempo real: no detectada directamente sobre esta coleccion.

Funcionalidades relacionadas:

- Radar/camara.
- Analisis de plantas con IA.
- Sistema de XP, rareza, niveles y anti-farmeo.
- Album de cromos.
- Modal de detalle de planta.
- Panel de administracion y moderacion.
- Simulador de capturas.

Notas:

- El campo `foto` puede contener imagenes en base64 o datos embebidos. Esto puede afectar rendimiento, costes y privacidad si el volumen crece.
- La autorizacion para leer, editar o borrar capturas debe revisarse en reglas de Firestore.

### `alertas_xp`

Proposito aparente: cola de recompensas o bonus de XP enviados desde administracion a un perfil.

Campos principales detectados:

- `perfilId`
- `xp`
- `titulo`
- `textMessage`
- `mensaje`
- `estado`
- `timestamp`

Operaciones detectadas:

- Creacion: el panel de administracion crea alertas de XP para un perfil.
- Escucha en tiempo real: el cliente escucha alertas pendientes por `perfilId` y `estado`.
- Edicion: al entregarse una alerta, se actualiza `estado` a entregado.
- Lectura: mediante la escucha en tiempo real.
- Eliminacion: no detectada.

Funcionalidades relacionadas:

- Bonificacion de XP desde panel de administracion.
- Notificacion de recompensa en vivo.
- Creacion automatica de una captura especial asociada a la recompensa.

Notas:

- Pendiente de confirmar si existe limpieza posterior de alertas entregadas.
- La proteccion de esta coleccion es critica: un usuario no deberia poder inyectarse XP a si mismo desde cliente.

### `alertas_comunidad`

Proposito aparente: almacenar comunicados o mensajes segmentados para exploradores, cuentas o zonas geograficas.

Campos principales detectados:

- `targetType`
- `targetValue`
- `textMessage`
- `timestamp`

Operaciones detectadas:

- Lectura global: el cliente carga los comunicados y filtra localmente cuales aplican al perfil activo.
- Creacion: el panel de administracion crea comunicados segmentados.
- Edicion: no detectada.
- Eliminacion: no detectada.
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
- Buzon historico.
- Marcado local de leidos mediante `localStorage`.
- Panel de administracion para emitir mensajes.

Notas:

- El filtrado de elegibilidad se hace en cliente despues de leer la coleccion. Pendiente de revisar si las reglas limitan el acceso segun usuario o perfil.
- El estado de lectura no parece guardarse en Firestore; se guarda localmente por perfil en `localStorage`.

## Flujos principales

### Login y registro familiar

El codigo busca cuentas en `cuentas_familia` por `email`. En modo registro crea un documento nuevo con email y clave. En modo login compara la clave introducida con el dato almacenado o con accesos especiales definidos en cliente.

Pendiente de confirmar: reglas de Firestore que impiden leer cuentas ajenas o manipular registros.

### Creacion y seleccion de perfiles

Tras el acceso familiar, el codigo consulta `perfiles` por `usuarioEmail`. Permite crear, editar, seleccionar y eliminar perfiles. La base del perfil se guarda en el campo `base` tras GPS o entrada manual.

Pendiente de confirmar: reglas que garanticen que una cuenta solo gestiona sus propios perfiles.

### Capturas de plantas

El radar/camara analiza una imagen con IA desde el navegador. Si se acepta como planta, se crea un documento en `capturas` con datos botanicos, foto, XP, ubicacion y perfil asociado.

Antes de guardar se consulta `capturas` por `perfil` y `nombreCientifico` para calcular si es nueva especie, nuevo territorio o muestra repetida.

### XP y recompensas

El XP total se calcula leyendo `capturas` del perfil activo y sumando el campo `xp`. Las recompensas administrativas usan `alertas_xp`: el cliente escucha alertas pendientes, las marca como entregadas y crea una captura especial que suma XP.

### Mensajes y comunicados

Los comunicados se guardan en `alertas_comunidad`. El cliente lee la coleccion, filtra segun `targetType` y `targetValue`, muestra banner/buzon y guarda el estado de lectura en `localStorage`.

### Panel de administracion

El panel lee `cuentas_familia`, `perfiles` y `capturas` para estadisticas, feed, cuentas y moderacion. Tambien crea `alertas_xp`, crea `alertas_comunidad`, edita/borrar capturas y genera capturas simuladas.

Pendiente de confirmar: proteccion real de estas operaciones mediante reglas o autenticacion. En el codigo actual hay control de acceso en cliente, pero eso no equivale a autorizacion segura.

## Riesgos o puntos pendientes

- No se ven reglas de Firestore en el repositorio.
- La seguridad real depende de esas reglas.
- No se debe confiar en validaciones solo de cliente.
- Hay que revisar permisos por cuenta, perfil y administracion.
- Hay que confirmar si las lecturas globales usadas por administracion estan restringidas a usuarios autorizados.
- Hay que confirmar si existen indices necesarios para consultas compuestas como `perfil` + `nombreCientifico` o `perfilId` + `estado`.

## Recomendaciones futuras

- Documentar las reglas esperadas de Firestore por coleccion y tipo de usuario.
- Anadir un archivo de reglas de Firestore al repositorio si procede.
- Valorar Firebase Auth u otro sistema de autenticacion real.
- Separar configuracion sensible y no incluir secretos reales en el cliente ni en documentacion.
- Revisar indices y consultas si el proyecto crece.
- Definir permisos especificos para cuenta familiar, perfil infantil y administracion.
