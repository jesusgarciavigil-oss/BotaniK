# Publicación pública del repositorio BotaniK

BotaniK todavía es un prototipo funcional y no debe publicarse como producción segura sin revisar antes secretos, configuración, reglas de datos y accesos. Este documento sirve como checklist inicial para preparar el repositorio antes de hacerlo público.

## Checklist antes de publicar

- Rotar o revocar claves de Gemini que hayan estado expuestas en cliente.
- Revisar la configuración de Firebase usada por la aplicación.
- Revisar y endurecer reglas de Firestore antes de confiar en la seguridad de los datos.
- Revisar la lógica de login familiar y administración implementada en cliente.
- Revisar emails, nombres, datos personales o identificadores reales que no deban ser públicos.
- Revisar el historial Git para confirmar si secretos o credenciales estuvieron presentes en commits anteriores.
- Decidir si basta con rotar claves o si hace falta una limpieza de historial planificada.
- Configurar secretos en Vercel como variables de entorno cuando exista una capa preparada para leerlas de forma segura.
- No subir archivos `.env` ni variantes locales con valores reales.

## Riesgos que bloquean una publicación segura

- Claves o credenciales reales en código cliente.
- Llamadas sensibles a APIs externas directamente desde el navegador.
- Contraseñas o accesos especiales hardcodeados en JavaScript.
- Reglas de Firestore no revisadas o no documentadas.
- Validaciones de seguridad que dependan solo del cliente.
- Datos personales reales o emails que no deban exponerse.

## Historial Git

Si una clave o credencial aparece en el estado actual del código, debe asumirse que también puede estar en el historial. Antes de hacer público el repositorio, la primera medida debe ser rotar o revocar esas claves.

La limpieza de historial debe tratarse como una tarea separada, planificada y revisada con cuidado. No debe hacerse de forma improvisada ni mezclarse con cambios funcionales.

## Variables de entorno

El archivo `.env.example` documenta nombres de variables esperadas sin valores reales. Los valores reales deben mantenerse fuera del repositorio.

En una web estática pura, las variables de entorno no protegen secretos si terminan embebidas en JavaScript servido al navegador. Para claves sensibles, la solución real pasa por mover la llamada a un backend, función serverless o capa controlada fuera del cliente.

## Qué no hacer

- No subir `.env` con valores reales.
- No copiar claves, tokens, contraseñas ni API keys en documentación.
- No confiar en ofuscación como seguridad real.
- No asumir que Firebase queda protegido solo por ocultar valores del cliente.
- No reescribir historial sin un plan claro y copia de seguridad.
