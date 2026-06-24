// Visualizador de detalle de cromo y acciones del modal 3D.
import { limpiarNodo } from "../core/dom.js";

export function initializeCardModal() {
    window.abrirVisualizadorDetalleCromo3D = abrirVisualizadorDetalleCromo3D;
    window.voltearCartaModal = voltearCartaModal;
    window.desplegarNombresAlternativosModal = desplegarNombresAlternativosModal;
    window.evaluarCierrePorFondo = evaluarCierrePorFondo;
}

export function abrirVisualizadorDetalleCromo3D(esp) {
    document.getElementById('modal-card-inner').classList.remove('flipped');
    document.getElementById('modal-names-dropdown').style.display = 'none';

    document.getElementById('m-title').innerText = esp.nombreComun;
    document.getElementById('m-type').innerText = `X${esp.copiasTotales} MUESTRAS`;
    document.getElementById('m-img').src = esp.foto;
    document.getElementById('m-sci').innerText = esp.nombreCientifico;
    document.getElementById('m-desc').innerText = esp.descripcion;

    document.getElementById('m-back-title').innerText = esp.nombreComun;
    document.getElementById('m-fecha').innerText = ` Register: ${esp.fecha}`;
    document.getElementById('m-coords').innerText = ` Bioma: ${esp.loc} | Hoja: ${esp.tipoHoja} | ${esp.origen}`;

    const btnEvo = document.getElementById('btn-evolution-action');
    if(esp.copiasTotales >= 2) {
        btnEvo.style.display = 'block';
        btnEvo.innerText = `ADAPTAR AL NIVEL ${Math.min(esp.copiasTotales, 4)}`;
    } else { btnEvo.style.display = 'none'; }

    const drop = document.getElementById('modal-names-dropdown');
    limpiarNodo(drop);
    esp.nombresAlternativosRecogidos.forEach(altName => {
        const r = document.createElement('div'); r.className = 'name-drop-row'; r.innerText = altName;
        r.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('m-title').innerText = altName; drop.style.display='none'; });
        drop.appendChild(r);
    });

    document.getElementById('cromo-overlay-modal').style.display = 'flex';
}

function voltearCartaModal(event, el) {
    // Evita voltear la carta si están interactuando con la ventana de descripción o botones internos
    if(event.target.id === 'm-desc' || event.target.className === 'modal-desc-poke' || event.target.closest('.modal-body-poke') || event.target.closest('.modal-title-poke-clickable') || event.target.closest('#modal-names-dropdown') || event.target.id === 'btn-evolution-action') return;
    el.classList.toggle('flipped');
}

function desplegarNombresAlternativosModal(event) {
    event.stopPropagation(); const d = document.getElementById('modal-names-dropdown');
    d.style.display = (d.style.display === 'block') ? 'none' : 'block';
}

function evaluarCierrePorFondo(event) {
    if(event.target.id === 'cromo-overlay-modal' || event.target.className === 'close-modal-txt') {
        document.getElementById('cromo-overlay-modal').style.display = 'none';
    }
}
