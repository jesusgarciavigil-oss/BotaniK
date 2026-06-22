# Seguridad del proyecto BotaniK

BotaniK es actualmente un prototipo funcional de aplicacion web estatica. Sirve como base de trabajo para validar la experiencia y profesionalizar el proyecto por fases, pero no debe considerarse una aplicacion de produccion segura en su estado actual.

Este documento resume los riesgos visibles en el codigo actual y propone pasos practicos para reducirlos sin cambiar todavia la arquitectura ni el comportamiento de la aplicacion.

## Riesgos detectados

- Claves y API keys expuestas en cliente: el archivo `index.html` contiene configuracion y claves utilizadas directamente desde JavaScript del navegador. Cualquier persona con acceso a la app servida puede inspeccionar esos valores.
- Credenciales o accesos hardcodeados en JavaScript: existen accesos especiales y logica de validacion escrita directamente en el cliente. Esto no debe tratarse como una proteccion real.
- Login familiar sin Firebase Auth: el flujo de acceso no usa un sistema de autenticacion gestionado como Firebase Auth. La validacion se hace desde la propia aplicacion cliente.
- Contrasenas gestionadas desde Firestore como datos de aplicacion: el codigo registra y compara claves familiares usando documentos de Firestore. Este modelo expone demasiado la seguridad a las reglas de la base de datos y a la logica del cliente.
- Llamadas a Gemini desde navegador: el analisis de imagenes llama a la API de IA directamente desde el cliente. Esto expone claves, consumo y coste potencial a cualquier usuario capaz de inspeccionar la app.
- Dependencia critica de las reglas de Firestore: la seguridad real de cuentas, perfiles, capturas, mensajes y acciones de administracion depende de reglas de Firestore que no estan documentadas aqui. Si las reglas son permisivas, el cliente no basta para proteger datos ni acciones.
- Posible riesgo de XSS por uso de `innerHTML`: varias partes de la interfaz construyen HTML con datos que pueden venir de Firestore o de entradas de usuario. Si esos datos no se controlan o sanitizan, podrian inyectar contenido no deseado.
- Fotos en base64 dentro de documentos Firestore: las imagenes se guardan como cadenas base64 en documentos. Esto puede aumentar costes, tamano de documentos, tiempos de carga y superficie de exposicion de datos personales o familiares.

## Recomendaciones inmediatas

- No publicar el repositorio sin revisar antes secretos, credenciales, claves y configuraciones sensibles.
- Si el repositorio ya se ha compartido, revisar, revocar o regenerar las claves afectadas.
- Revisar las reglas de Firestore antes de considerar seguros los datos o acciones de la aplicacion.
- No anadir nuevos secretos al cliente ni a archivos versionados.
- Documentar la configuracion sensible usando nombres de variables o descripciones, pero sin incluir valores reales.
- Tratar cualquier proteccion implementada solo en JavaScript cliente como una ayuda de interfaz, no como una barrera de seguridad.

## Recomendaciones futuras

- Mover llamadas sensibles a un backend, funcion serverless o capa controlada fuera del navegador.
- Usar Firebase Auth u otro sistema de autenticacion real para cuentas familiares y administracion.
- Revisar la autorizacion por usuario, perfil y rol, especialmente para panel de administracion, mensajes, capturas e inyeccion de XP.
- Sustituir progresivamente `innerHTML` por creacion segura de nodos DOM, asignacion con `textContent` o sanitizacion explicita cuando sea necesario renderizar HTML.
- Mover imagenes a un almacenamiento adecuado si el proyecto crece, por ejemplo Firebase Storage u otra solucion equivalente, guardando en Firestore solo metadatos y referencias.
- Documentar colecciones, reglas esperadas y permisos por tipo de usuario antes de ampliar funcionalidades.

## Que NO debe hacerse

- No ocultar claves mediante ofuscacion como si eso fuese seguridad real. La ofuscacion puede dificultar la lectura, pero no protege un secreto incluido en cliente.
- No subir nuevas credenciales al repositorio.
- No asumir que Firebase es seguro sin revisar y probar las reglas de Firestore.
- No considerar una contrasena admin en cliente como proteccion real.
- No presentar el estado actual como produccion segura hasta que existan autenticacion, autorizacion, reglas y gestion de secretos adecuadas.
