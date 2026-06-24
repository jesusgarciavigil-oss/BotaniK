// Login, registro y cierre de sesión de la cuenta familiar.
import {
    addDoc,
    collection,
    db,
    getDocs,
    query,
    where
} from "../config/firebase.js";
import { MENSAJE_PANEL_ADMIN_SEPARADO } from "../core/constants.js";
import {
    limpiarEscuchaXpLive,
    resetSesionFamiliar,
    state
} from "../core/state.js";

function avisarPanelAdminSeparado() {
    alert(MENSAJE_PANEL_ADMIN_SEPARADO);
    return false;
}

function esIntentoPanelAdminDeshabilitado(email, pass) {
    const textoAcceso = `${email} ${pass}`.toLowerCase();
    return ["admin", "mando", "supremo", "god", "master"].some(marcador => textoAcceso.includes(marcador));
}

export function initializeFamilyAuth({ onAccessGranted } = {}) {
    window.gestionarAcceso = async () => {
        const email = document.getElementById('username').value.trim().toLowerCase();
        const pass = document.getElementById('password').value.trim();
        if(!email || !pass) return alert("Por favor, rellena todos los campos.");

        try {
            const q = query(collection(db, "cuentas_familia"), where("email", "==", email));
            const snap = await getDocs(q);

            if (window.modoRegistro) {
                if (!snap.empty) return alert("Esta cuenta ya existe.");
                await addDoc(collection(db, "cuentas_familia"), { email: email, pass: pass });
                alert("¡Cuenta familiar registrada con éxito!");
                state.usuarioEmailActual = email;
                document.getElementById('login-page').style.display = 'none';
                await onAccessGranted?.();
            } else {
                let valido = false;
                snap.forEach(doc => { if(doc.data().pass === pass) valido = true; });

                if (valido) {
                    state.usuarioEmailActual = email;
                    document.getElementById('login-page').style.display = 'none';
                    await onAccessGranted?.();
                } else if (esIntentoPanelAdminDeshabilitado(email, pass)) {
                    avisarPanelAdminSeparado();
                } else { alert("Código de acceso o terminal incorrectos."); }
            }
        } catch (err) { alert("Error de enlace: " + err.message); }
    };

    window.toggleModo = () => {
        window.modoRegistro = !window.modoRegistro;
        document.getElementById('login-title').innerText = window.modoRegistro ? "Crear Cuenta BotaniK" : "BotaniK Login";
        document.getElementById('submit-btn').innerText = window.modoRegistro ? "REGISTRAR ENTORNO" : "ACCEDER AL RADAR";
        document.getElementById('toggle-text').innerText = window.modoRegistro ? "¿Ya tienes terminal? Accede aquí" : "¿Nuevo laboratorio familiar? Regístrate gratis";
    };

    window.cerrarSesionCompleta = () => {
        limpiarEscuchaXpLive();
        resetSesionFamiliar();
        document.getElementById('username').value = ""; document.getElementById('password').value = "";
        document.getElementById('login-page').style.display = 'flex'; document.getElementById('profile-page').style.display = 'none'; document.getElementById('nav-dropdown-box').style.display = 'none'; document.querySelector('header').style.display = 'none'; document.querySelector('nav').style.display = 'none';
    };
}
