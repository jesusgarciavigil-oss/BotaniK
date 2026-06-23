# BotaniK

🌐 Web desplegada: https://botanik-nine.vercel.app/

BotaniK es una aplicación web familiar orientada a la exploración botánica. Incluye perfiles infantiles, radar/cámara, álbum de plantas, recompensas, comunicados y un panel de administración para seguimiento y simulación.

## Estado actual del proyecto

El proyecto está en estado de prototipo funcional y en proceso de profesionalización. Actualmente se mantiene como web estática. La estructura ya separa los estilos principales en `css/styles.css` y la lógica principal de la aplicación en `js/main.js`.

`index.html` mantiene la estructura HTML principal, carga `css/styles.css` y `js/main.js`, y conserva el script temprano de tema en el `<head>` para aplicar `data-theme` antes de pintar la interfaz. Los eventos inline estáticos (`onclick`, `onchange` y `oninput`) se han sustituido por listeners en `js/main.js`.

`js/main.js` centraliza por ahora imports de Firebase/CDN, configuración, estado global, listeners estáticos, funciones expuestas en `window`, login, perfiles, radar/cámara, Gemini, álbum, buzón y panel de administración. Esta extracción es una mejora estructural, pero todavía no implica modularización interna.

Aunque el HTML estático ya no contiene eventos inline, todavía pueden quedar llamadas dinámicas dentro de plantillas `innerHTML` o asignaciones de eventos generadas desde JavaScript. Por compatibilidad, no deben retirarse todavía las funciones expuestas en `window` sin auditar esos usos.

Este proyecto no debe considerarse una aplicación de producción segura en su estado actual.

## Sistema visual y temas

BotaniK usa `css/styles.css` como archivo central del sistema visual. El CSS está organizado por secciones, contiene paletas base 100-900, alias de compatibilidad y variables semánticas para mapear tema oscuro y tema claro.

El tema oscuro es la base visual principal. El tema claro ya es funcional, pero queda pendiente perfilar su estética, contraste y comportamiento responsive en una revisión visual posterior.

La preferencia de tema se guarda localmente en el navegador con `localStorage` usando la clave `botanik-theme`. No se guarda en Firestore ni modifica el modelo de datos de perfiles.

Más detalle: [docs/temas.md](docs/temas.md).

## Publicación pública

Antes de hacer público el repositorio, revisar el checklist de seguridad y publicación: [docs/publicacion-publica.md](docs/publicacion-publica.md).

## Funcionalidades principales detectadas

- Login y registro familiar.
- Gestión de perfiles infantiles.
- Avatares por emoji o imagen.
- Configuración de base por GPS o entrada manual.
- Radar/cámara para capturar muestras.
- Análisis de plantas con IA.
- Sistema de XP, rareza, niveles y álbum.
- Comunicados y mensajes segmentados.
- Panel de administración.

## Ejecución local

Como el proyecto es una web estática, puede abrirse directamente desde el navegador:

```text
index.html
```

También puede servirse la carpeta con un servidor estático simple. Por ejemplo, desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Después, abrir:

```text
http://localhost:8000
```

Algunas APIs del navegador y servicios externos pueden comportarse de forma distinta según el navegador, el origen local, los permisos de cámara/GPS y la configuración de red.

## Dependencias externas detectadas

- Firebase cargado desde CDN.
- Firestore como base de datos.
- Gemini API para análisis de imágenes.
- APIs del navegador:
  - geolocalización
  - FileReader
  - canvas
  - localStorage

## Advertencia de seguridad

El código actual contiene claves, credenciales o lógica sensible expuestas en el cliente. Estos valores no deben considerarse protegidos, ya que cualquier persona con acceso a la aplicación servida puede inspeccionar el JavaScript.

Si este repositorio ha sido compartido o publicado, se recomienda revisar, revocar o regenerar los secretos afectados y planificar su salida del cliente. También es importante revisar las reglas de Firestore, ya que la seguridad real de los datos depende de esas reglas y no solo del código de la interfaz.

Este README no copia valores reales de claves, contraseñas, tokens ni credenciales.

## Estructura actual

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── docs/
│   ├── estructura.md
│   ├── firebase.md
│   ├── seguridad.md
│   └── temas.md
├── README.md
└── AGENTS.md
```

## Estructura objetivo inicial

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
├── README.md
└── AGENTS.md
```

## Próximos pasos recomendados

- Crear documentación de seguridad.
- Documentar Firebase/Firestore.
- Revisar la organización interna de `js/main.js`.
- Valorar si merece la pena dividirlo más adelante en módulos, sin hacerlo agresivamente antes de auditar dependencias globales.
- Revisar plantillas `innerHTML` y eventos dinámicos generados desde JavaScript.
- Valorar saneamiento de HTML generado dinámicamente.
- Mantener cuidado con funciones expuestas en `window`, Firebase, Gemini y orden de carga.
- Revisar reglas de Firestore.
- Planificar la salida de secretos fuera del cliente.
- Revisar responsive, accesibilidad, focus visible, `prefers-reduced-motion` y contraste del tema claro.
