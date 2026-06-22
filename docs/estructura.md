# Estructura del proyecto BotaniK

Este documento describe la estructura actual de BotaniK y la estructura objetivo inicial para profesionalizar el proyecto por fases, manteniendo la aplicacion como web estatica y evitando cambios grandes de una sola vez.

## Estado actual

BotaniK es actualmente un proyecto web estatico. La logica, la interfaz y los estilos estan concentrados principalmente en `index.html`.

En el estado actual se detecta:

- CSS embebido dentro de una etiqueta `<style>`.
- JavaScript embebido dentro de `<script type="module">`.
- Estilos inline aplicados directamente en elementos HTML.
- Eventos inline como `onclick`, `onchange` y `oninput`.
- Funciones globales expuestas en `window`, necesarias para que los eventos inline sigan funcionando.
- Inicializacion de Firebase y Firestore dentro del propio `index.html`.
- Llamadas a servicios externos desde el cliente.

Esta estructura es razonable para un prototipo, pero dificulta revisar cambios, aislar responsabilidades y mejorar seguridad/mantenibilidad sin riesgo.

## Estructura actual del repositorio

```text
/
├── index.html
├── AGENTS.md
├── README.md
└── docs/
    ├── seguridad.md
    └── firebase.md
```

Nota: pueden existir carpetas internas generadas por herramientas locales o por el entorno de trabajo. No forman parte de la estructura funcional documentada del proyecto.

## Responsabilidades principales dentro de `index.html`

El archivo `index.html` concentra responsabilidades que conviene separar de forma progresiva:

- Pantallas de login, registro familiar, perfiles y configuracion de base.
- Cabecera, selector de perfil activo y navegacion inferior.
- Radar/camara para capturar imagenes.
- Album de cromos y buscador de plantas.
- Modales de avatar, detalle de cromo, buzon y lector de mensajes.
- Panel de administracion con estadisticas, cuentas, moderacion, mensajes y simulador.
- Estilos visuales generales de la aplicacion.
- Inicializacion de Firebase y Firestore.
- Logica de perfiles, capturas, XP, rareza, niveles, mensajes y administracion.
- Llamadas a servicios externos, especialmente analisis de imagenes con IA.
- Manejo de estado global en variables y funciones del modulo.

## Estructura objetivo inicial

La primera estructura objetivo debe seguir siendo sencilla:

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── assets/
│   └── img/
├── docs/
│   ├── seguridad.md
│   ├── firebase.md
│   └── estructura.md
├── README.md
└── AGENTS.md
```

Esta estructura no implica introducir frameworks, herramientas de build ni una arquitectura nueva. Solo separa responsabilidades basicas para que el proyecto sea mas facil de leer y mantener.

## Plan de separacion recomendado

1. Extraer primero el CSS a `css/styles.css`.
   - Mantener los selectores actuales.
   - No limpiar estilos inline en este mismo paso.
   - No cambiar estetica ni comportamiento visual de forma intencionada.

2. Extraer despues el JavaScript a `js/main.js`.
   - Mantener las funciones globales en `window`.
   - Conservar nombres de funciones, ids, clases y colecciones.
   - Mantener los eventos inline funcionando.

3. Eliminar eventos inline por bloques pequenos.
   - Sustituir `onclick`, `onchange` y `oninput` por `addEventListener` de forma gradual.
   - Trabajar por zonas: navegacion, modales, perfiles, album, administracion, etc.
   - Probar cada bloque antes de continuar.

4. Reducir estilos inline poco a poco.
   - Mover estilos repetidos a clases.
   - Evitar mezclar limpieza visual con cambios funcionales.
   - Conservar la apariencia actual salvo que se pida rediseño.

5. Separar modulos logicos solo si el proyecto lo necesita.
   - Por ejemplo: perfiles, capturas, mensajes, administracion o Firebase.
   - No crear abstracciones prematuras.
   - Priorizar codigo claro y facil de revisar.

## Reglas para refactors seguros

- No mezclar cambios visuales con cambios estructurales.
- No renombrar ids, clases, funciones, colecciones de Firebase ni campos en la primera extraccion.
- No cambiar comportamiento mientras se separan archivos.
- Comprobar manualmente la app tras cada paso.
- Hacer commits pequenos cuando se trabaje con control de versiones.
- Mantener la web estatica mientras no se indique lo contrario.
- Documentar cualquier cambio estructural relevante.
- Si aparece una contradiccion entre documentacion y codigo, informar antes de modificar.

## Proximos pasos tecnicos sugeridos

- Verificar que `index.html` ejecuta sin errores antes de extraer nada.
- Extraer CSS a `css/styles.css`.
- Probar visualmente login, perfiles, radar, album, modales y panel de administracion.
- Extraer JavaScript a `js/main.js`.
- Probar login, registro, perfiles, seleccion de base, radar/camara, album, mensajes y panel admin si es posible.
- Revisar despues los eventos inline y planificar su sustitucion por bloques pequenos.
