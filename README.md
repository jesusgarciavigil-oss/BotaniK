# BotaniK

🌐 Web desplegada: https://botanik-nine.vercel.app/

BotaniK es una aplicación web familiar orientada a la exploración botánica. Incluye perfiles infantiles, radar/cámara, álbum de plantas, recompensas, comunicados y un panel de administración para seguimiento y simulación.

## Estado actual del proyecto

El proyecto está en estado de prototipo funcional y en proceso de profesionalización. Actualmente se mantiene como web estática y está concentrado principalmente en `index.html`.

En ese archivo conviven HTML, CSS, JavaScript, estilos inline, eventos inline, configuración de Firebase, llamadas a servicios externos y lógica de aplicación. La prioridad actual es documentar el estado real, separar responsabilidades poco a poco y conservar el comportamiento existente.

Este proyecto no debe considerarse una aplicación de producción segura en su estado actual.

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
- Separar CSS en `css/styles.css`.
- Separar JavaScript en `js/main.js`.
- Revisar reglas de Firestore.
- Planificar la salida de secretos fuera del cliente.
