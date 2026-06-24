# BotaniK

🌐 Web desplegada: https://botanik-nine.vercel.app/

BotaniK es una app web familiar para explorar plantas de forma lúdica. La experiencia gira en torno a perfiles infantiles, un radar/cámara para capturar muestras botánicas y un álbum donde se coleccionan especies descubiertas.

Cada captura puede analizarse con IA mediante una función serverless, y la app transforma el resultado en una ficha con nombre, rareza, XP y progreso. La idea es convertir pequeños paseos y observaciones en una aventura de exploración natural.

El proyecto incluye recompensas, niveles, comunicados, buzón de mensajes y temas claro/oscuro. Está pensado como prototipo avanzado y base pública para seguir profesionalizando seguridad, experiencia visual y mantenimiento.

## Estado del proyecto

Versión actual: `0.1.0`

BotaniK está en fase pública temprana. La app es funcional, pero todavía no debe presentarse como producto final ni como producción completamente segura.

El panel admin está deshabilitado hasta implementar autenticación y autorización real. La futura versión `1.0.0` queda reservada para una etapa más estable, con panel admin real, seguridad externa consolidada y pulido visual/UX suficiente.

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
- Panel admin pendiente de autorización real.

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

## Documentación

- Historial de versiones: [CHANGELOG.md](CHANGELOG.md)
- Política de versionado: [docs/versionado.md](docs/versionado.md)
- Seguridad: [docs/seguridad.md](docs/seguridad.md)
- Firebase/Firestore: [docs/firebase.md](docs/firebase.md)
- Estructura técnica: [docs/estructura.md](docs/estructura.md)
- Sistema visual y temas: [docs/temas.md](docs/temas.md)
- Despliegue y operaciones: [docs/despliegue.md](docs/despliegue.md)

La documentación técnica resume el estado actual y los puntos de mantenimiento más importantes.

## Seguridad

Las credenciales visibles conocidas se han retirado del cliente y Gemini se llama mediante una función serverless. Aun así, BotaniK no debe considerarse producción segura completa.

Firestore sigue dependiendo de reglas reales desplegadas fuera del repositorio, y el panel admin sigue pendiente de una solución de autenticación y autorización real. Para más detalle, revisar [docs/seguridad.md](docs/seguridad.md).

## Changelog y versionado

El proyecto usa SemVer desde la versión `0.1.0`.

- Cambios por versión: [CHANGELOG.md](CHANGELOG.md)
- Criterios de versionado: [docs/versionado.md](docs/versionado.md)
