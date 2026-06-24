# Despliegue y operaciones de BotaniK

Este documento reúne las tareas operativas para desplegar y mantener BotaniK en Vercel, Gemini y Firebase sin exponer secretos ni asumir una seguridad que todavía depende de configuración externa.

No contiene claves, contraseñas, tokens, emails reales ni datos personales.

## Estado operativo actual

- La web se despliega como proyecto estático con una función serverless.
- El frontend llama a `/api/analyze-plant` para analizar plantas.
- La función `api/analyze-plant.js` usa `GEMINI_API_KEY` desde el entorno de Vercel.
- El panel admin vive en `/admin/` y valida acceso mediante funciones serverless.
- `api/admin-login.js` usa `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`.
- `api/admin-session.js` valida sesiones admin temporales firmadas.
- Gemini ya no debe llamarse directamente desde `js/main.js`.
- Firestore sigue siendo consumido desde el cliente, por lo que la seguridad real depende de reglas desplegadas en Firebase Console.
- Firestore Rules siguen siendo el siguiente endurecimiento pendiente para proteger operaciones admin frente a accesos directos.

## Vercel

BotaniK necesita una variable de entorno para que la función serverless pueda llamar a Gemini:

```text
GEMINI_API_KEY
```

El panel admin necesita además:

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

Recomendaciones:

- Configurar `GEMINI_API_KEY` en Preview y Production.
- Configurar `ADMIN_PASSWORD` en Preview y Production con una contraseña larga y única.
- Configurar `ADMIN_SESSION_SECRET` en Preview y Production con una cadena aleatoria larga.
- No incluir valores reales en `.env.example`, documentación ni commits.
- Hacer redeploy después de crear o cambiar variables de entorno.
- Probar primero en Preview antes de promover o desplegar en Production.
- Confirmar desde el navegador que la clave no aparece en el JavaScript cliente ni en respuestas visibles.

## Gemini

La clave de Gemini debe tratarse como secreto de servidor.

Recomendaciones:

- Usar una clave nueva para la versión serverless.
- Revocar claves antiguas que hayan estado expuestas cuando la versión serverless funcione en producción.
- No pegar claves reales en chats, documentación, issues ni commits.
- Revisar errores de cuota o permisos desde Vercel y Google AI Studio sin exponer el valor de la clave.

## Firebase y Firestore

La configuración Firebase del cliente puede ser visible, pero no debe ser la frontera de seguridad. La protección real de cuentas, perfiles, capturas, mensajes y operaciones admin depende de Firestore Rules, Auth, roles o backend.

Recomendaciones:

- Revisar las reglas reales en Firebase Console.
- Comparar las reglas reales con [`../firestore.rules.example`](../firestore.rules.example).
- Confirmar que no existe lectura o escritura amplia para usuarios no autorizados.
- Confirmar que una cuenta no puede leer ni modificar perfiles o capturas ajenas.
- Confirmar que un usuario normal no puede crear XP, comunicados, simulaciones ni acciones admin.
- Confirmar que el login admin serverless no se trata como sustituto de Firestore Rules.

## Checklist operativa

Antes de un despliegue relevante:

- [ ] Confirmar que `VERSION` y `CHANGELOG.md` reflejan la versión que se quiere publicar.
- [ ] Confirmar que `GEMINI_API_KEY` está configurada en el entorno correcto de Vercel.
- [ ] Confirmar que `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` están configuradas en el entorno correcto de Vercel.
- [ ] Desplegar y probar Preview.
- [ ] Probar carga inicial de la app.
- [ ] Probar login familiar normal.
- [ ] Probar creación o selección de perfil.
- [ ] Probar cámara/radar si el navegador lo permite.
- [ ] Probar una captura real de planta.
- [ ] Probar álbum y buzón.
- [ ] Probar `/admin/` con contraseña incorrecta y correcta.
- [ ] Confirmar que `/admin/` no muestra datos sin sesión válida.
- [ ] Revisar consola del navegador y logs de Vercel ante errores.
- [ ] Revisar que no se han añadido claves, emails reales, contraseñas ni datos personales al repositorio.

## Checklist antes de publicar una nueva versión

- [ ] Revisar `CHANGELOG.md`.
- [ ] Revisar `VERSION`.
- [ ] Confirmar que no se han reintroducido secretos en cliente.
- [ ] Confirmar que Gemini sigue pasando por serverless.
- [ ] Confirmar que el panel admin sigue validando sesión mediante serverless.
- [ ] Confirmar que Firestore Rules siguen siendo adecuadas para el estado actual.
- [ ] Confirmar que cualquier clave antigua expuesta queda revocada o invalidada.
- [ ] Confirmar que las variables admin de Vercel no se han compartido ni versionado.
- [ ] Probar Production después del despliegue.

## Qué no hacer

- No subir `.env` ni variantes locales con valores reales.
- No copiar claves, tokens, contraseñas ni API keys en documentación.
- No confiar en ofuscación como seguridad real.
- No asumir que ocultar botones admin protege datos o acciones.
- No desplegar reglas Firestore de ejemplo sin adaptación, pruebas y una estrategia de autenticación.
