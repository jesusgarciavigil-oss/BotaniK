// Gestión de perfiles familiares, avatar y selector/dropdown de exploradores.
import {
    addDoc,
    collection,
    db,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where
} from "../config/firebase.js";
import {
    crearTexto,
    limpiarNodo,
    renderizarAvatarSeguro
} from "../core/dom.js";
import {
    resetModoEdicionPerfil,
    setModoEdicionPerfil,
    setPerfilActivo,
    state
} from "../core/state.js";
import { sincronizarSelectorTemaPerfil } from "../core/theme.js";

const profileCallbacks = {
    calculateAge: () => 8,
    compressProfileImage: null,
    onProfileSelected: null,
    onProfileNeedsBase: null,
    onProfileReady: null,
    onAlbumRefresh: null,
    isAlbumActive: null
};

export function initializeProfiles(callbacks = {}) {
    Object.assign(profileCallbacks, callbacks);

    window.abrirCreadorPerfilModal = abrirCreadorPerfilModal;
    window.abrirEditorPerfilSpecifico = abrirEditorPerfilSpecifico;
    window.selectAvatarElement = selectAvatarElement;
    window.procesarFotoPerfilReal = procesarFotoPerfilReal;
    window.finalizarCreacionPerfil = finalizarCreacionPerfil;
    window.cerrarCreadorPerfilModal = cerrarCreadorPerfilModal;
    window.eliminarPerfil = eliminarPerfil;
    window.seleccionarPerfil = seleccionarPerfil;
    window.toggleDropdownCuentasCabecera = toggleDropdownCuentasCabecera;

    document.addEventListener('click', cerrarDropdownCuentasSiProcede);
}

function abrirCreadorPerfilModal() {
    resetModoEdicionPerfil();
    document.getElementById('modal-title-context').innerText = "ALTA DE EXPLORADOR";
    document.getElementById('profile-name-input').value = "";
    document.getElementById('profile-date-input').value = "2018-01-01";
    document.getElementById('expert-toggle-input').checked = false;
    renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), "🧑‍🚀");
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.avatar-option[data-avatar="🧑‍🚀"]').classList.add('selected');
    document.getElementById('nav-dropdown-box').style.display = 'none';
    sincronizarSelectorTemaPerfil();
    document.getElementById('avatar-picker-modal').style.display = 'flex';
}

function abrirEditorPerfilSpecifico(event, idDoc) {
    if(event) event.stopPropagation();
    document.getElementById('nav-dropdown-box').style.display = 'none';
    let p = state.cachePerfilesFamilia.find(item => item.id === idDoc);
    if(!p) return;

    setModoEdicionPerfil({ activo: true, idPerfil: idDoc, avatar: p.avatar || "🧑‍🚀" });
    document.getElementById('modal-title-context').innerText = `MODIFICAR A ${p.nombre.toUpperCase()}`;
    document.getElementById('profile-name-input').value = p.nombre;
    document.getElementById('profile-date-input').value = p.fechaNacimiento || "2018-01-01";
    document.getElementById('expert-toggle-input').checked = p.esExperto || false;

    const esImg = state.selectedAvatarValue.startsWith("data:image");
    renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), state.selectedAvatarValue);
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.remove('selected');
        if(!esImg && opt.getAttribute('data-avatar') === state.selectedAvatarValue) opt.classList.add('selected');
    });
    sincronizarSelectorTemaPerfil();
    document.getElementById('avatar-picker-modal').style.display = 'flex';
}

function selectAvatarElement(el, val) {
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected'); state.selectedAvatarValue = val;
    renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), val);
}

function procesarFotoPerfilReal(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const base64Comprimido = profileCallbacks.compressProfileImage(img);
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            state.selectedAvatarValue = base64Comprimido;
            renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), base64Comprimido);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function finalizarCreacionPerfil() {
    const nombre = document.getElementById('profile-name-input').value.trim();
    const fechaNac = document.getElementById('profile-date-input').value;
    const esExperto = document.getElementById('expert-toggle-input').checked;
    if(!nombre || !fechaNac) return alert("Por favor, rellena los campos obligatorios.");

    try {
        if (state.modoEdicionActivo) {
            const targetId = state.idPerfilEnEdicionFila || state.perfilActiveId;
            await updateDoc(doc(db, "perfiles", targetId), { nombre: nombre, fechaNacimiento: fechaNac, avatar: state.selectedAvatarValue, esExperto: esExperto });
            if(targetId === state.perfilActiveId) {
                setPerfilActivo({
                    idDoc: state.perfilActiveId,
                    nombre,
                    fechaNacimiento: fechaNac,
                    avatar: state.selectedAvatarValue,
                    base: state.perfilActivoBase,
                    esExperto
                });
                renderizarAvatarSeguro(document.getElementById('head-av-box'), state.selectedAvatarValue);
                document.getElementById('head-name').innerText = nombre.toUpperCase();
            }
            alert("¡Mente de Campo Sincronizada!");
        } else {
            await addDoc(collection(db, "perfiles"), { nombre: nombre, fechaNacimiento: fechaNac, avatar: state.selectedAvatarValue, esExperto: esExperto, usuarioEmail: state.usuarioEmailActual, base: null });
        }
        document.getElementById('avatar-picker-modal').style.display = 'none';
        if(state.perfilActiveId) { await recalcularCacheYDesplegable(); profileCallbacks.onAlbumRefresh?.(); }
        else { await mostrarSelectorPerfiles(); }
    } catch (err) { alert(err.message); }
}

function cerrarCreadorPerfilModal() {
    document.getElementById('avatar-picker-modal').style.display = 'none';
}

export async function mostrarSelectorPerfiles() {
    document.querySelector('header').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
    document.getElementById('profile-page').style.display = 'flex';

    const grid = document.getElementById('perfiles-dinamicos');
    limpiarNodo(grid);
    const q = query(collection(db, "perfiles"), where("usuarioEmail", "==", state.usuarioEmailActual));
    const snap = await getDocs(q); state.cachePerfilesFamilia = [];

    snap.forEach(documento => {
        const dataId = documento.id; const p = documento.data(); state.cachePerfilesFamilia.push({ id: dataId, ...p });
        const edadCalculada = profileCallbacks.calculateAge(p.fechaNacimiento);

        const div = document.createElement('div');
        div.className = "profile-item";

        const deleteButton = document.createElement('button');
        deleteButton.className = "delete-profile-badge";
        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.addEventListener('click', (e) => { window.eliminarPerfil(e, dataId, p.nombre); });

        const avatarDisplay = document.createElement('div');
        avatarDisplay.className = "profile-avatar-display";
        renderizarAvatarSeguro(avatarDisplay, p.avatar || "🧑‍🚀");

        const nameDisplay = crearTexto('div', 'profile-name-display', p.nombre);
        const ageDisplay = crearTexto('div', 'profile-age-display', `${edadCalculada} años ${p.esExperto ? '• EXPERTO' : ''}`);

        div.appendChild(deleteButton);
        div.appendChild(avatarDisplay);
        div.appendChild(nameDisplay);
        div.appendChild(ageDisplay);
        div.addEventListener('click', (e) => { if(e.target.className === 'delete-profile-badge') return; window.seleccionarPerfil(dataId, p.nombre, p.fechaNacimiento || '2018-01-01', p.avatar || '🧑‍🚀', p.base || null, p.esExperto || false); });
        grid.appendChild(div);
    });
    const btnAdd = document.createElement('div');
    btnAdd.className = "profile-item add-profile-item-btn";
    const addIcon = crearTexto('div', 'add-profile-icon', '➕');
    btnAdd.appendChild(addIcon);
    btnAdd.appendChild(document.createTextNode('Añadir Explorador'));
    btnAdd.addEventListener('click', window.abrirCreadorPerfilModal);
    grid.appendChild(btnAdd);
}

async function eliminarPerfil(event, idDoc, nombre) {
    event.stopPropagation(); if (!confirm(`¿Eliminar perfil de ${nombre}?`)) return;
    try { await deleteDoc(doc(db, "perfiles", idDoc)); if(state.perfilActiveId === idDoc) { window.cerrarSesionCompleta(); } else { await mostrarSelectorPerfiles(); if(state.perfilActiveId) recalcularCacheYDesplegable(); } } catch (err) { alert(err.message); }
}

async function seleccionarPerfil(idDoc, nombre, fechaNacimiento, avatar, base, esExperto) {
    setPerfilActivo({ idDoc, nombre, fechaNacimiento, avatar, base, esExperto });
    const edadCalculada = profileCallbacks.calculateAge(fechaNacimiento);
    document.getElementById('profile-page').style.display = 'none'; document.querySelector('header').style.display = 'flex'; document.querySelector('nav').style.display = 'flex';

    renderizarAvatarSeguro(document.getElementById('head-av-box'), avatar);
    document.getElementById('head-name').innerText = nombre.toUpperCase();
    document.getElementById('head-age').innerText = `${esExperto ? '🎓 EXPERTO' : 'Explorador'} • ${edadCalculada} años`;

    await profileCallbacks.onProfileSelected?.();
    recalcularCacheYDesplegable();

    if (!state.perfilActivoBase) { profileCallbacks.onProfileNeedsBase?.(); } else { profileCallbacks.onProfileReady?.(); }
}

export async function recalcularCacheYDesplegable() {
    const q = query(collection(db, "perfiles"), where("usuarioEmail", "==", state.usuarioEmailActual));
    const snap = await getDocs(q); state.cachePerfilesFamilia = [];
    snap.forEach(d => state.cachePerfilesFamilia.push({ id: d.id, ...d.data() }));
    buildDropdownDOM();
}

function buildDropdownDOM() {
    const container = document.getElementById('nav-dropdown-box'); if (!container) return; limpiarNodo(container);
    const avatarSeguroActivo = state.perfilActivoAvatar || "🧑‍🚀"; const nombreSeguroActivo = state.perfilActivoNombre || "Explorador";

    const rowActivo = document.createElement('div'); rowActivo.className = 'dropdown-account-item active-user-row';
    const leftActivo = document.createElement('div');
    leftActivo.className = 'dropdown-left-clickable';
    const avatarActivo = document.createElement('div');
    avatarActivo.className = 'dropdown-avatar dropdown-avatar-active';
    renderizarAvatarSeguro(avatarActivo, avatarSeguroActivo);
    const nameActivo = crearTexto('div', 'dropdown-name dropdown-name-active', `${nombreSeguroActivo} `);
    nameActivo.appendChild(crearTexto('span', 'dropdown-active-note', '(En uso)'));
    leftActivo.appendChild(avatarActivo);
    leftActivo.appendChild(nameActivo);
    const editActivo = document.createElement('button');
    editActivo.className = 'dropdown-edit-btn';
    editActivo.type = 'button';
    editActivo.title = 'Editar Perfil';
    editActivo.textContent = '⚙️';
    editActivo.addEventListener('click', (e) => { window.abrirEditorPerfilSpecifico(e, state.perfilActiveId); });
    rowActivo.appendChild(leftActivo);
    rowActivo.appendChild(editActivo);
    container.appendChild(rowActivo);

    state.cachePerfilesFamilia.forEach(p => {
        if (p.id === state.perfilActiveId) return;
        const row = document.createElement('div'); row.className = 'dropdown-account-item';
        const left = document.createElement('div');
        left.className = 'dropdown-left-clickable';
        const avatar = document.createElement('div');
        avatar.className = 'dropdown-avatar';
        renderizarAvatarSeguro(avatar, p.avatar || "🧑‍🚀");
        left.appendChild(avatar);
        left.appendChild(crearTexto('div', 'dropdown-name', p.nombre || 'Explorador'));
        left.addEventListener('click', () => { container.style.display = 'none'; window.seleccionarPerfil(p.id, p.nombre, p.fechaNacimiento || "2018-01-01", p.avatar || "🧑‍🚀", p.base || null, p.esExperto || false); if (profileCallbacks.isAlbumActive?.()) profileCallbacks.onAlbumRefresh?.(); });

        const editButton = document.createElement('button');
        editButton.className = 'dropdown-edit-btn';
        editButton.type = 'button';
        editButton.title = 'Editar Perfil';
        editButton.textContent = '⚙️';
        editButton.addEventListener('click', (e) => { window.abrirEditorPerfilSpecifico(e, p.id); });

        row.appendChild(left);
        row.appendChild(editButton);
        container.appendChild(row);
    });
    const footerAdd = document.createElement('div');
    footerAdd.className = 'dropdown-footer-btn';
    footerAdd.appendChild(crearTexto('span', '', '➕'));
    footerAdd.appendChild(document.createTextNode(' Añadir nuevo explorador'));
    footerAdd.addEventListener('click', window.abrirCreadorPerfilModal);
    container.appendChild(footerAdd);

    const footerLogout = document.createElement('div');
    footerLogout.className = 'dropdown-footer-btn dropdown-footer-logout';
    footerLogout.appendChild(crearTexto('span', '', '🔒'));
    footerLogout.appendChild(document.createTextNode(' Cambiar de terminal'));
    footerLogout.addEventListener('click', () => { if(confirm("¿Cerrar sesión familiar?")) window.cerrarSesionCompleta(); });
    container.appendChild(footerLogout);
}

function toggleDropdownCuentasCabecera(event) {
    if(event) event.stopPropagation(); const box = document.getElementById('nav-dropdown-box'); box.style.display = (box.style.display === 'block') ? 'none' : 'block';
}

function cerrarDropdownCuentasSiProcede(e) {
    const box = document.getElementById('nav-dropdown-box'); const trigger = document.querySelector('.header-profile-box'); if (box && box.style.display === 'block' && !box.contains(e.target) && !trigger.contains(e.target)) box.style.display = 'none';
}
