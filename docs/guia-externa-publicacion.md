# Guía externa para publicar BotaniK

Esta guía reúne las tareas externas que deben hacerse en Vercel, Google AI Studio / Gemini y Firebase antes de hacer merge, pasar a producción y valorar la publicación pública del repositorio.

No contiene claves, contraseñas, tokens ni datos personales reales.

## Para quién es esta guía

Esta guía está pensada para la persona que gestiona:

- Vercel.
- Google AI Studio / Gemini API.
- Firebase Console / Firestore.
- Despliegues Preview y Production.

No hace falta tocar código para seguir esta guía, salvo que se quiera revisar el repositorio. La idea es usarla como checklist operativo y, si hace falta, pegarla en otra IA para recibir ayuda paso a paso sin compartir secretos reales.

## Estado actual del código

- Gemini ya se ha movido a una función serverless: `api/analyze-plant.js`.
- El frontend llama a `/api/analyze-plant`.
- La clave real de Gemini ya no debe estar en `js/main.js`.
- El panel admin cliente está deshabilitado en esta rama.
- El login familiar básico puede seguir funcionando, pero sigue pendiente de una solución más segura en el futuro.
- La seguridad real de Firestore depende de las reglas desplegadas en Firebase Console.

## Tareas externas obligatorias antes de merge / producción

### 1. Vercel

Checklist:

- [ ] Entrar en el proyecto BotaniK de Vercel.
- [ ] Ir a `Settings` -> `Environment Variables`.
- [ ] Crear la variable `GEMINI_API_KEY`.
- [ ] Pegar como valor una clave Gemini nueva.
- [ ] Activarla para Preview.
- [ ] Activarla también para Production antes del merge a `main`.
- [ ] Hacer redeploy de la rama Preview.
- [ ] Probar que la Preview carga.
- [ ] Probar una captura real de planta.
- [ ] Confirmar que la clave no aparece en el navegador.

Sin `GEMINI_API_KEY`, la web puede cargar, pero el análisis de plantas fallará.

### 2. Gemini / Google AI Studio

Checklist:

- [ ] Crear una clave Gemini nueva para esta versión serverless.
- [ ] No reutilizar claves antiguas que estuvieron en el frontend.
- [ ] Cuando la versión serverless esté funcionando en producción, revocar las claves Gemini antiguas que estuvieron en el cliente.
- [ ] No pegar claves reales en chats, documentación ni commits.
- [ ] Si se usa una IA para guiar el proceso, no compartirle la clave real salvo que sea estrictamente necesario.

La rotación o revocación de claves antiguas es obligatoria antes de hacer público el repositorio.

La limpieza del historial Git no es el bloqueo principal si las claves antiguas ya no funcionan.

### 3. Firebase / Firestore

Checklist:

- [ ] Entrar en Firebase Console.
- [ ] Revisar las reglas reales de Firestore.
- [ ] Compararlas con `firestore.rules.example`.
- [ ] Confirmar que no hay lectura/escritura amplia para usuarios no autorizados.
- [ ] Confirmar que `cuentas_familia`, `perfiles`, `capturas`, `alertas_xp` y `alertas_comunidad` no quedan abiertas.
- [ ] Confirmar que un usuario normal no puede leer cuentas, perfiles o capturas ajenas.
- [ ] Confirmar que un usuario normal no puede crear XP, comunicados, simulaciones ni acciones admin.
- [ ] Confirmar que el panel admin sigue sin poder ejecutar acciones sensibles sin protección real.

No basta con que el botón admin esté oculto o deshabilitado. La seguridad real está en Firestore Rules, Auth, roles o backend.

Si las reglas actuales son permisivas, no se debe hacer público el repo todavía.

### 4. Contraseñas y accesos antiguos

Checklist:

- [ ] Cambiar o invalidar cualquier contraseña real que haya estado hardcodeada.
- [ ] Confirmar que no se reutilizaba esa contraseña en otros servicios.
- [ ] Confirmar que no quedan accesos admin/familiares reales en el código actual.
- [ ] No crear nuevas contraseñas hardcodeadas en JavaScript.

### 5. Prueba de Preview

Checklist:

- [ ] Abrir la URL Preview de Vercel.
- [ ] Probar login familiar normal.
- [ ] Probar perfiles.
- [ ] Probar cámara/radar si el navegador lo permite.
- [ ] Probar análisis de planta.
- [ ] Probar álbum.
- [ ] Probar buzón/mensajes si procede.
- [ ] Intentar acceder al admin y confirmar que aparece el mensaje de admin deshabilitado.
- [ ] Confirmar que no hay errores críticos en consola.

### 6. Paso a producción

Checklist:

- [ ] Confirmar que `GEMINI_API_KEY` está también en Production.
- [ ] Hacer merge a `main` solo después de probar Preview.
- [ ] Confirmar deploy de Production.
- [ ] Probar de nuevo una captura real en Production.
- [ ] Revocar claves Gemini antiguas después de confirmar que Production usa serverless.
- [ ] Cambiar o invalidar contraseñas antiguas.
- [ ] Revisar la checklist `docs/publicacion-publica.md`.

### 7. Antes de hacer público el repositorio

Checklist final:

- [ ] No quedan claves reales en archivos actuales.
- [ ] No quedan emails reales ni contraseñas reales en archivos actuales.
- [ ] Las claves Gemini antiguas están revocadas.
- [ ] Las contraseñas antiguas están cambiadas o invalidadas.
- [ ] Las reglas reales de Firestore están revisadas.
- [ ] El panel admin no depende de una contraseña visible en cliente.
- [ ] `docs/publicacion-publica.md` está actualizado.
- [ ] Se acepta dejar la limpieza de historial Git como mejora futura.
- [ ] Si se quiere una publicación más limpia, valorar crear un repo público nuevo con el código saneado como primer commit.

## Resumen para pegar en otra IA

```text
Estoy ayudando a publicar un proyecto llamado BotaniK.

El código ya ha sido saneado para quitar credenciales reales visibles del cliente. Gemini ya no se llama directamente desde el frontend: ahora el frontend llama a /api/analyze-plant y esa función serverless debe usar GEMINI_API_KEY desde Vercel.

Necesito que me guíes paso a paso en Vercel, Google AI Studio / Gemini y Firebase Console. No soy programador. No debo pegar claves reales, contraseñas, tokens ni datos personales en el chat.

Necesito hacer esto:

1. Crear una clave Gemini nueva en Google AI Studio.
2. Configurar GEMINI_API_KEY en Vercel para Preview y Production.
3. Redesplegar la Preview de Vercel.
4. Probar que la web carga y que una captura real de planta funciona.
5. Confirmar que la clave no aparece en el navegador.
6. Revisar las reglas reales de Firestore en Firebase Console y compararlas con firestore.rules.example.
7. Confirmar que Firestore no permite lectura ni escritura amplia a usuarios no autorizados.
8. Confirmar que un usuario normal no puede leer cuentas, perfiles o capturas ajenas.
9. Confirmar que un usuario normal no puede crear XP, comunicados, simulaciones ni acciones admin.
10. Confirmar que el panel admin está deshabilitado hasta tener autenticación y autorización real.
11. Cuando Production funcione con serverless, revocar las claves Gemini antiguas que estuvieron en el frontend.
12. Cambiar o invalidar cualquier contraseña real que haya estado hardcodeada.
13. Confirmar que no hay secretos activos antes de hacer público el repositorio.

La limpieza del historial Git no es el bloqueo principal si las claves antiguas ya no funcionan, pero más adelante se puede valorar crear un repositorio público limpio desde cero con el código saneado como primer commit.
```
