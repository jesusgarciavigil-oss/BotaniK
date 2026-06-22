# BotaniK

BotaniK es una aplicacion web familiar orientada a la exploracion botanica. Incluye perfiles infantiles, radar/camara, album de plantas, recompensas, comunicados y un panel de administracion para seguimiento y simulacion.

## Estado actual del proyecto

El proyecto esta en estado de prototipo funcional y en proceso de profesionalizacion. Actualmente se mantiene como web estatica y esta concentrado principalmente en `index.html`.

En ese archivo conviven HTML, CSS, JavaScript, estilos inline, eventos inline, configuracion de Firebase, llamadas a servicios externos y logica de aplicacion. La prioridad actual es documentar el estado real, separar responsabilidades poco a poco y conservar el comportamiento existente.

Este proyecto no debe considerarse una aplicacion de produccion segura en su estado actual.

## Funcionalidades principales detectadas

- Login y registro familiar.
- Gestion de perfiles infantiles.
- Avatares por emoji o imagen.
- Configuracion de base por GPS o entrada manual.
- Radar/camara para capturar muestras.
- Analisis de plantas con IA.
- Sistema de XP, rareza, niveles y album.
- Comunicados y mensajes segmentados.
- Panel de administracion.

## Ejecucion local

Como el proyecto es una web estatica, puede abrirse directamente desde el navegador:

```text
index.html
```

Tambien puede servirse la carpeta con un servidor estatico simple. Por ejemplo, desde la raiz del proyecto:

```bash
python -m http.server 8000
```

Despues, abrir:

```text
http://localhost:8000
```

Algunas APIs del navegador y servicios externos pueden comportarse de forma distinta segun el navegador, el origen local, permisos de camara/GPS y configuracion de red.

## Dependencias externas detectadas

- Firebase cargado desde CDN.
- Firestore como base de datos.
- Gemini API para analisis de imagenes.
- APIs del navegador:
  - geolocalizacion
  - FileReader
  - canvas
  - localStorage

## Advertencia de seguridad

El codigo actual contiene claves, credenciales o logica sensible expuestas en el cliente. Estos valores no deben considerarse protegidos, ya que cualquier persona con acceso a la aplicacion servida puede inspeccionar el JavaScript.

Si este repositorio ha sido compartido o publicado, se recomienda revisar, revocar o regenerar los secretos afectados y planificar su salida del cliente. Tambien es importante revisar las reglas de Firestore, ya que la seguridad real de los datos depende de esas reglas y no solo del codigo de la interfaz.

Este README no copia valores reales de claves, contrasenas, tokens ni credenciales.

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

## Proximos pasos recomendados

- Crear documentacion de seguridad.
- Documentar Firebase/Firestore.
- Separar CSS en `css/styles.css`.
- Separar JavaScript en `js/main.js`.
- Revisar reglas de Firestore.
- Planificar la salida de secretos fuera del cliente.
