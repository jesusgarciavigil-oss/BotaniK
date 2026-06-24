// Carga, memoria y renderizado del álbum de cromos botánicos.
import {
    collection,
    db,
    getDocs,
    query,
    where
} from "../config/firebase.js";
import { TITULOS_ADAPTACION } from "../core/constants.js";
import {
    crearTexto,
    limpiarNodo,
    obtenerClaseRarezaSegura
} from "../core/dom.js";
import { state } from "../core/state.js";

const albumCallbacks = {
    openCardModal: null
};

export function initializeAlbum(callbacks = {}) {
    Object.assign(albumCallbacks, callbacks);
    window.filtrarYOrdenarAlbum = filtrarYOrdenarAlbum;
}

export async function cargarAlbum() {
    const q = query(collection(db, "capturas"), where("perfil", "==", state.perfilActiveId));
    const snap = await getDocs(q);
    state.albumEspeciesMemoria = {};

    snap.forEach(documento => {
        const d = documento.data();
        if (!state.albumEspeciesMemoria[d.nombreCientifico]) {
            state.albumEspeciesMemoria[d.nombreCientifico] = {
                nombreComun: d.nombreComun, nombreCientifico: d.nombreCientifico, rareza: d.rareza,
                descripcion: d.descripcion, foto: d.foto, fecha: d.fecha, loc: d.loc || "Campo",
                tipoHoja: d.tipoHoja || "No especificado", origen: d.origen || "Autóctona",
                copiasTotales: 0, nombresAlternativosRecogidos: new Set()
            };
        }
        state.albumEspeciesMemoria[d.nombreCientifico].copiasTotales++;
        state.albumEspeciesMemoria[d.nombreCientifico].nombresAlternativosRecogidos.add(d.nombreComun);
    });
    window.filtrarYOrdenarAlbum();
}

function filtrarYOrdenarAlbum() {
    const wrapper = document.getElementById('album-dinamico-contenedor');
    limpiarNodo(wrapper);
    const filtroTexto = document.getElementById('search-botanika').value.toLowerCase().trim();

    Object.values(state.albumEspeciesMemoria).forEach(esp => {
        if(filtroTexto && !esp.nombreComun.toLowerCase().includes(filtroTexto) && !esp.nombreCientifico.toLowerCase().includes(filtroTexto)) return;

        const factorEvolutivo = Math.min(esp.copiasTotales, 4);
        const tagRarity = obtenerClaseRarezaSegura(esp.rareza);

        const cardHtml = document.createElement('div');
        cardHtml.className = 'cromo-wrapper';
        const cromoMini = document.createElement('div');
        cromoMini.className = `cromo-mini-card ${tagRarity}`;
        const imgBox = document.createElement('div');
        imgBox.className = 'cromo-img-box';
        const img = document.createElement('img');
        img.src = esp.foto;
        img.alt = esp.nombreComun || 'Cromo botánico';
        imgBox.appendChild(img);
        const txtBar = document.createElement('div');
        txtBar.className = 'cromo-txt-bar';
        txtBar.appendChild(crearTexto('h4', '', esp.nombreComun));
        const evolutionBadge = crearTexto('div', 'cromo-evolution-badge', TITULOS_ADAPTACION[factorEvolutivo]);
        cromoMini.appendChild(imgBox);
        cromoMini.appendChild(txtBar);
        cromoMini.appendChild(evolutionBadge);
        cardHtml.appendChild(cromoMini);
        cardHtml.addEventListener('click', () => { albumCallbacks.openCardModal?.(esp); });
        wrapper.appendChild(cardHtml);
    });
}
