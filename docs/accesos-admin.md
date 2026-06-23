# Accesos y panel de administración en BotaniK

BotaniK mantiene actualmente un modelo de acceso propio dentro del cliente. El login familiar, algunos accesos especiales y el panel de administración dependen de lógica JavaScript visible en `js/main.js`.

Este documento no reproduce emails, contraseñas, claves, tokens ni datos personales reales. Su objetivo es dejar claro qué riesgos existen antes de hacer público el repositorio.

## Estado actual en esta rama

En la rama `security/preparar-repo-publico` se han retirado del cliente los accesos hardcodeados reales conocidos. No se han sustituido por otras credenciales ficticias funcionales.

El panel admin queda deshabilitado por defecto en esta rama pública y muestra un mensaje de bloqueo hasta que exista autenticación y autorización real.

## Modelo actual

- El login familiar se resuelve desde el navegador.
- Las cuentas familiares se consultan en Firestore mediante la colección `cuentas_familia`.
- La clave familiar se compara desde JavaScript cliente.
- El panel admin queda deshabilitado en esta rama, pero su implementación histórica dependía de lógica de cliente.
- Varias funciones administrativas están expuestas en `window` por compatibilidad con la interfaz y plantillas dinámicas.
- Las acciones sensibles dependen realmente de las reglas de Firestore y de la autorización que exista fuera del cliente.

Este modelo puede servir como prototipo privado, pero no debe tratarse como una frontera de seguridad para un repositorio público.

## Credenciales hardcodeadas

Las credenciales reales hardcodeadas conocidas se han retirado de `js/main.js` en esta rama. Aun así, cualquier credencial hardcodeada que se vuelva a introducir quedaría expuesta si el repositorio pasa a público o si una persona inspecciona el JavaScript servido por la aplicación.

También debe asumirse que cualquier credencial que haya estado versionada puede permanecer en el historial Git o en ramas antiguas. La solución no es ocultarla ni ofuscarla, sino retirarla del cliente y rotarla cuando corresponda.

## Funciones admin expuestas

Las funciones administrativas expuestas en `window` no son seguridad real. Cualquier persona con acceso al navegador puede inspeccionar o intentar invocar funciones cliente.

La protección real debe estar en una o varias de estas capas:

- Firestore Rules estrictas.
- Firebase Auth.
- Roles o custom claims.
- Backend o funciones serverless para acciones sensibles.

Ocultar botones, pantallas o nombres de funciones puede mejorar la interfaz, pero no impide llamadas manuales si las reglas de datos lo permiten.

## Riesgos detectados

- Acceso admin hardcodeado en cliente: retirado en esta rama, pero pendiente de revisar en historial y ramas antiguas.
- Acceso familiar o de prueba hardcodeado en cliente: retirado en esta rama, pero pendiente de revisar en historial y ramas antiguas.
- Contraseñas familiares guardadas como campo `pass` en Firestore.
- Acciones admin sensibles iniciadas desde el cliente: deshabilitadas por defecto en esta rama hasta tener autorización real.
- Uso de email como identidad práctica.
- Lectura global de cuentas, perfiles y capturas desde el panel admin.
- Funciones admin expuestas en `window`.
- Posible persistencia de credenciales antiguas en historial Git o ramas no revisadas.

## Acciones sensibles del panel admin

El panel admin puede iniciar operaciones que deben considerarse sensibles:

- Listar cuentas familiares.
- Listar perfiles.
- Leer capturas globales.
- Crear recompensas o XP.
- Crear comunicados.
- Editar datos de capturas.
- Borrar capturas.
- Simular capturas.

Estas acciones no deben depender solo del cliente. Antes de publicar el repositorio, hay que confirmar que Firestore Rules, Auth, roles o backend bloquean cualquier uso no autorizado.

## Checklist mínima antes de publicar

- [x] Retirar o neutralizar credenciales reales hardcodeadas en cliente en esta rama.
- [ ] Revisar historial Git y ramas antiguas por credenciales o datos reales.
- [ ] Confirmar las reglas reales de Firestore en Firebase Console.
- [ ] Proteger el panel admin con Auth, reglas, roles o backend.
- [ ] Dejar de guardar contraseñas recuperables como datos de aplicación.
- [ ] Comprobar que no quedan datos personales reales en código o documentación.
- [ ] Confirmar que ninguna acción admin sensible puede ejecutarse desde un cliente no autorizado.

## Recomendación

Los accesos hardcodeados reales ya no deberían estar en el cliente de esta rama, pero el panel admin sigue bloqueando una publicación pública segura mientras no exista protección real fuera del cliente.

La protección del panel debe planificarse como una fase de seguridad separada, con cambios pequeños y pruebas manuales de login, perfiles, mensajes, capturas y administración.
