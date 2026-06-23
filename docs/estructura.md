# Estructura del proyecto BotaniK

Este documento describe la estructura actual de BotaniK y la estructura objetivo inicial para profesionalizar el proyecto por fases, manteniendo la aplicación como web estática y evitando cambios grandes de una sola vez.

## Estado actual

BotaniK es actualmente un proyecto web estático. La interfaz principal sigue en `index.html`, los estilos están separados en `css/styles.css` y la lógica principal de la aplicación se ha extraído a `js/main.js`.

En el estado actual se detecta:

- CSS centralizado en `css/styles.css`.
- JavaScript principal centralizado en `js/main.js`, cargado desde `index.html` mediante `<script type="module" src="./js/main.js"></script>`.
- Sin atributos `style="..."` en `index.html` tras la limpieza de estilos inline.
- Eventos inline como `onclick`, `onchange` y `oninput`.
- Funciones globales expuestas en `window`, necesarias para que los eventos inline sigan funcionando.
- Inicialización de Firebase y Firestore dentro de `js/main.js`.
- Llamadas a servicios externos desde el cliente.
- Infraestructura temprana de tema en `index.html`, basada en `data-theme`, `localStorage` y `prefers-color-scheme`, para aplicar el tema antes de pintar la interfaz.
- Sistema visual y temas documentados en `docs/temas.md`.

Esta estructura es más revisable que el prototipo inicial, pero `js/main.js` sigue siendo un archivo grande y no modularizado. La siguiente mejora debe hacerse con cuidado para no romper dependencias globales, eventos inline ni orden de carga.

## Estructura actual del repositorio

```text
/
├── index.html
├── AGENTS.md
├── README.md
├── css/
│   └── styles.css
├── js/
│   └── main.js
└── docs/
    ├── estructura.md
    ├── seguridad.md
    ├── firebase.md
    └── temas.md
```

Nota: pueden existir carpetas internas generadas por herramientas locales o por el entorno de trabajo. No forman parte de la estructura funcional documentada del proyecto.

## Responsabilidades principales dentro de `index.html`

El archivo `index.html` conserva la estructura HTML principal y algunas responsabilidades que conviene seguir reduciendo de forma progresiva:

- Pantallas de login, registro familiar, perfiles y configuración de base.
- Cabecera, selector de perfil activo y navegación inferior.
- Radar/cámara para capturar imágenes.
- Álbum de cromos y buscador de plantas.
- Modales de avatar, detalle de cromo, buzón y lector de mensajes.
- Panel de administración con estadísticas, cuentas, moderación, mensajes y simulador.
- Script temprano de tema en el `<head>`: lectura de `localStorage`, resolución de `prefers-color-scheme` y aplicación de `data-theme` antes de pintar la interfaz.
- Carga del JavaScript principal mediante `<script type="module" src="./js/main.js"></script>`.
- Eventos inline que todavía llaman a funciones expuestas en `window`.

## Responsabilidades principales dentro de `css/styles.css`

El archivo `css/styles.css` centraliza el sistema visual actual:

- Paletas base 100-900 para verde BotaniK, morado admin, crema/blanco roto, neutros oscuros, rojo peligro y dorado recompensa.
- Alias de compatibilidad para variables antiguas como `--botanik-green`, `--neon-green`, `--bg-dark`, `--surface-dark` y `--admin-purple`.
- Variables semánticas para mapear tema oscuro y tema claro.
- Bloques `:root[data-theme="dark"]` y `:root[data-theme="light"]`.
- Estilos de login, perfiles, configuración de base, modal de perfil, cabecera, dropdown, radar, álbum, cromos, buzón y panel admin.
- Overrides específicos del tema claro para conservar legibilidad sin rediseñar la app.

El detalle del sistema de temas está documentado en `docs/temas.md`.

## Responsabilidades principales dentro de `js/main.js`

El archivo `js/main.js` centraliza por ahora la lógica principal que antes estaba embebida al final de `index.html`:

- Imports de Firebase desde CDN y uso de Firestore modular.
- Configuración de servicios externos y estado global de la aplicación.
- Funciones expuestas en `window` para mantener funcionando eventos inline y plantillas dinámicas.
- Login, registro familiar y gestión de sesión.
- Creación, edición, selección y eliminación de perfiles.
- Configuración de base por GPS o entrada manual.
- Navegación entre vistas.
- Radar/cámara y análisis de plantas con Gemini.
- Sistema de XP, rareza, niveles, álbum y modal de cromo.
- Buzón, mensajes, comunicados y alertas.
- Panel de administración con estadísticas, cuentas, moderación, mensajes y simulador.

La extracción a `js/main.js` es una mejora estructural inicial. No implica todavía una modularización interna ni una separación real por dominios funcionales.

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
│   ├── estructura.md
│   └── temas.md
├── README.md
└── AGENTS.md
```

Esta estructura no implica introducir frameworks, herramientas de build ni una arquitectura nueva. Solo separa responsabilidades básicas para que el proyecto sea más fácil de leer y mantener.

## Plan de separación recomendado

1. Extraer primero el CSS a `css/styles.css`.
   - Mantener los selectores actuales.
   - No limpiar estilos inline en este mismo paso.
   - No cambiar estética ni comportamiento visual de forma intencionada.

2. Extraer después el JavaScript a `js/main.js`.
   - Mantener las funciones globales en `window`.
   - Conservar nombres de funciones, ids, clases y colecciones.
   - Mantener los eventos inline funcionando.
   - Estado actual: extracción principal realizada.

3. Eliminar eventos inline por bloques pequeños.
   - Sustituir `onclick`, `onchange` y `oninput` por `addEventListener` de forma gradual.
   - Trabajar por zonas: navegación, modales, perfiles, álbum, administración, etc.
   - Probar cada bloque antes de continuar.

4. Reducir estilos inline poco a poco.
   - Mover estilos repetidos a clases.
   - Evitar mezclar limpieza visual con cambios funcionales.
   - Conservar la apariencia actual salvo que se pida rediseño.
   - Estado actual: no quedan atributos `style="..."` en `index.html`.

5. Revisar la organización interna de `js/main.js`.
   - Auditar dependencias globales antes de dividir.
   - Identificar funciones llamadas desde HTML o plantillas `innerHTML`.
   - Mantener cuidado con Firebase, Gemini y orden de inicialización.
   - Evitar una división agresiva en módulos sin pruebas manuales.

6. Separar módulos lógicos solo si el proyecto lo necesita.
   - Por ejemplo: perfiles, capturas, mensajes, administración o Firebase.
   - No crear abstracciones prematuras.
   - Priorizar código claro y fácil de revisar.

7. Revisar y pulir el sistema visual.
   - Mantener el tema oscuro como referencia principal.
   - Ajustar el tema claro de forma visual y progresiva.
   - Revisar responsive, accesibilidad, focus visible y `prefers-reduced-motion`.
   - Probar especialmente panel admin y tablas en móvil.

## Reglas para refactors seguros

- No mezclar cambios visuales con cambios estructurales.
- No renombrar ids, clases, funciones, colecciones de Firebase ni campos en la primera extracción.
- No cambiar comportamiento mientras se separan archivos.
- Al reorganizar `js/main.js`, mantener las funciones necesarias en `window` hasta eliminar eventos inline por fases.
- No dividir JavaScript de forma agresiva sin auditar dependencias globales, Firebase, Gemini y orden de carga.
- Comprobar manualmente la app tras cada paso.
- Hacer commits pequeños cuando se trabaje con control de versiones.
- Mantener la web estática mientras no se indique lo contrario.
- Documentar cualquier cambio estructural relevante.
- Si aparece una contradicción entre documentación y código, informar antes de modificar.

## Próximos pasos técnicos sugeridos

- Probar visualmente login, perfiles, radar, álbum, modales y panel de administración.
- Probar login, registro, perfiles, selección de base, radar/cámara, álbum, mensajes y panel admin tras la extracción a `js/main.js`.
- Revisar la organización interna de `js/main.js` y planificar una posible separación por dominios.
- Revisar después los eventos inline y planificar su sustitución por bloques pequeños.
- Revisar responsive general.
- Revisar accesibilidad y focus visible.
- Revisar `prefers-reduced-motion`.
- Perfilar paleta clara y contraste real en pantallas.
- Revisar panel admin y tablas admin en móvil.
