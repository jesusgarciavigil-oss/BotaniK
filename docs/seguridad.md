# Seguridad del proyecto BotaniK

BotaniK es una aplicación web en fase pública temprana. La app funciona, pero no debe considerarse producción completamente segura hasta consolidar autenticación, autorización, reglas de datos y revisión operativa externa.

Este documento centraliza los riesgos de seguridad actuales y las líneas de trabajo recomendadas.

## Estado actual

- Las credenciales visibles conocidas se han retirado del cliente.
- Gemini se consume mediante la función serverless `api/analyze-plant.js`.
- La clave real de Gemini debe vivir en Vercel como `GEMINI_API_KEY`.
- El panel admin está separado en `/admin/` y requiere login validado mediante serverless.
- La contraseña admin debe vivir en Vercel como `ADMIN_PASSWORD`.
- Las sesiones admin se firman con `ADMIN_SESSION_SECRET`.
- El login familiar sigue sin Firebase Auth.
- Firestore se usa desde el cliente y depende de reglas reales desplegadas en Firebase Console.
- `js/main.js` ya no usa `innerHTML`; el renderizado dinámico se migró a creación de nodos, `textContent` y listeners.

## Riesgos principales

### Firestore y reglas reales

La seguridad de cuentas, perfiles, capturas, mensajes, recompensas y operaciones admin depende de Firestore Rules. Cualquier validación hecha solo en JavaScript cliente debe considerarse insuficiente.

Hay una plantilla orientativa en [`../firestore.rules.example`](../firestore.rules.example), pero no sustituye la revisión de las reglas reales en Firebase Console.

### Login familiar

El login familiar usa lógica de cliente y documentos de aplicación. Mientras no exista Firebase Auth o backend equivalente, este flujo no debe considerarse una autenticación robusta.

Riesgos asociados:

- Uso práctico de email como identidad.
- Contraseñas familiares modeladas como datos de aplicación.
- Dependencia fuerte de reglas Firestore para limitar lecturas y escrituras.

### Panel admin

El panel admin ya no depende de credenciales en cliente. Su acceso se valida mediante funciones serverless y variables de entorno de Vercel.

Esta mejora protege la entrada al panel, pero no sustituye Firestore Rules. La protección completa de datos y acciones debe estar en una o varias capas:

- Firebase Auth.
- Firestore Rules estrictas.
- Roles o custom claims.
- Backend o funciones serverless para acciones sensibles.

Ocultar botones, pantallas o funciones cliente no es una barrera de seguridad. El login serverless tampoco blinda Firestore si las reglas reales permiten lecturas o escrituras no autorizadas.

### Gemini

Gemini ya no debe llamarse directamente desde el navegador. La función serverless reduce la exposición de la clave, pero cualquier clave que haya estado expuesta anteriormente debe considerarse comprometida y revocarse o invalidarse.

### Imágenes y datos familiares

Las capturas y avatares pueden incluir imágenes en base64 dentro de documentos Firestore. Esto puede afectar privacidad, rendimiento, costes y tamaño de documentos.

Si el proyecto crece, conviene mover imágenes a un almacenamiento adecuado, por ejemplo Firebase Storage u otra solución equivalente, y guardar en Firestore solo metadatos y referencias.

### HTML dinámico

`js/main.js` no usa `innerHTML` actualmente. Aun así, cualquier nueva funcionalidad debe evitar reintroducir HTML interpolado con datos de Firestore, formularios o servicios externos.

Regla práctica:

- Usar `textContent` para texto.
- Usar `createElement` y `appendChild` para nodos.
- Asignar imágenes con propiedades como `img.src`.
- Validar clases dinámicas contra listas permitidas.

## Recomendaciones inmediatas

- Revisar reglas reales de Firestore en Firebase Console.
- Configurar `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` en Vercel para Preview y Production.
- Mantener la contraseña admin fuera del cliente, documentación y commits.
- Mantener `GEMINI_API_KEY` solo como variable de entorno en Vercel.
- No añadir secretos al cliente ni a archivos versionados.
- Revisar la guía de despliegue antes de publicar una nueva versión: [despliegue.md](despliegue.md).
- Revisar el uso actual de Firebase/Firestore en [firebase.md](firebase.md).

## Recomendaciones futuras

- Migrar login familiar a Firebase Auth o backend.
- Definir roles reales para cuenta familiar, perfil infantil y administración.
- Valorar mover acciones admin sensibles a endpoints serverless específicos.
- Versionar y probar reglas Firestore reales cuando exista una estrategia de Auth/roles.
- Mover imágenes fuera de documentos Firestore si el volumen crece.
- Revisar responsive, accesibilidad y UX antes de una versión `1.0.0`.

## Qué no debe hacerse

- No ocultar claves mediante ofuscación como si eso fuese seguridad real.
- No subir nuevas credenciales al repositorio.
- No asumir que Firebase es seguro sin revisar y probar reglas Firestore.
- No considerar una contraseña admin en cliente como protección real.
- No convertir el login serverless en excusa para relajar Firestore Rules.
- No presentar BotaniK como producción completamente segura hasta resolver autenticación, autorización, reglas y gestión de secretos.
