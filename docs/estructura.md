# Estructura del proyecto BotaniK

BotaniK es una aplicación web estática organizada en HTML, CSS, JavaScript y una función serverless para el análisis con Gemini.

## Estructura actual del repositorio

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── api/
│   └── analyze-plant.js
├── docs/
│   ├── despliegue.md
│   ├── estructura.md
│   ├── firebase.md
│   ├── seguridad.md
│   ├── temas.md
│   └── versionado.md
├── CHANGELOG.md
├── VERSION
├── firestore.rules.example
├── README.md
└── AGENTS.md
```

Pueden existir archivos locales o carpetas generadas por herramientas, pero no forman parte de la estructura funcional del proyecto.

## Responsabilidades principales

### `index.html`

Contiene la estructura HTML principal:

- Login y registro familiar.
- Selección y edición de perfiles.
- Configuración de base.
- Cabecera, navegación y vistas principales.
- Radar/cámara.
- Álbum.
- Buzón y mensajes.
- Panel admin deshabilitado.
- Script temprano de tema para aplicar `data-theme` antes de pintar la interfaz.
- Carga de `css/styles.css` y `js/main.js`.

El HTML no contiene atributos `style="..."` ni eventos inline estáticos `onclick`, `onchange` u `oninput`.

### `css/styles.css`

Centraliza el sistema visual:

- Variables globales.
- Paletas de color.
- Tema oscuro y tema claro.
- Layout global.
- Componentes de login, perfiles, radar, álbum, buzón y panel admin.
- Estados visuales, responsive y accesibilidad visual básica.

El sistema visual se documenta en [temas.md](temas.md).

### `js/main.js`

Centraliza la lógica principal de la app:

- Imports de Firebase desde CDN.
- Configuración de Firestore.
- Estado global.
- Listeners de interfaz.
- Login y registro.
- Perfiles.
- Base GPS/manual.
- Radar/cámara.
- Llamada a `/api/analyze-plant`.
- XP, rarezas, niveles y álbum.
- Buzón y comunicados.
- Panel admin deshabilitado.

`js/main.js` ya no usa `innerHTML`. El renderizado dinámico se realiza mediante creación de nodos, `textContent`, `replaceChildren`, asignación de propiedades y listeners.

El archivo sigue siendo grande y no está modularizado. Cualquier separación futura debe hacerse con cuidado para no romper estado global, orden de carga, Firebase, tema, perfiles, capturas o funciones expuestas en `window`.

### `api/analyze-plant.js`

Función serverless de Vercel para análisis de plantas con Gemini.

Responsabilidades:

- Leer `GEMINI_API_KEY` desde variables de entorno.
- Construir la petición hacia Gemini.
- Procesar la respuesta.
- Devolver al frontend un resultado compatible con el flujo de capturas.

La clave Gemini no debe estar en el cliente.

### `docs/`

Contiene documentación técnica y operativa:

- `despliegue.md`: Vercel, Gemini, Firebase y checklist operativa.
- `firebase.md`: colecciones, flujos y expectativas de reglas Firestore.
- `seguridad.md`: estado de seguridad y pendientes.
- `temas.md`: sistema visual y temas.
- `versionado.md`: política SemVer.
- `estructura.md`: este documento.

## Archivos de soporte

- `VERSION`: versión actual.
- `CHANGELOG.md`: historial de versiones.
- `.env.example`: nombres de variables esperadas sin valores reales.
- `.gitignore`: exclusiones locales y secretos.
- `firestore.rules.example`: plantilla orientativa para revisar reglas Firestore.
- `AGENTS.md`: instrucciones de trabajo para agentes técnicos.

## Próximos pasos estructurales sugeridos

- Mantener `js/main.js` como archivo único mientras no haya una razón clara para modularizar.
- Si se modulariza, hacerlo por dominios pequeños y probables: perfiles, capturas, mensajes, Firebase o administración.
- Revisar responsive, accesibilidad, focus visible y `prefers-reduced-motion`.
- Mantener el panel admin deshabilitado hasta tener autenticación y autorización real.
- Evitar reintroducir secretos en cliente o HTML interpolado con datos externos.
