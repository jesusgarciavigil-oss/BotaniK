import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDReChwrnr6zHLumpR5OLTrNlvfhcAH_BA",
    authDomain: "plantdex-984e6.firebaseapp.com",
    projectId: "plantdex-984e6",
    storageBucket: "plantdex-984e6.firebasestorage.app",
    messagingSenderId: "247992735441",
    appId: "1:247992735441:web:91b0ce9ec849c5876457f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_SESSION_KEY = "botanik-admin-session";
const MENSAJE_SESION_CADUCADA = "Sesión admin no válida o caducada. Vuelve a acceder.";

const PROVINCIAS_PRECARGADAS = ["Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba","La Coruña","Cuenca","Gerona","Granada","Guadalajara","Guipúzcoa","Huelva","Huesca","Jaén","León","Lérida","Lugo","Madrid","Málaga","Murcia","Navarra","Orense","Palencia","Las Palmas","Pontevedra","La Rioja","Salamanca","Segovia","Sevilla","Soria","Tarragona","Santa Cruz de Tenerife","Teruel","Toledo","Valencia","Valladolid","Vizcaya","Zamora","Zaragoza","Ceuta","Melilla"];
const COMARCAS_PRECARGADAS = ["Asón-Agüera","Besaya","Costa Central","Costa Oriental","Liébana","Saja-Nansa","Trasmiera","Valles Pasiegos","Campoo-Los Valles","Sierra de Cazorla","Sierra Mágina","Granada Metropolitana","Axarquía Málaga","Serranía de Ronda","Gran Bilbao","Arratia-Nerbioi"];
const PAISES_PRECARGADOS = ["España", "Francia", "Portugal", "Andorra"];
const MULTIPLICADORES_RAREZA = { "comun": 1, "poco": 1.5, "especial": 2.5, "exotica": 5 };

let adminSessionValid = false;
let cacheGlobalAdminPerfiles = [];
let cacheAdminPerfilesCompletos = [];

function limpiarNodo(elemento) {
    if (!elemento) return;
    elemento.replaceChildren();
}

function crearTexto(tag, className, text) {
    const elemento = document.createElement(tag);
    if (className) elemento.className = className;
    elemento.textContent = text ?? "";
    return elemento;
}

function appendOption(select, value, label) {
    if (!select) return;
    select.add(new Option(label ?? "", value ?? ""));
}

function obtenerTokenAdmin() {
    try {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
    } catch (error) {
        return "";
    }
}

function guardarTokenAdmin(token) {
    try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, token);
    } catch (error) {
        adminSessionValid = false;
    }
}

function borrarTokenAdmin() {
    try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (error) {
        // Si sessionStorage falla, igualmente bloqueamos el estado local.
    }
    adminSessionValid = false;
}

function setEstadoLogin(mensaje) {
    const status = document.getElementById("admin-login-status");
    if (status) status.textContent = mensaje || "";
}

function mostrarLoginAdmin(mensaje = "") {
    document.getElementById("admin-login-page")?.classList.remove("admin-hidden");
    document.getElementById("god-mode-page")?.classList.add("admin-hidden");
    setEstadoLogin(mensaje);
}

function mostrarPanelAdmin() {
    document.getElementById("admin-login-page")?.classList.add("admin-hidden");
    document.getElementById("god-mode-page")?.classList.remove("admin-hidden");
}

async function validarSesionAdmin() {
    const token = obtenerTokenAdmin();
    if (!token) {
        adminSessionValid = false;
        return false;
    }

    try {
        const response = await fetch("/api/admin-session", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        adminSessionValid = response.ok;
        if (!adminSessionValid) borrarTokenAdmin();
        return adminSessionValid;
    } catch (error) {
        adminSessionValid = false;
        return false;
    }
}

async function asegurarSesionAdmin() {
    const esValida = await validarSesionAdmin();
    if (!esValida) mostrarLoginAdmin(MENSAJE_SESION_CADUCADA);
    return esValida;
}

async function gestionarLoginAdmin() {
    const input = document.getElementById("admin-password-input");
    const password = input?.value || "";
    if (!password.trim()) {
        setEstadoLogin("Introduce la contraseña admin.");
        return;
    }

    setEstadoLogin("Validando acceso...");
    try {
        const response = await fetch("/api/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.token) {
            borrarTokenAdmin();
            setEstadoLogin("Acceso admin no autorizado.");
            return;
        }

        guardarTokenAdmin(body.token);
        adminSessionValid = true;
        if (input) input.value = "";
        mostrarPanelAdmin();
        await switchAdminTab("panel-macro");
    } catch (error) {
        borrarTokenAdmin();
        setEstadoLogin("No se pudo validar el acceso admin.");
    }
}

function cerrarSesionAdmin() {
    borrarTokenAdmin();
    mostrarLoginAdmin("Sesión admin cerrada.");
}

async function switchAdminTab(tabId, event) {
    if (!(await asegurarSesionAdmin())) return;
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".admin-view-pane").forEach(pane => pane.classList.remove("active"));
    if (event) event.currentTarget.classList.add("active");
    else {
        const buttonByPanel = {
            "panel-macro": "admin-tab-macro-btn",
            "panel-cuentas": "admin-tab-cuentas-btn",
            "panel-moderacion": "admin-tab-moderacion-btn",
            "panel-alertas": "admin-tab-alertas-btn"
        };
        document.getElementById(buttonByPanel[tabId])?.classList.add("active");
    }
    document.getElementById(tabId)?.classList.add("active");

    if (tabId === "panel-macro") await cargarEstadisticasMacro();
    if (tabId === "panel-cuentas") await renderizarCuentasYPerfilesGlobales();
    if (tabId === "panel-moderacion") await cargarMuroModeracionGlobal();
    if (tabId === "panel-alertas") {
        await cargarSelectorEmailsAlertas();
        prepararDesplegablesSimulador();
    }
}

async function cargarEstadisticasMacro() {
    if (!(await asegurarSesionAdmin())) return;
    const snapCuentas = await getDocs(collection(db, "cuentas_familia"));
    const snapPerfiles = await getDocs(collection(db, "perfiles"));
    const snapCapturas = await getDocs(collection(db, "capturas"));
    document.getElementById("m-total-cuentas").innerText = snapCuentas.size;
    document.getElementById("m-total-exploradores").innerText = snapPerfiles.size;
    document.getElementById("m-total-capturas").innerText = snapCapturas.size;

    const feedContainer = document.getElementById("admin-live-feed");
    limpiarNodo(feedContainer);
    const todas = [];
    const perfilesMapParaFeed = {};
    snapPerfiles.forEach(pDoc => { perfilesMapParaFeed[pDoc.id] = pDoc.data(); });
    snapCapturas.forEach(d => todas.push({ id: d.id, ...d.data() }));
    todas.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    todas.slice(0, 12).forEach(c => {
        if (c.municipioId === "Admin") return;
        const dataAutor = perfilesMapParaFeed[c.perfil] || { nombre: "Desconocido" };
        const feedBox = document.createElement("div");
        feedBox.className = "feed-box";
        const feedImg = document.createElement("img");
        feedImg.className = "feed-img";
        feedImg.src = c.foto || "";
        feedImg.alt = c.nombreComun || "Captura botánica";
        const feedBody = document.createElement("div");
        feedBody.className = "feed-body";
        feedBody.appendChild(crearTexto("div", "feed-title", c.nombreComun));
        feedBody.appendChild(crearTexto("div", "feed-scientific-name", c.nombreCientifico));
        const feedPlace = document.createElement("div");
        feedPlace.appendChild(document.createTextNode("📍 Lugar: "));
        feedPlace.appendChild(crearTexto("b", "", c.loc || "Campo"));
        feedBody.appendChild(feedPlace);
        feedBody.appendChild(crearTexto("div", "feed-xp", `XP: +${c.xp || 0}`));
        const feedAuthor = document.createElement("div");
        feedAuthor.className = "feed-author-tag";
        feedAuthor.appendChild(document.createTextNode("👤 "));
        feedAuthor.appendChild(crearTexto("b", "", dataAutor.nombre));
        feedBody.appendChild(feedAuthor);
        feedBox.appendChild(feedImg);
        feedBox.appendChild(feedBody);
        feedContainer.appendChild(feedBox);
    });
}

async function renderizarCuentasYPerfilesGlobales() {
    if (!(await asegurarSesionAdmin())) return;
    const snapCuentas = await getDocs(collection(db, "cuentas_familia"));
    const snapPerfiles = await getDocs(collection(db, "perfiles"));
    const mainContainer = document.getElementById("clusters-cuentas-container");
    limpiarNodo(mainContainer);
    cacheGlobalAdminPerfiles = [];
    const perfilesMap = {};
    const listadoCuentasEmails = [];

    snapCuentas.forEach(docC => { listadoCuentasEmails.push({ email: docC.data().email }); });
    snapPerfiles.forEach(docSnap => {
        const p = docSnap.data();
        cacheGlobalAdminPerfiles.push({ id: docSnap.id, ...p });
        if (!perfilesMap[p.usuarioEmail]) perfilesMap[p.usuarioEmail] = [];
        perfilesMap[p.usuarioEmail].push({ id: docSnap.id, ...p });
    });

    listadoCuentasEmails.forEach(c => {
        const emailFam = c.email;
        const exploradoresAsociados = perfilesMap[emailFam] || [];
        let comarcaBase = "No Calibrada";
        const conBase = exploradoresAsociados.find(n => n.base && n.base.comarca);
        if (conBase) comarcaBase = conBase.base.comarca;

        const cardHtml = document.createElement("div");
        cardHtml.className = "account-cluster-card";
        const clusterHeader = document.createElement("div");
        clusterHeader.className = "cluster-header";
        clusterHeader.appendChild(crearTexto("div", "cluster-email", `📧 Cuenta: ${emailFam}`));
        clusterHeader.appendChild(crearTexto("div", "cluster-base", `📡 Sector: ${comarcaBase}`));
        cardHtml.appendChild(clusterHeader);

        if (exploradoresAsociados.length === 0) {
            cardHtml.appendChild(crearTexto("div", "cluster-empty-explorers", "Sin exploradores aún."));
        } else {
            const tablaHijos = document.createElement("table");
            tablaHijos.className = "admin-table";
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            ["Explorador", "Modo Experto", "Comando"].forEach(texto => {
                headerRow.appendChild(crearTexto("th", "", texto));
            });
            thead.appendChild(headerRow);
            const tbody = document.createElement("tbody");
            exploradoresAsociados.forEach(n => {
                const row = document.createElement("tr");
                const nameCell = document.createElement("td");
                nameCell.appendChild(crearTexto("b", "", n.nombre));
                const expertCell = document.createElement("td");
                expertCell.appendChild(crearTexto("span", "cluster-expert-status", n.esExperto ? "ACTIVO" : "NO"));
                const commandCell = document.createElement("td");
                const xpButton = document.createElement("button");
                xpButton.className = "admin-btn admin-btn-purple";
                xpButton.type = "button";
                xpButton.textContent = "⚡ BONIFICAR XP";
                xpButton.addEventListener("click", () => inyectarXPMecanico(n.id, n.nombre));
                commandCell.appendChild(xpButton);
                row.appendChild(nameCell);
                row.appendChild(expertCell);
                row.appendChild(commandCell);
                tbody.appendChild(row);
            });
            tablaHijos.appendChild(thead);
            tablaHijos.appendChild(tbody);
            cardHtml.appendChild(tablaHijos);
        }
        mainContainer.appendChild(cardHtml);
    });
}

async function inyectarXPMecanico(idPerfil, nombre) {
    if (!(await asegurarSesionAdmin())) return;
    const cantidad = prompt(`¿Cuánta XP extra quieres inyectarle a ${nombre}?`);
    if (!cantidad || isNaN(cantidad)) return;
    try {
        await addDoc(collection(db, "alertas_xp"), {
            perfilId: idPerfil,
            xp: parseInt(cantidad),
            titulo: "Inyección de Biomasa Central",
            textMessage: `¡Has recibido +${cantidad} XP enviado por el Profesor!`,
            estado: "pendiente",
            timestamp: Date.now()
        });
        alert(`⚡ ¡XP enviada al buzón de campo de ${nombre}!`);
        await renderizarCuentasYPerfilesGlobales();
    } catch (error) {
        alert("Error de satélite central: " + error.message);
    }
}

async function cargarMuroModeracionGlobal() {
    if (!(await asegurarSesionAdmin())) return;
    const snap = await getDocs(collection(db, "capturas"));
    const table = document.getElementById("table-moderacion-body");
    limpiarNodo(table);
    snap.forEach(docSnap => {
        const c = docSnap.data();
        const idDoc = docSnap.id;
        if (c.municipioId === "Admin") return;
        const tr = document.createElement("tr");
        const imgCell = document.createElement("td");
        const thumb = document.createElement("img");
        thumb.src = c.foto || "";
        thumb.className = "moderation-thumb";
        thumb.alt = c.nombreComun || "Captura";
        imgCell.appendChild(thumb);

        const commonCell = document.createElement("td");
        const commonInput = document.createElement("input");
        commonInput.type = "text";
        commonInput.value = c.nombreComun || "";
        commonInput.id = `mod-comun-${idDoc}`;
        commonInput.className = "login-input moderation-input";
        commonCell.appendChild(commonInput);

        const scientificCell = document.createElement("td");
        const scientificInput = document.createElement("input");
        scientificInput.type = "text";
        scientificInput.value = c.nombreCientifico || "";
        scientificInput.id = `mod-cien-${idDoc}`;
        scientificInput.className = "login-input moderation-input moderation-input-scientific";
        scientificCell.appendChild(scientificInput);

        const locCell = document.createElement("td");
        locCell.appendChild(crearTexto("b", "", c.loc || "Campo"));

        const actionCell = document.createElement("td");
        const saveButton = document.createElement("button");
        saveButton.className = "admin-btn admin-btn-purple";
        saveButton.type = "button";
        saveButton.textContent = "💾 VINCULAR";
        saveButton.addEventListener("click", () => salvarCambiosTaxonomia(idDoc));
        const deleteButton = document.createElement("button");
        deleteButton.className = "admin-btn admin-btn-danger";
        deleteButton.type = "button";
        deleteButton.textContent = "✕ BORRAR";
        deleteButton.addEventListener("click", () => eliminarCapturaInapropiada(idDoc));
        actionCell.appendChild(saveButton);
        actionCell.appendChild(deleteButton);

        tr.appendChild(imgCell);
        tr.appendChild(commonCell);
        tr.appendChild(scientificCell);
        tr.appendChild(locCell);
        tr.appendChild(actionCell);
        table.appendChild(tr);
    });
}

async function salvarCambiosTaxonomia(idDoc) {
    if (!(await asegurarSesionAdmin())) return;
    const comun = document.getElementById(`mod-comun-${idDoc}`).value.trim();
    const cien = document.getElementById(`mod-cien-${idDoc}`).value.trim();
    await updateDoc(doc(db, "capturas", idDoc), { nombreComun: comun, nombreCientifico: cien });
    alert("¡Taxonomía vinculada con éxito en los servidores centrales!");
    await cargarMuroModeracionGlobal();
}

async function eliminarCapturaInapropiada(idDoc) {
    if (!(await asegurarSesionAdmin())) return;
    if (!confirm("¿Borrar esta muestra permanentemente de los registros?")) return;
    await deleteDoc(doc(db, "capturas", idDoc));
    await cargarMuroModeracionGlobal();
}

async function cargarSelectorEmailsAlertas() {
    if (!(await asegurarSesionAdmin())) return;
    const sUser = document.getElementById("alert-user-field");
    limpiarNodo(sUser);
    appendOption(sUser, "", "-- Selecciona Laboratorio Familiar --");
    const sChild = document.getElementById("sim-child-field");
    limpiarNodo(sChild);
    const sDestChild = document.getElementById("alert-child-field");
    limpiarNodo(sDestChild);
    appendOption(sDestChild, "", "-- Primero elige Cuenta --");

    const snapU = await getDocs(collection(db, "cuentas_familia"));
    snapU.forEach(d => {
        const email = d.data().email;
        appendOption(sUser, email, email);
    });

    const snapP = await getDocs(collection(db, "perfiles"));
    cacheAdminPerfilesCompletos = [];
    snapP.forEach(d => {
        cacheAdminPerfilesCompletos.push({ id: d.id, ...d.data() });
        appendOption(sChild, d.id, `${d.data().nombre.toUpperCase()} [${d.data().usuarioEmail}]`);
    });
}

function filtrarHijosDeCuentaParaMensajeDirecto(emailCuenta) {
    if (!adminSessionValid) return;
    const sDestChild = document.getElementById("alert-child-field");
    limpiarNodo(sDestChild);
    appendOption(sDestChild, "", "-- Todos los exploradores de la cuenta --");
    if (!emailCuenta) return;
    const filtrados = cacheAdminPerfilesCompletos.filter(p => p.usuarioEmail === emailCuenta);
    filtrados.forEach(p => { appendOption(sDestChild, p.id, p.nombre.toUpperCase()); });
}

function gestionarCambioTargetAlerta(tipo) {
    if (!adminSessionValid) return;
    document.getElementById("pais-select-row").style.display = tipo === "pais" ? "flex" : "none";
    document.getElementById("provincia-select-row").style.display = tipo === "provincial" ? "flex" : "none";
    document.getElementById("comarca-select-row").style.display = tipo === "comarcal" ? "flex" : "none";
    document.getElementById("usuario-select-row").style.display = (tipo === "cuenta" || tipo === "explorador") ? "flex" : "none";
    document.getElementById("explorador-select-row").style.display = tipo === "explorador" ? "flex" : "none";
}

function prepararDesplegablesSimulador() {
    if (!adminSessionValid) return;
    const pSel = document.getElementById("alert-pais-select");
    limpiarNodo(pSel);
    PAISES_PRECARGADOS.forEach(p => appendOption(pSel, p, p));
    const prSel = document.getElementById("alert-provincia-select");
    limpiarNodo(prSel);
    PROVINCIAS_PRECARGADAS.forEach(p => appendOption(prSel, p, p));
    const cSel = document.getElementById("alert-comarca-select");
    limpiarNodo(cSel);
    COMARCAS_PRECARGADAS.forEach(c => appendOption(cSel, c, c));
}

async function emitirAlertaSatelital() {
    if (!(await asegurarSesionAdmin())) return;
    const type = document.getElementById("alert-target-type").value;
    const msg = document.getElementById("alert-text-msg").value.trim();
    if (!msg) return alert("Escribe un comunicado de campo.");

    let val = "global";
    if (type === "pais") val = document.getElementById("alert-pais-select").value;
    else if (type === "provincial") val = document.getElementById("alert-provincia-select").value;
    else if (type === "comarcal") val = document.getElementById("alert-comarca-select").value;
    else if (type === "cuenta") val = document.getElementById("alert-user-field").value;
    else if (type === "explorador") val = document.getElementById("alert-child-field").value || document.getElementById("alert-user-field").value;

    await addDoc(collection(db, "alertas_comunidad"), { targetType: type, targetValue: val, textMessage: msg, timestamp: Date.now() });
    alert("📡 ¡Transmisión satelital desplegada en la red global!");
    document.getElementById("alert-text-msg").value = "";
}

async function inyectarCartaConLocalizacionesSimuladas(esLote) {
    if (!(await asegurarSesionAdmin())) return;
    const perfilDestinoId = document.getElementById("sim-child-field").value;
    const comun = document.getElementById("sim-comun-input").value.trim();
    const cien = document.getElementById("sim-cien-input").value.trim();
    const rareza = document.getElementById("sim-rareza-select").value;
    const loc = document.getElementById("sim-loc-input").value.trim() || "Entorno de Prueba";
    const desc = document.getElementById("sim-desc-textarea").value.trim() || "Muestra botánica inyectada desde la consola central.";

    if (!perfilDestinoId || !comun || !cien) return alert("Rellena los datos de simulación.");
    const pData = cacheAdminPerfilesCompletos.find(x => x.id === perfilDestinoId);
    if (!pData) return alert("No se ha encontrado el explorador de destino.");

    const mult = MULTIPLICADORES_RAREZA[rareza] || 1;
    const xpCalculada = Math.floor(20 * mult);

    const plantillaInyeccion = {
        nombreComun: comun,
        nombreCientifico: cien,
        rareza,
        descripcion: desc,
        xp: xpCalculada,
        loc,
        foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%231F6B3A'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>",
        fecha: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        perfil: perfilDestinoId,
        usuarioEmail: pData.usuarioEmail,
        municipioId: pData.base ? pData.base.municipio : "Test",
        comarcaId: pData.base ? pData.base.comarca : "Test",
        provinciaId: pData.base ? pData.base.provincia : "Test",
        paisId: pData.base ? pData.base.pais : "España"
    };

    await addDoc(collection(db, "capturas"), plantillaInyeccion);
    if (esLote) {
        await addDoc(collection(db, "capturas"), { ...plantillaInyeccion, nombreComun: `${comun} Alfa`, timestamp: Date.now() + 10 });
        await addDoc(collection(db, "capturas"), { ...plantillaInyeccion, nombreComun: `${comun} Beta`, timestamp: Date.now() + 20 });
    }
    alert("🧪 ¡Inyección de simulación completada de forma síncrona!");
    await switchAdminTab("panel-macro");
}

function inicializarEventosAdmin() {
    document.getElementById("admin-login-btn")?.addEventListener("click", gestionarLoginAdmin);
    document.getElementById("admin-password-input")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") gestionarLoginAdmin();
    });
    document.getElementById("admin-exit-btn")?.addEventListener("click", cerrarSesionAdmin);
    document.getElementById("admin-tab-macro-btn")?.addEventListener("click", (event) => switchAdminTab("panel-macro", event));
    document.getElementById("admin-tab-cuentas-btn")?.addEventListener("click", (event) => switchAdminTab("panel-cuentas", event));
    document.getElementById("admin-tab-moderacion-btn")?.addEventListener("click", (event) => switchAdminTab("panel-moderacion", event));
    document.getElementById("admin-tab-alertas-btn")?.addEventListener("click", (event) => switchAdminTab("panel-alertas", event));
    document.getElementById("alert-target-type")?.addEventListener("change", (event) => gestionarCambioTargetAlerta(event.target.value));
    document.getElementById("alert-user-field")?.addEventListener("change", (event) => filtrarHijosDeCuentaParaMensajeDirecto(event.target.value));
    document.getElementById("admin-alert-submit-btn")?.addEventListener("click", emitirAlertaSatelital);
    document.getElementById("admin-simulator-single-btn")?.addEventListener("click", () => inyectarCartaConLocalizacionesSimuladas(false));
    document.getElementById("admin-simulator-batch-btn")?.addEventListener("click", () => inyectarCartaConLocalizacionesSimuladas(true));
}

async function inicializarAdmin() {
    inicializarEventosAdmin();
    const esValida = await validarSesionAdmin();
    if (!esValida) {
        mostrarLoginAdmin();
        return;
    }
    mostrarPanelAdmin();
    await switchAdminTab("panel-macro");
}

inicializarAdmin();
