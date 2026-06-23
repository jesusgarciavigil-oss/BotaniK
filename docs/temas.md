# Sistema de temas de BotaniK

BotaniK cuenta con un sistema inicial de temas claro/oscuro preparado sobre CSS estático y JavaScript en cliente. El tema oscuro sigue siendo la base visual principal del proyecto. El tema claro es funcional y usable, pero su estética fina todavía puede ajustarse en fases posteriores.

Este documento describe el estado actual del sistema visual y las reglas recomendadas para modificarlo sin romper la app.

## Funcionamiento general

El tema activo se aplica mediante el atributo `data-theme` en el elemento raíz del documento:

```html
<html data-theme="dark">
```

Los valores visuales finales se definen en `css/styles.css` mediante variables CSS. La infraestructura temprana de JavaScript para aplicar el tema sigue en `index.html` y se ejecuta pronto durante la carga para reducir parpadeos visuales. La lógica principal de la aplicación está separada en `js/main.js`.

El sistema reconoce tres preferencias de usuario:

- `system`: usa el tema del sistema operativo o navegador.
- `dark`: fuerza el tema oscuro.
- `light`: fuerza el tema claro.

La preferencia se guarda en `localStorage` con la clave:

```text
botanik-theme
```

Cuando el valor guardado es `system`, o cuando no existe preferencia guardada, la app consulta `prefers-color-scheme`. Si el sistema indica tema claro, aplica `data-theme="light"`; en cualquier otro caso aplica `data-theme="dark"`.

## Selector visible

El selector visible de tema está dentro del modal de creación/edición de perfil. Actualmente no aparece en login, cabecera ni navegación inferior.

El selector ofrece estas opciones:

- Sistema
- Oscuro
- Claro

Cambiar el selector actualiza `localStorage` y aplica el tema inmediatamente. No recarga la página.

## Relación con perfiles y datos

La preferencia de tema no se guarda en Firestore. Tampoco se ha añadido ningún campo al modelo de datos de perfiles.

Esto significa que la preferencia es local al navegador/dispositivo. Es una decisión intencionada para mantener el cambio pequeño, reversible y sin tocar la estructura de datos.

## Arquitectura CSS

El archivo `css/styles.css` centraliza el sistema visual actual. Su base de color está organizada en paletas 100-900 y una capa semántica de tema.

### Paletas base

Las paletas actuales son:

- `--green-*`: identidad BotaniK, acentos vegetales y estados principales.
- `--purple-*`: identidad del panel de administración.
- `--cream-*`: fondos claros en crema/blanco roto para el tema claro.
- `--neutral-*`: neutros oscuros, superficies oscuras y textos base.
- `--red-*`: peligro, error y botón `SCAN`.
- `--gold-*`: recompensas, rarezas y elementos dorados.

Estas paletas funcionan como tokens base. No deberían usarse para tomar decisiones de componente salvo cuando haya una razón clara.

### Alias de compatibilidad

Se conservan variables antiguas como alias para no romper reglas existentes ni obligar a una migración masiva:

- `--botanik-green`
- `--neon-green`
- `--accent-green`
- `--bg-dark`
- `--surface-dark`
- `--admin-purple`
- `--admin-purple-dark`
- `--admin-surface`

Mientras sigan en uso, estos alias deben mantenerse. Pueden reducirse más adelante solo si una fase específica lo plantea y se prueba visualmente.

### Variables semánticas

Los componentes deben priorizar variables semánticas. Las principales son:

- `--bg`
- `--surface`
- `--surface-2`
- `--surface-3`
- `--surface-elevated`
- `--surface-overlay`
- `--text`
- `--text-strong`
- `--text-muted-semantic`
- `--primary`
- `--primary-strong`
- `--accent`
- `--border`
- `--border-subtle`
- `--border-accent`
- `--border-accent-strong`

También existen tokens semánticos de soporte para superficies, formularios, overlays, sombras y administración, como `--field-bg`, `--hover-bg`, `--overlay-modal`, `--admin-page-bg` y `--shadow-component-*`.

### Mapeo de temas

`css/styles.css` define dos mapas principales:

- `:root[data-theme="dark"]`
- `:root[data-theme="light"]`

Cada uno asigna las variables semánticas a valores de las paletas base. El objetivo es que los componentes dependan de la capa semántica y no de colores sueltos.

## Estado actual

Actualmente está terminado:

- CSS extraído a `css/styles.css`.
- Atributos `style="..."` eliminados de `index.html`.
- CSS organizado por secciones.
- Paletas base 100-900 creadas.
- Variables semánticas de tema definidas.
- Tema oscuro explícito.
- Tema claro funcional.
- Selector visible dentro del modal de perfil.
- Preferencia de tema guardada en `localStorage`.

Queda pendiente:

- Ajustar la estética final del tema claro.
- Revisar contraste en todas las pantallas reales.
- Revisar responsive.
- Revisar accesibilidad y focus visible.
- Revisar `prefers-reduced-motion`.
- Revisar panel admin en móvil.
- Revisar tablas admin en móvil.

## Reglas para futuras modificaciones

- No añadir colores hardcodeados sin necesidad.
- Priorizar las paletas 100-900 para nuevos tokens base.
- Priorizar variables semánticas en componentes.
- Mantener los alias antiguos mientras sigan en uso.
- No tocar el tema oscuro sin prueba visual completa.
- No presentar el tema claro como definitivo hasta revisar contraste y pantallas reales.
- No guardar preferencias de tema en Firestore salvo decisión explícita futura.
- No mover el selector de tema a cabecera, login o navegación sin una decisión de diseño previa.
- Mantener cromos, rarezas, botón `SCAN` y panel admin con identidad visual propia.
- No mezclar cambios de tema con cambios funcionales de Firebase, Gemini, perfiles o administración.

## Pruebas recomendadas

Antes de cerrar cualquier cambio visual conviene probar:

- Login y registro en oscuro y claro.
- Crear y editar perfil en oscuro y claro.
- Selector de tema con `Sistema`, `Oscuro` y `Claro`.
- Cabecera y dropdown de perfiles.
- Navegación inferior.
- Radar y cámara.
- Álbum y cromos.
- Modal de cromo 3D.
- Buzón y lector de mensajes.
- Panel admin completo: pestañas, tarjetas, tablas, formularios y botones.
