# BotaniK

🌐 Web desplegada: https://botanik-nine.vercel.app/

BotaniK es una app web familiar para explorar plantas de forma lúdica. La experiencia gira en torno a perfiles infantiles, un radar/cámara para capturar muestras botánicas y un álbum donde se coleccionan especies descubiertas.

Cada captura puede analizarse con IA mediante una función serverless, y la app transforma el resultado en una ficha con nombre, rareza, XP y progreso. La idea es convertir pequeños paseos y observaciones en una aventura de exploración natural.

El proyecto incluye recompensas, niveles, comunicados y buzón de mensajes.

## Estado del proyecto

La versión activa del proyecto se mantiene en [`VERSION`](VERSION).

BotaniK está en desarrollo activo y cuenta con una primera versión pública funcional. La app familiar, el análisis mediante IA, el álbum de especies y el panel admin separado ya están integrados.

## Funcionalidades

- Login y registro familiar.
- Gestión de perfiles infantiles.
- Avatares por emoji o imagen.
- Configuración de base por GPS o entrada manual.
- Radar/cámara para capturar muestras.
- Análisis de plantas con IA mediante serverless.
- Sistema de XP, rarezas, niveles y álbum.
- Comunicados y buzón.
- Tema claro/oscuro.
- Panel admin separado con acceso validado mediante serverless.

## Tecnologías

- HTML, CSS y JavaScript.
- Firebase/Firestore.
- Vercel Serverless Functions.
- Gemini API mediante backend serverless.
- APIs del navegador:
  - cámara
  - geolocalización
  - canvas
  - FileReader
  - localStorage

## Ejecución local

BotaniK puede servirse como web estática desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Después, abrir:

```text
http://localhost:8000
```

Abrir `index.html` directamente en el navegador también puede funcionar, aunque algunas funciones dependen del origen, permisos del navegador, HTTPS, cámara, GPS, Firebase o Vercel.

## Arquitectura y acceso

La app familiar se ejecuta como aplicación web estática. Las operaciones de análisis con Gemini se realizan mediante una función serverless, evitando llamadas directas desde el cliente.

El panel admin está separado en `/admin/` y utiliza validación mediante backend serverless. Las variables sensibles de acceso y firma de sesión se gestionan como variables de entorno en Vercel.

La información técnica de mantenimiento está documentada en los archivos de `docs/`.

## Documentación

- Historial de versiones: [CHANGELOG.md](CHANGELOG.md)
- Política de versionado: [docs/versionado.md](docs/versionado.md)
- Seguridad y mantenimiento: [docs/seguridad.md](docs/seguridad.md)
- Firebase/Firestore: [docs/firebase.md](docs/firebase.md)
- Estructura técnica: [docs/estructura.md](docs/estructura.md)
- Sistema visual y temas: [docs/temas.md](docs/temas.md)
- Despliegue y operaciones: [docs/despliegue.md](docs/despliegue.md)

## Changelog y versionado

El proyecto usa SemVer desde la versión `0.1.0`.

- Cambios por versión: [CHANGELOG.md](CHANGELOG.md)
- Criterios de versionado: [docs/versionado.md](docs/versionado.md)
