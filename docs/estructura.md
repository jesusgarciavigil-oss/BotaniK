# Estructura del proyecto BotaniK

BotaniK es una aplicación web familiar organizada como web estática con módulos JavaScript, estilos CSS, un panel admin separado y endpoints serverless para operaciones de backend.

## Estructura general actual

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── config/
│   │   └── firebase.js
│   ├── core/
│   │   ├── constants.js
│   │   ├── dom.js
│   │   ├── navigation.js
│   │   ├── state.js
│   │   ├── theme-bootstrap.js
│   │   └── theme.js
│   ├── features/
│   │   ├── album.js
│   │   ├── auth.js
│   │   ├── base.js
│   │   ├── captures.js
│   │   ├── card-modal.js
│   │   ├── mailbox.js
│   │   ├── profiles.js
│   │   ├── radar.js
│   │   └── rewards.js
│   └── services/
│       └── plant-analysis.js
├── api/
│   ├── admin-login.js
│   ├── admin-session.js
│   └── analyze-plant.js
├── admin/
│   ├── admin.css
│   ├── admin.js
│   └── index.html
├── docs/
├── CHANGELOG.md
├── VERSION
├── firestore.rules.example
├── README.md
└── AGENTS.md
```

Resumen de carpetas:

- `admin/`: panel de administración separado.
- `api/`: endpoints serverless.
- `css/`: estilos de la app familiar.
- `docs/`: documentación técnica y operativa.
- `js/core/`: utilidades transversales sin lógica de negocio pesada.
- `js/config/`: configuración cliente.
- `js/services/`: comunicación con servicios externos o backend.
- `js/features/`: módulos funcionales de la app familiar.
- `js/main.js`: orquestador principal de la app familiar.

Pueden existir archivos locales o carpetas generadas por herramientas, pero no forman parte de la estructura funcional del proyecto.

## `index.html`

Contiene la estructura HTML principal de la app familiar:

- Login y registro familiar.
- Selección y edición de perfiles.
- Configuración de base.
- Cabecera, navegación y vistas principales.
- Radar/cámara.
- Álbum.
- Buzón y mensajes.
- Carga de `js/core/theme-bootstrap.js`, `css/styles.css` y `js/main.js`.

El bootstrap temprano de tema vive en un archivo externo para evitar scripts inline.

## `css/styles.css`

Centraliza el sistema visual:

- Variables globales.
- Paletas de color.
- Tema oscuro y tema claro.
- Layout global.
- Componentes de login, perfiles, radar, álbum, buzón y panel admin.
- Estados visuales, responsive y accesibilidad visual básica.

El sistema visual se documenta en [temas.md](temas.md).

## `js/main.js`

`js/main.js` es el orquestador principal de la app familiar. Ya no concentra la lógica funcional completa de la aplicación.

Responsabilidades actuales:

- Importar módulos.
- Inicializar módulos funcionales.
- Registrar listeners estáticos de interfaz.
- Conectar callbacks entre módulos.
- Mantener puentes de compatibilidad global necesarios para el HTML y el DOM dinámico.
- Mantener utilidades compartidas que todavía usan varios módulos.
- Actualizar el estado visual general compartido, como XP, rango y contadores.
- Arrancar la app.

Los cruces entre dominios deben pasar por `main.js` siempre que sea razonable. Por ejemplo, capturas puede avisar a álbum, modal y recompensas mediante callbacks configurados desde el orquestador.

## `js/core/`

Contiene piezas transversales de la app familiar:

- `constants.js`: constantes puras compartidas, como rarezas, rangos, títulos y mensajes reutilizados.
- `dom.js`: helpers DOM compartidos para limpiar nodos, crear texto y renderizar valores seguros.
- `state.js`: estado mutable compartido de la app familiar.
- `navigation.js`: navegación principal entre vistas.
- `theme.js`: lectura, guardado, aplicación y sincronización de tema.
- `theme-bootstrap.js`: bootstrap mínimo de tema cargado antes del CSS para reducir parpadeo visual.

Estos módulos no deben convertirse en contenedores de lógica de negocio pesada.

## `js/config/`

### `firebase.js`

Centraliza la configuración pública cliente de Firebase y la inicialización de Firestore para la app familiar.

También reexporta las funciones de Firestore que usan los módulos del cliente. No debe incluir claves privadas ni secretos.

## `js/services/`

### `plant-analysis.js`

Encapsula la llamada a `/api/analyze-plant`.

Responsabilidades:

- Construir la petición al endpoint serverless.
- Mantener el payload esperado por el backend.
- Devolver al flujo de capturas la respuesta en el formato esperado.

## `js/features/`

Contiene módulos funcionales de la app familiar:

- `auth.js`: login, registro familiar y cierre de sesión.
- `profiles.js`: perfiles familiares, avatares, edición, selección y selector de cabecera.
- `album.js`: carga, memoria y renderizado del álbum de cromos botánicos.
- `card-modal.js`: visualizador de detalle del cromo y acciones del modal.
- `mailbox.js`: buzón histórico y lectura de comunicados.
- `rewards.js`: recompensas en vivo, alertas de comunidad y toast de biomasa.
- `base.js`: base de exploración, GPS, entrada manual y guardado de base del perfil.
- `radar.js`: disparador del radar/cámara.
- `captures.js`: procesamiento de foto, compresión, análisis IA, cálculo de XP y guardado de capturas.

Los módulos de dominio no deben acoplarse innecesariamente entre sí. Cuando una acción afecta a varios dominios, `main.js` debe coordinarla mediante callbacks o exports claros.

## `api/`

Contiene endpoints serverless:

- `api/analyze-plant.js`: análisis de plantas con Gemini.
- `api/admin-login.js`: validación de acceso admin.
- `api/admin-session.js`: validación de sesión admin.

Los endpoints serverless están separados de la app estática. No deben mezclarse con módulos de `js/features/`.

## `admin/`

Contiene el panel admin separado de la app familiar:

- `admin/index.html`
- `admin/admin.js`
- `admin/admin.css`

El panel admin mantiene su propia estructura y no debe mezclarse con la modularización de la app familiar.

## Principios de arquitectura

- `main.js` coordina cruces entre módulos.
- `state.js` centraliza estado mutable compartido.
- `firebase.js` centraliza la configuración cliente de Firebase.
- `plant-analysis.js` encapsula la llamada a `/api/analyze-plant`.
- Los módulos de `features/` deben representar dominios funcionales claros.
- Los cruces entre perfiles, álbum, recompensas, capturas, base y modal deben pasar por callbacks u orquestación.
- `admin/` sigue separado y no debe mezclarse con la app familiar.
- `/api` sigue separado como capa serverless.
- No se deben añadir claves privadas, tokens ni secretos a la documentación ni al cliente.

## Entorno local

Live Server, Five Server, `python -m http.server` u otros servidores estáticos pueden servir la app familiar, pero no ejecutan endpoints serverless de `/api`.

Para probar `/api/analyze-plant` en local hace falta un entorno compatible con Vercel, por ejemplo:

```bash
vercel dev
```

Si la app se sirve desde un servidor estático local y una captura llama a `/api/analyze-plant`, puede aparecer un error como `405 Method Not Allowed` o una respuesta no válida. Ese caso no implica necesariamente un fallo del código de capturas; indica que el servidor local no está ejecutando la función serverless.

## Archivos de soporte

- `VERSION`: versión actual.
- `CHANGELOG.md`: historial de versiones.
- `.env.example`: nombres de variables esperadas sin valores reales.
- `.gitignore`: exclusiones locales y secretos.
- `firestore.rules.example`: plantilla orientativa para revisar reglas Firestore.
- `AGENTS.md`: instrucciones de trabajo para agentes técnicos.

## Próximos pasos estructurales sugeridos

- Mantener `main.js` como orquestador y evitar devolverle lógica de dominio ya separada.
- Revisar documentación tras cada fase estructural relevante.
- Revisar responsive, accesibilidad, focus visible y `prefers-reduced-motion` en fases específicas.
- Revisar Firestore Rules en una rama o tarea centrada en seguridad.
