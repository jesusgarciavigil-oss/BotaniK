// Estado mutable centralizado de la app familiar de BotaniK.
export const state = {
    modoRegistro: false,
    usuarioEmailActual: "",
    perfilActiveId: "",
    perfilActivoNombre: "",
    perfilActivoNacimiento: "2018-01-01",
    perfilActivoAvatar: "🧑‍🚀",
    perfilActivoBase: null,
    perfilActivoEsExperto: false,
    modoEdicionActivo: false,
    idPerfilEnEdicionFila: "",
    selectedAvatarValue: "🧑‍🚀",
    albumEspeciesMemoria: {},
    cachePerfilesFamilia: [],
    cacheAlertasGlobales: [],
    unsuscribeXpLive: null
};

export function resetPerfilActivo() {
    state.perfilActiveId = "";
    state.perfilActivoNombre = "";
    state.perfilActivoNacimiento = "2018-01-01";
    state.perfilActivoAvatar = "🧑‍🚀";
    state.perfilActivoBase = null;
    state.perfilActivoEsExperto = false;
}

export function setPerfilActivo({
    idDoc,
    nombre,
    fechaNacimiento,
    avatar,
    base,
    esExperto
}) {
    state.perfilActiveId = idDoc;
    state.perfilActivoNombre = nombre;
    state.perfilActivoNacimiento = fechaNacimiento;
    state.perfilActivoAvatar = avatar;
    state.perfilActivoBase = base;
    state.perfilActivoEsExperto = esExperto;
}

export function resetSesionFamiliar() {
    state.usuarioEmailActual = "";
    state.perfilActiveId = "";
}

export function setModoEdicionPerfil({ activo, idPerfil = "", avatar = "🧑‍🚀" }) {
    state.modoEdicionActivo = activo;
    state.idPerfilEnEdicionFila = idPerfil;
    state.selectedAvatarValue = avatar;
}

export function resetModoEdicionPerfil() {
    setModoEdicionPerfil({ activo: false });
}

export function setUnsubscribeXpLive(unsubscribe) {
    state.unsuscribeXpLive = unsubscribe;
}

export function limpiarEscuchaXpLive() {
    if (state.unsuscribeXpLive) {
        state.unsuscribeXpLive();
        state.unsuscribeXpLive = null;
    }
}
