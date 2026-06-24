// Buzón histórico y lectura de comunicados de campo.
import {
    crearTexto,
    limpiarNodo
} from "../core/dom.js";
import { state } from "../core/state.js";

const mailboxCallbacks = {
    onMessageRead: null
};

export function initializeMailbox(callbacks = {}) {
    Object.assign(mailboxCallbacks, callbacks);
    window.abrirBuzonHistoricoModal = abrirBuzonHistoricoModal;
    window.abrirLectorMensajeEspecifico = abrirLectorMensajeEspecifico;
}

export function abrirBuzonHistoricoModal() {
    const container = document.getElementById('mailbox-list-container');
    limpiarNodo(container);
    const leidosList = JSON.parse(localStorage.getItem(`leidos_${state.perfilActiveId}`) || "[]");

    if (state.cacheAlertasGlobales.length === 0) {
        container.appendChild(crearTexto('div', 'mailbox-empty-state', 'No hay transmisiones archivadas en este cuadrante.'));
    }

    state.cacheAlertasGlobales.forEach(a => {
        const esLeido = leidosList.includes(a.id);
        const dCard = document.createElement('div'); dCard.className = 'mailbox-item-card';
        dCard.appendChild(crearTexto('div', 'mailbox-item-title', a.textMessage));
        dCard.appendChild(crearTexto('div', 'mailbox-item-date', new Date(a.timestamp).toLocaleString()));
        if (!esLeido) {
            const unreadDot = document.createElement('div');
            unreadDot.className = 'mailbox-unread-dot';
            dCard.appendChild(unreadDot);
        }
        dCard.onclick = () => { window.abrirLectorMensajeEspecifico(a.id, a.textMessage); };
        container.appendChild(dCard);
    });
    document.getElementById('mailbox-modal').style.display = 'flex';
}

export function abrirLectorMensajeEspecifico(idMsg, cuerpo) {
    document.getElementById('mailbox-modal').style.display = 'none';
    document.getElementById('m-reader-body').innerText = cuerpo;

    const btn = document.getElementById('m-reader-btn-action');
    btn.onclick = () => {
        let leidosList = JSON.parse(localStorage.getItem(`leidos_${state.perfilActiveId}`) || "[]");
        if (!leidosList.includes(idMsg)) { leidosList.push(idMsg); localStorage.setItem(`leidos_${state.perfilActiveId}`, JSON.stringify(leidosList)); }
        document.getElementById('msg-reader-modal').style.display = 'none';
        mailboxCallbacks.onMessageRead?.();
    };
    document.getElementById('msg-reader-modal').style.display = 'flex';
}
