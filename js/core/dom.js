// Helpers DOM compartidos por los renderizados seguros de la app familiar.
import { MULTIPLICADORES_RAREZA } from "./constants.js";

export function limpiarNodo(elemento) {
    if (!elemento) return;
    elemento.replaceChildren();
}

export function crearTexto(tag, className, text) {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    elemento.textContent = text ?? "";
    return elemento;
}

export function renderizarAvatarSeguro(container, avatar) {
    if (!container) return;
    const valorAvatar = avatar || "🧑‍🚀";
    limpiarNodo(container);

    if (typeof valorAvatar === "string" && valorAvatar.startsWith("data:image")) {
        const imagenAvatar = document.createElement('img');
        imagenAvatar.src = valorAvatar;
        imagenAvatar.alt = "Avatar";
        container.appendChild(imagenAvatar);
        return;
    }

    container.textContent = valorAvatar;
}

export function obtenerClaseRarezaSegura(rareza) {
    const rarezaNormalizada = typeof rareza === "string" ? rareza : "comun";
    const rarezaPermitida = Object.prototype.hasOwnProperty.call(MULTIPLICADORES_RAREZA, rarezaNormalizada)
        ? rarezaNormalizada
        : "comun";
    return `rare-${rarezaPermitida}`;
}
