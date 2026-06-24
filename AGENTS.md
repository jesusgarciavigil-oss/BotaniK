# AGENTS.md

## Rol del agente

Actúa como asistente técnico para profesionalizar y mantener este proyecto web sin romper su comportamiento actual.

El proyecto parte de una aplicación web prototipo concentrada principalmente en un único `index.html`, con HTML, CSS, JavaScript, estilos inline, eventos inline, Firebase y lógica de aplicación mezclados. El objetivo es mejorar la estructura, legibilidad, seguridad y mantenibilidad mediante cambios pequeños, verificables y progresivos.

## Objetivo general del proyecto

BotaniK es una aplicación web familiar orientada a exploración botánica, perfiles infantiles, álbum de plantas, recompensas, radar/cámara, mensajes y panel de administración.

La prioridad es conservar la experiencia actual y mejorar el proyecto por fases:

1. Documentar el estado actual.
2. Separar estructura, estilos y lógica.
3. Reducir acoplamiento.
4. Mejorar seguridad.
5. Mejorar mantenibilidad.
6. Preparar una base más profesional para futuras evoluciones.

## Reglas de trabajo

Antes de modificar código, revisa el contexto del proyecto y explica brevemente el plan de cambio.

No hagas refactors grandes en una sola intervención.

No cambies nombres de funciones, ids, clases, colecciones de Firebase ni estructuras de datos salvo que sea estrictamente necesario y esté justificado.

No elimines funcionalidad existente sin indicarlo claramente.

No introduzcas frameworks, build tools, TypeScript, React, Vite, dependencias externas ni cambios de arquitectura profunda salvo petición explícita.

Mantén el proyecto funcionando como web estática mientras no se indique lo contrario.

Prioriza cambios pequeños, fáciles de revisar y revertir.

## Documentación del proyecto

Cuando existan archivos como `README.md`, `docs/`, `SECURITY.md`, `CHANGELOG.md` o cualquier documentación equivalente, léelos antes de proponer o ejecutar cambios.

La documentación debe considerarse fuente de verdad del proyecto junto con el código.

Si detectas contradicciones entre documentación y código, informa antes de modificar.

Cuando hagas cambios estructurales relevantes, propón también la actualización de la documentación correspondiente.

## Calidad documental y revisión de cambios

Toda documentación en español debe escribirse con tildes y gramática cuidada. Evita textos sin acentos salvo en nombres técnicos, comandos, rutas, ids, clases, funciones, colecciones o bloques de código.

Mantén un tono claro, práctico y honesto. No maquilles riesgos técnicos o de seguridad.

Durante una corrección gramatical o de estilo, no cambies rutas, comandos, nombres de archivos, nombres de colecciones, campos de Firestore, funciones, ids, clases, URLs ni bloques de código.

Las correcciones de estilo no deben alterar el significado técnico. No reescribas documentación de forma agresiva si solo se pide corrección.

No copies valores reales de claves, credenciales, tokens, API keys ni contraseñas en documentación, comentarios, explicaciones o resúmenes. Si detectas secretos, menciónalos solo como riesgo general, sin reproducirlos. No propongas ofuscación como solución real de seguridad.

En resúmenes de cambios, usa rutas relativas del repositorio, por ejemplo `README.md` o `docs/seguridad.md`. No uses rutas absolutas locales como `C:/Users/...` en explicaciones o resúmenes.

Indica claramente qué archivos se modificaron y cuáles se leyeron sin cambios. No afirmes verificaciones que no se hayan realizado realmente.

Controla el alcance de cada tarea: si la tarea es documental, no toques código salvo petición explícita; si la tarea es de código, no la mezcles con redacción documental salvo que sea necesario.

Mantén commits pequeños y con una sola intención. No hagas commits automáticamente salvo petición explícita.

Si durante el trabajo aparece una regla útil y estable para el proyecto, propón añadirla a `AGENTS.md`. No modifiques `AGENTS.md` en cada tarea por defecto, solo cuando aporte una mejora clara.

## Flujo recomendado de trabajo

Para cada tarea:

1. Revisar los archivos afectados.
2. Explicar el cambio propuesto.
3. Aplicar el cambio mínimo necesario.
4. Comprobar que no se rompe la funcionalidad existente.
5. Resumir qué se ha cambiado y qué queda pendiente.

Cuando sea posible, agrupa cambios por intención:

- estructura de carpetas
- separación de CSS
- separación de JavaScript
- limpieza de HTML
- documentación
- seguridad
- accesibilidad
- responsive
- refactor de funciones
- mejora visual

## Seguridad

Presta especial atención a claves, tokens, contraseñas, credenciales, API keys y lógica sensible expuesta en cliente.

No añadas nuevas claves reales al repositorio.

No repitas claves sensibles en explicaciones, documentación o comentarios.

Si encuentras secretos en el código, indica el riesgo y recomienda moverlos fuera del cliente, revocarlos o regenerarlos si el repositorio ha sido compartido.

No implementes soluciones falsas de seguridad. Si algo sigue siendo inseguro por ejecutarse en cliente, dilo claramente.

## Estilo de código

Mantén el idioma español en nombres existentes si el proyecto ya lo usa.

Respeta el estilo visual actual de BotaniK salvo que se pida rediseño.

Evita cambios cosméticos innecesarios mezclados con cambios funcionales.

Evita crear abstracciones prematuras.

Prefiere código claro y explícito frente a soluciones demasiado inteligentes.

Cuando se extraiga JavaScript, mantén inicialmente las funciones globales necesarias en `window` para no romper los `onclick` existentes. La sustitución de eventos inline por `addEventListener` debe hacerse más adelante y por bloques.

Cuando se extraiga CSS, conserva primero los selectores actuales. La limpieza de estilos inline debe hacerse después, en pasos separados.

## Estructura actual de referencia

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── config/
│   ├── core/
│   ├── features/
│   └── services/
├── admin/
├── api/
├── docs/
├── assets/
│   └── img/
├── README.md
└── AGENTS.md
```

`js/main.js` actúa como orquestador de la app familiar. La lógica funcional principal vive en módulos bajo `js/core/`, `js/config/`, `js/services/` y `js/features/`. La estructura detallada se documenta en `docs/estructura.md`.

Evita devolver lógica de dominio a `js/main.js` salvo que sea estrictamente necesario. Mantén `admin/` y `api/` separados de la app familiar.

## Commits y ramas

No hagas commits automáticamente salvo petición explícita.

Cuando se pida preparar un commit, sugiere un mensaje breve, claro y convencional.

Ejemplos:

```text
docs: añadir guía inicial del proyecto
refactor: separar estilos en archivo CSS
refactor: mover lógica principal a archivo JS
docs: documentar configuración y uso local
security: documentar riesgos de claves en cliente
```

## Criterio de finalización

Una tarea se considera terminada cuando:

- el cambio pedido está aplicado,
- la app conserva su comportamiento esperado,
- no se han mezclado cambios no relacionados,
- se ha explicado qué se modificó,
- se han indicado riesgos o tareas pendientes relevantes.

## Prioridades actuales

Las prioridades iniciales son:

1. Crear documentación base del proyecto.
2. Separar CSS y JavaScript del `index.html`.
3. Mantener la aplicación funcionando igual que antes.
4. Identificar riesgos de seguridad sin intentar ocultarlos.
5. Preparar el proyecto para futuras mejoras sin sobrediseñarlo.

## Qué evitar

Evita reescribir toda la aplicación desde cero.

Evita migrar a frameworks sin autorización.

Evita tocar Firebase o la estructura de datos sin una tarea concreta.

Evita cambiar la estética general en la misma tarea que un refactor técnico.

Evita mezclar limpieza, rediseño, seguridad y nuevas funcionalidades en el mismo cambio.

Evita respuestas demasiado largas cuando el cambio sea simple.
