# Seguridad del proyecto BotaniK

BotaniK es actualmente un prototipo funcional de aplicación web estática. Sirve como base de trabajo para validar la experiencia y profesionalizar el proyecto por fases, pero no debe considerarse una aplicación de producción segura en su estado actual.

Este documento resume los riesgos visibles en el código actual y propone pasos prácticos para reducirlos sin cambiar todavía la arquitectura ni el comportamiento de la aplicación.

## Riesgos detectados

- Claves y API keys expuestas en cliente: la aplicación contiene configuración y claves utilizadas directamente desde JavaScript del navegador. Cualquier persona con acceso a la app servida puede inspeccionar esos valores.
- Credenciales o accesos hardcodeados en JavaScript: los accesos reales conocidos se han retirado del cliente en la rama de preparación pública, pero cualquier lógica de acceso escrita solo en cliente sigue sin ser una protección real.
- Login familiar sin Firebase Auth: el flujo de acceso no usa un sistema de autenticación gestionado como Firebase Auth. La validación se hace desde la propia aplicación cliente.
- Contraseñas gestionadas desde Firestore como datos de aplicación: el código registra y compara claves familiares usando documentos de Firestore. Este modelo expone demasiado la seguridad a las reglas de la base de datos y a la lógica del cliente.
- Llamadas a Gemini: el análisis de imágenes pasa por una función serverless para evitar que nuevas claves queden expuestas en el cliente. Las claves que ya estuvieron en cliente deben considerarse comprometidas y rotarse antes de publicar el repositorio. Este cambio mejora ese bloque, pero no resuelve los riesgos pendientes de Firestore, panel admin y accesos hardcodeados.
- Panel admin deshabilitado en rama pública: el acceso admin queda bloqueado hasta que exista autenticación y autorización real mediante reglas, roles o backend.
- Dependencia crítica de las reglas de Firestore: la seguridad real de cuentas, perfiles, capturas, mensajes y acciones de administración depende de reglas de Firestore que no están documentadas aquí. Si las reglas son permisivas, el cliente no basta para proteger datos ni acciones.
- Posible riesgo de XSS por HTML dinámico: se han eliminado los usos de `innerHTML` en `js/main.js` y se ha migrado el renderizado a creación de nodos, `textContent` y listeners. Aun así, cualquier nueva plantilla dinámica debe revisarse para no reintroducir HTML interpolado con datos de Firestore, formularios o servicios externos.
- Fotos en base64 dentro de documentos Firestore: las imágenes se guardan como cadenas base64 en documentos. Esto puede aumentar costes, tamaño de documentos, tiempos de carga y superficie de exposición de datos personales o familiares.

## Recomendaciones inmediatas

- No publicar el repositorio sin revisar antes secretos, credenciales, claves y configuraciones sensibles.
- Si el repositorio ya se ha compartido, revisar, revocar o regenerar las claves afectadas.
- Revisar las reglas de Firestore antes de considerar seguros los datos o acciones de la aplicación.
- Revisar la guía específica de Firestore y panel admin: [firestore-seguridad.md](firestore-seguridad.md).
- Revisar la guía específica de accesos hardcodeados y panel admin cliente: [accesos-admin.md](accesos-admin.md).
- No añadir nuevos secretos al cliente ni a archivos versionados.
- Documentar la configuración sensible usando nombres de variables o descripciones, pero sin incluir valores reales.
- Tratar cualquier protección implementada solo en JavaScript cliente como una ayuda de interfaz, no como una barrera de seguridad.
- Revisar el checklist de publicación pública antes de abrir el repositorio: [publicacion-publica.md](publicacion-publica.md).

## Recomendaciones futuras

- Mover llamadas sensibles a un backend, función serverless o capa controlada fuera del navegador.
- Usar Firebase Auth u otro sistema de autenticación real para cuentas familiares y administración.
- Revisar la autorización por usuario, perfil y rol, especialmente para panel de administración, mensajes, capturas e inyección de XP.
- Sustituir progresivamente `innerHTML` por creación segura de nodos DOM, asignación con `textContent` o sanitización explícita cuando sea necesario renderizar HTML.
- Completar la auditoría XSS de las plantillas dinámicas que todavía renderizan datos de Firestore, formularios o respuestas externas.
- Mover imágenes a un almacenamiento adecuado si el proyecto crece, por ejemplo Firebase Storage u otra solución equivalente, guardando en Firestore solo metadatos y referencias.
- Documentar colecciones, reglas esperadas y permisos por tipo de usuario antes de ampliar funcionalidades.

## Qué NO debe hacerse

- No ocultar claves mediante ofuscación como si eso fuese seguridad real. La ofuscación puede dificultar la lectura, pero no protege un secreto incluido en cliente.
- No subir nuevas credenciales al repositorio.
- No asumir que Firebase es seguro sin revisar y probar las reglas de Firestore.
- No considerar una contraseña admin en cliente como protección real.
- No presentar el estado actual como producción segura hasta que existan autenticación, autorización, reglas y gestión de secretos adecuadas.
