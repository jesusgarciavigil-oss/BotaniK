// Recompensas en vivo, comunicados de comunidad y toast de biomasa.
import {
    addDoc,
    collection,
    db,
    doc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where
} from "../config/firebase.js";
import {
    limpiarEscuchaXpLive,
    setUnsubscribeXpLive,
    state
} from "../core/state.js";

const rewardsCallbacks = {
    onStateRefresh: null
};

export function initializeRewards(callbacks = {}) {
    Object.assign(rewardsCallbacks, callbacks);
    window.activarEscuchaBiomasaEnVivo = activarEscuchaBiomasaEnVivo;
    window.verificarAlertasMisionesComarcales = verificarAlertasMisionesComarcales;
    window.desplegarToastVictoryInmediata = desplegarToastVictoryInmediata;
}

export function activarEscuchaBiomasaEnVivo() {
    limpiarEscuchaXpLive();
    const q = query(collection(db, "alertas_xp"), where("perfilId", "==", state.perfilActiveId), where("estado", "==", "pendiente"));
    setUnsubscribeXpLive(onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(async (docSnap) => {
            const alerta = docSnap.data(); const idAlerta = docSnap.id;
            await updateDoc(doc(db, "alertas_xp", idAlerta), { estado: "entregado" });
            await addDoc(collection(db, "capturas"), { nombreComun: alerta.titulo || "Cargamento de Biomasa", nombreCientifico: "Bonus Laboratorio Central", rareza: "especial", descripcion: alerta.mensaje || alerta.textMessage, foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='%2339FF14'><path d='M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z'/></svg>", fecha: new Date().toLocaleDateString(), timestamp: Date.now(), xp: parseInt(alerta.xp), loc: "Laboratorio Central", municipioId: "Admin", comarcaId: "Admin", perfil: state.perfilActiveId, usuarioEmail: state.usuarioEmailActual });

            const alertBox = document.getElementById('live-xp-badge-alert');
            if (alertBox) {
                document.getElementById('live-xp-amount-txt').innerText = `+${alerta.xp}`;
                alertBox.classList.add('show-alert'); rewardsCallbacks.onStateRefresh?.();
                setTimeout(() => { alertBox.classList.remove('show-alert'); }, 5000);
            }
        });
    }));
}

export async function verificarAlertasMisionesComarcales() {
    const snap = await getDocs(collection(db, "alertas_comunidad"));
    state.cacheAlertasGlobales = [];
    let unreadCount = 0;
    const leidosList = JSON.parse(localStorage.getItem(`leidos_${state.perfilActiveId}`) || "[]");

    snap.forEach(docSnap => {
        const a = docSnap.data(); const idA = docSnap.id;
        let elegible = false;

        if (a.targetType === "global") elegible = true;
        else if (a.targetType === "pais" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.pais) elegible = true;
        else if (a.targetType === "provincial" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.provincia) elegible = true;
        else if (a.targetType === "comarcal" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.comarca) elegible = true;
        else if (a.targetType === "cuenta" && a.targetValue === state.usuarioEmailActual) elegible = true;
        else if (a.targetType === "explorador" && a.targetValue === state.perfilActiveId) elegible = true;

        if (elegible) {
            state.cacheAlertasGlobales.push({ id: idA, ...a });
            if (!leidosList.includes(idA)) unreadCount++;
        }
    });

    const banner = document.getElementById('profesor-alert-banner');
    const msgTxt = document.getElementById('profesor-msg-text');
    const badge = document.getElementById('box-badge-num');

    if (state.cacheAlertasGlobales.length > 0) {
        state.cacheAlertasGlobales.sort((a,b) => b.timestamp - a.timestamp);
        msgTxt.innerText = state.cacheAlertasGlobales[0].textMessage;
        banner.style.display = 'block';
    } else { banner.style.display = 'none'; }

    if (unreadCount > 0) { badge.innerText = unreadCount; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
}

export function desplegarToastVictoryInmediata(msg) {
    const el = document.getElementById('botanik-toast-victory');
    document.getElementById('botanik-toast-msg-txt').innerText = msg;
    el.classList.add('show-toast');
    setTimeout(() => { el.classList.remove('show-toast'); }, 4000);
}
