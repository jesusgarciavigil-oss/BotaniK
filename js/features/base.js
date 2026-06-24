// Configuración de base de exploración GPS/manual del perfil activo.
import {
    db,
    doc,
    updateDoc
} from "../config/firebase.js";
import { state } from "../core/state.js";

const baseCallbacks = {
    onStateRefresh: null,
    onAlertsRefresh: null,
    onProfilesRefresh: null
};

export function initializeBase(callbacks = {}) {
    Object.assign(baseCallbacks, callbacks);
    window.getUbicacionGPS = getUbicacionGPS;
    window.localizarBasePorGPS = localizarBasePorGPS;
    window.activarEntradaManualBase = activarEntradaManualBase;
    window.confirmarBaseManual = confirmarBaseManual;
}

export function getUbicacionGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => { resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
            () => { resolve(null); },
            { timeout: 3000 }
        );
    });
}

export async function localizarBasePorGPS() {
    document.getElementById('loading-base-txt').innerText = "📡 BUSCANDO RESPUESTA DE SATÉLITES GPS EN TIEMPO REAL...";
    const gps = await window.getUbicacionGPS();
    if (!gps) {
        alert("No se ha podido adquirir telemetría GPS. Por favor, introduce tu comarca manualmente.");
        window.activarEntradaManualBase();
        return;
    }
    await calibrarBiomaPorCoordenadas(gps.lat, gps.lng, "Ubicación Satelital Automática");
}

export function activarEntradaManualBase() {
    document.getElementById('gps-base-box').style.display = 'none';
    document.getElementById('manual-base-box').style.display = 'block';
    document.getElementById('loading-base-txt').innerText = "Introduce tu municipio, comarca o provincia para sintonizar los biomas locales de forma manual:";
}

export async function confirmarBaseManual() {
    const txt = document.getElementById('manual-lugar-input').value.trim();
    if(!txt) return alert("Por favor, introduce un nombre de sector válido.");
    await calibrarBiomaPorCoordenadas(43.38, -3.22, txt);
}

async function calibrarBiomaPorCoordenadas(lat, lng, queryTxt) {
    let pais = "España"; let provincia = "Cantabria"; let comarca = "Costa Oriental"; let municipio = "Castro Urdiales";
    const normal = queryTxt.toLowerCase();
    
    if(normal.includes("jaen") || normal.includes("carolina") || normal.includes("mágina") || normal.includes("cazorla")) { provincia = "Jaén"; comarca = "Sierra Mágina"; municipio = "La Carolina"; }
    else if(normal.includes("bilbao") || normal.includes("viazcaya") || normal.includes("bizkaia")) { provincia = "Vizcaya"; comarca = "Gran Bilbao"; municipio = "Bilbao"; }
    else if(normal.includes("málaga") || normal.includes("ronda") || normal.includes("marbella")) { provincia = "Málaga"; comarca = "Serranía de Ronda"; municipio = "Málaga"; }
    else if(normal.includes("granada")) { provincia = "Granada"; comarca = "Granada Metropolitana"; municipio = "Granada"; }

    const baseObjeto = { lat: lat, lng: lng, pais: pais, provincia: provincia, comarca: comarca, municipio: municipio, queryLabel: queryTxt };
    await updateDoc(doc(db, "perfiles", state.perfilActiveId), { base: baseObjeto });
    
    state.perfilActivoBase = baseObjeto;
    document.getElementById('setup-base-page').style.display = 'none';
    alert(`¡Base Secreta Establecida en ${municipio} (${comarca})!`);
    
    baseCallbacks.onStateRefresh?.();
    await baseCallbacks.onAlertsRefresh?.();
    baseCallbacks.onProfilesRefresh?.();
}
