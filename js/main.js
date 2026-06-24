        /* ==========================================================================
           1. IMPORTS
           ========================================================================== */

        import {
            addDoc,
            collection,
            db,
            deleteDoc,
            doc,
            getDocs,
            onSnapshot,
            query,
            updateDoc,
            where
        } from "./config/firebase.js";
        import {
            MENSAJE_PANEL_ADMIN_SEPARADO,
            MULTIPLICADORES_RAREZA,
            RANGOS_EXPLORACION,
            TITULOS_ADAPTACION
        } from "./core/constants.js";
        import {
            crearTexto,
            limpiarNodo,
            obtenerClaseRarezaSegura,
            renderizarAvatarSeguro
        } from "./core/dom.js";
        import {
            initializeThemeControls,
            sincronizarSelectorTemaPerfil
        } from "./core/theme.js";
        import { createSwitchPage } from "./core/navigation.js";
        import { analyzePlantImage } from "./services/plant-analysis.js";
        
        /* ==========================================================================
           2. MANEJADORES GLOBALES DE ERROR
           ========================================================================== */

        // RADAR GLOBAL DE EMERGENCIA: Captura cualquier error en cualquier parte del código
        window.onerror = function (message, source, lineno, colno, error) {
            alert(`🚨 ERROR DE SISTEMA GLOBAL:\n\nMensaje: ${message}\nLínea: ${lineno}\nArchivo: ${source}`);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'none';
            return false;
        };

        window.addEventListener('unhandledrejection', function (event) {
            alert(`📡 FALLO SATELITAL ASÍNCRONO (Promesa rechazada):\n\nMotivo: ${event.reason}`);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'none';
        });
        
        /* ==========================================================================
           3. FIREBASE, FIRESTORE Y SERVICIOS EXTERNOS
           ========================================================================== */

        /* ==========================================================================
           4. LISTENERS GLOBALES DE INTERFAZ
           ========================================================================== */

        // Capa de protección física de la interfaz (Optimizado para no romper el scroll en móviles)
        document.addEventListener('contextmenu', event => {
            if (event.target.id === 'm-desc' || event.target.closest('.modal-desc-poke')) return; 
            event.preventDefault();
        });

        function inicializarEventosEstaticos() {
            document.getElementById('submit-btn')?.addEventListener('click', () => window.gestionarAcceso());
            document.getElementById('toggle-text')?.addEventListener('click', () => window.toggleModo());
            document.getElementById('profile-exit-session-btn')?.addEventListener('click', () => window.cerrarSesionCompleta());

            document.getElementById('gps-base-sync-btn')?.addEventListener('click', () => window.localizarBasePorGPS());
            document.getElementById('manual-base-toggle')?.addEventListener('click', () => window.activarEntradaManualBase());
            document.getElementById('manual-base-confirm-btn')?.addEventListener('click', () => window.confirmarBaseManual());

            document.getElementById('header-profile-trigger')?.addEventListener('click', (event) => window.toggleDropdownCuentasCabecera(event));
            document.getElementById('header-mailbox-btn')?.addEventListener('click', () => window.abrirBuzonHistoricoModal());

            document.getElementById('scan-trigger-btn')?.addEventListener('click', () => window.triggerCamera());
            document.getElementById('camera-input')?.addEventListener('change', (event) => window.procesarFoto(event));
            document.getElementById('search-botanika')?.addEventListener('input', () => window.filtrarYOrdenarAlbum());

            document.getElementById('nav-radar-btn')?.addEventListener('click', (event) => window.switchPage('radar', event.currentTarget));
            document.getElementById('nav-album-btn')?.addEventListener('click', (event) => window.switchPage('album', event.currentTarget));

            document.getElementById('profile-image-upload-input')?.addEventListener('change', (event) => window.procesarFotoPerfilReal(event));
            document.querySelectorAll('#avatar-picker-modal .avatar-option').forEach((avatarOption) => {
                avatarOption.addEventListener('click', () => window.selectAvatarElement(avatarOption, avatarOption.dataset.avatar));
            });
            document.getElementById('profile-modal-cancel-btn')?.addEventListener('click', () => window.cerrarCreadorPerfilModal());
            document.getElementById('profile-modal-submit-btn')?.addEventListener('click', () => window.finalizarCreacionPerfil());

            document.getElementById('cromo-overlay-modal')?.addEventListener('click', (event) => window.evaluarCierrePorFondo(event));
            document.getElementById('modal-card-inner')?.addEventListener('click', (event) => window.voltearCartaModal(event, event.currentTarget));
            document.getElementById('modal-title-poke-trigger')?.addEventListener('click', (event) => window.desplegarNombresAlternativosModal(event));

            const mailboxModal = document.getElementById('mailbox-modal');
            mailboxModal?.addEventListener('click', (event) => {
                if (event.target.id === 'mailbox-modal') mailboxModal.style.display = 'none';
            });
            document.getElementById('mailbox-close-btn')?.addEventListener('click', () => {
                const modal = document.getElementById('mailbox-modal');
                if (modal) modal.style.display = 'none';
            });

        }
         
        /* ==========================================================================
           5. ESTADO GLOBAL
           ========================================================================== */

        // Variables Globales de Estado del Sistema de Exploración
        window.modoRegistro = false;
        let usuarioEmailActual = "";
        let perfilActiveId = "";
        let perfilActivoNombre = "";
        let perfilActivoNacimiento = "2018-01-01";
        let perfilActivoAvatar = "🧑‍🚀";
        let perfilActivoBase = null;
        let perfilActivoEsExperto = false;
        let modoEdicionActivo = false;
        let idPerfilEnEdicionFila = "";

        let selectedAvatarValue = "🧑‍🚀";
        let albumEspeciesMemoria = {};
        let cachePerfilesFamilia = [];
        let cacheAlertasGlobales = [];
        let unsuscribeXpLive = null;

        /* ==========================================================================
           6. CONSTANTES DE JUEGO, RAREZAS, RANGOS Y LOCALIZACIÓN
           ========================================================================== */

        /* ==========================================================================
           7. UTILIDADES GENERALES
           ========================================================================== */

        function calcularEdadExacta(fechaNacimientoStr) {
            if(!fechaNacimientoStr) return 8;
            const fechaNac = new Date(fechaNacimientoStr);
            const fechaActual2026 = new Date("2026-06-18");
            let edad = fechaActual2026.getFullYear() - fechaNac.getFullYear();
            const m = fechaActual2026.getMonth() - fechaNac.getMonth();
            if (m < 0 || (m === 0 && fechaActual2026.getDate() < fechaNac.getDate())) { edad--; }
            return edad < 0 ? 0 : edad;
        }

        window.getUbicacionGPS = () => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) return resolve(null);
                navigator.geolocation.getCurrentPosition(
                    (pos) => { resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                    () => { resolve(null); },
                    { timeout: 3000 }
                );
            });
        };

        function comprobarImagenProporcional(imgElement, maxAnchoAlto, calidad) {
            const canvas = document.createElement('canvas');
            let ancho = imgElement.width; let alto = imgElement.height;
            if (ancho > alto) { if (ancho > maxAnchoAlto) { alto *= maxAnchoAlto / ancho; ancho = maxAnchoAlto; } }
            else { if (alto > maxAnchoAlto) { ancho *= maxAnchoAlto / alto; alto = maxAnchoAlto; } }
            canvas.width = ancho; canvas.height = alto;
            canvas.getContext('2d').drawImage(imgElement, 0, 0, ancho, alto);
            return canvas.toDataURL('image/jpeg', calidad);
        }

        function appendOption(select, value, label) {
            if (!select) return;
            select.add(new Option(label ?? "", value ?? ""));
        }

        function avisarPanelAdminSeparado() {
            alert(MENSAJE_PANEL_ADMIN_SEPARADO);
            return false;
        }

        function esIntentoPanelAdminDeshabilitado(email, pass) {
            const textoAcceso = `${email} ${pass}`.toLowerCase();
            return ["admin", "mando", "supremo", "god", "master"].some(marcador => textoAcceso.includes(marcador));
        }

        /* ==========================================================================
           8. LOGIN Y REGISTRO
           ========================================================================== */

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
                    usuarioEmailActual = email;
                    document.getElementById('login-page').style.display = 'none';
                    await mostrarSelectorPerfiles();
                } else {
                    let valido = false;
                    snap.forEach(doc => { if(doc.data().pass === pass) valido = true; });

                    if (valido) {
                        usuarioEmailActual = email;
                        document.getElementById('login-page').style.display = 'none';
                        await mostrarSelectorPerfiles();
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

        /* ==========================================================================
           9. TEMA DENTRO DEL MODAL DE PERFIL
           ========================================================================== */

        initializeThemeControls();

        /* ==========================================================================
           10. PERFILES Y SELECTOR DE EXPLORADORES
           ========================================================================== */

        window.abrirCreadorPerfilModal = () => {
            modoEdicionActivo = false; idPerfilEnEdicionFila = ""; selectedAvatarValue = "🧑‍🚀";
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
        };

        window.abrirEditorPerfilSpecifico = (event, idDoc) => {
            if(event) event.stopPropagation();
            document.getElementById('nav-dropdown-box').style.display = 'none';
            let p = cachePerfilesFamilia.find(item => item.id === idDoc);
            if(!p) return;

            modoEdicionActivo = true; idPerfilEnEdicionFila = idDoc; selectedAvatarValue = p.avatar || "🧑‍🚀";
            document.getElementById('modal-title-context').innerText = `MODIFICAR A ${p.nombre.toUpperCase()}`;
            document.getElementById('profile-name-input').value = p.nombre;
            document.getElementById('profile-date-input').value = p.fechaNacimiento || "2018-01-01";
            document.getElementById('expert-toggle-input').checked = p.esExperto || false;
            
            const esImg = selectedAvatarValue.startsWith("data:image");
            renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), selectedAvatarValue);
            document.querySelectorAll('.avatar-option').forEach(opt => {
                opt.classList.remove('selected');
                if(!esImg && opt.getAttribute('data-avatar') === selectedAvatarValue) opt.classList.add('selected');
            });
            sincronizarSelectorTemaPerfil();
            document.getElementById('avatar-picker-modal').style.display = 'flex';
        };

        window.selectAvatarElement = (el, val) => {
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected'); selectedAvatarValue = val;
            renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), val);
        };

        window.procesarFotoPerfilReal = (event) => {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const base64Comprimido = comprobarImagenProporcional(img, 120, 0.7);
                    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                    selectedAvatarValue = base64Comprimido;
                    renderizarAvatarSeguro(document.getElementById('avatar-preview-circle'), base64Comprimido);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        window.finalizarCreacionPerfil = async () => {
            const nombre = document.getElementById('profile-name-input').value.trim();
            const fechaNac = document.getElementById('profile-date-input').value;
            const esExperto = document.getElementById('expert-toggle-input').checked;
            if(!nombre || !fechaNac) return alert("Por favor, rellena los campos obligatorios.");

            try {
                if (modoEdicionActivo) {
                    const targetId = idPerfilEnEdicionFila || perfilActiveId;
                    await updateDoc(doc(db, "perfiles", targetId), { nombre: nombre, fechaNacimiento: fechaNac, avatar: selectedAvatarValue, esExperto: esExperto });
                    if(targetId === perfilActiveId) {
                        perfilActivoNombre = nombre; perfilActivoNacimiento = fechaNac; perfilActivoAvatar = selectedAvatarValue; perfilActivoEsExperto = esExperto;
                        renderizarAvatarSeguro(document.getElementById('head-av-box'), selectedAvatarValue);
                        document.getElementById('head-name').innerText = nombre.toUpperCase();
                    }
                    alert("¡Mente de Campo Sincronizada!");
                } else {
                    await addDoc(collection(db, "perfiles"), { nombre: nombre, fechaNacimiento: fechaNac, avatar: selectedAvatarValue, esExperto: esExperto, usuarioEmail: usuarioEmailActual, base: null });
                }
                document.getElementById('avatar-picker-modal').style.display = 'none';
                if(perfilActiveId) { await recalcularCacheYDesplegable(); cargarAlbum(); }
                else { await mostrarSelectorPerfiles(); }
            } catch (err) { alert(err.message); }
        };

        window.cerrarCreadorPerfilModal = () => { document.getElementById('avatar-picker-modal').style.display = 'none'; };

        async function mostrarSelectorPerfiles() {
            document.querySelector('header').style.display = 'none';
            document.querySelector('nav').style.display = 'none';
            document.getElementById('profile-page').style.display = 'flex';
            
            const grid = document.getElementById('perfiles-dinamicos');
            limpiarNodo(grid);
            const q = query(collection(db, "perfiles"), where("usuarioEmail", "==", usuarioEmailActual));
            const snap = await getDocs(q); cachePerfilesFamilia = [];
            
            snap.forEach(documento => {
                const dataId = documento.id; const p = documento.data(); cachePerfilesFamilia.push({ id: dataId, ...p });
                const edadCalculada = calcularEdadExacta(p.fechaNacimiento);

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

        window.eliminarPerfil = async (event, idDoc, nombre) => {
            event.stopPropagation(); if (!confirm(`¿Eliminar perfil de ${nombre}?`)) return;
            try { await deleteDoc(doc(db, "perfiles", idDoc)); if(perfilActiveId === idDoc) { window.cerrarSesionCompleta(); } else { await mostrarSelectorPerfiles(); if(perfilActiveId) recalcularCacheYDesplegable(); } } catch (err) { alert(err.message); }
        };

        window.cerrarSesionCompleta = () => {
            if(unsuscribeXpLive) { unsuscribeXpLive(); unsuscribeXpLive = null; }
            usuarioEmailActual = ""; perfilActiveId = "";
            document.getElementById('username').value = ""; document.getElementById('password').value = "";
            document.getElementById('login-page').style.display = 'flex'; document.getElementById('profile-page').style.display = 'none'; document.getElementById('nav-dropdown-box').style.display = 'none'; document.querySelector('header').style.display = 'none'; document.querySelector('nav').style.display = 'none';
        };

        window.seleccionarPerfil = async (idDoc, nombre, fechaNacimiento, avatar, base, esExperto) => {
            perfilActiveId = idDoc; perfilActivoNombre = nombre; perfilActivoNacimiento = fechaNacimiento; perfilActivoAvatar = avatar; perfilActivoBase = base; perfilActivoEsExperto = esExperto;
            const edadCalculada = calcularEdadExacta(fechaNacimiento);
            document.getElementById('profile-page').style.display = 'none'; document.querySelector('header').style.display = 'flex'; document.querySelector('nav').style.display = 'flex';
            
            renderizarAvatarSeguro(document.getElementById('head-av-box'), avatar);
            document.getElementById('head-name').innerText = nombre.toUpperCase();
            document.getElementById('head-age').innerText = `${esExperto ? '🎓 EXPERTO' : 'Explorador'} • ${edadCalculada} años`;

            window.activarEscuchaBiomasaEnVivo();
            await window.verificarAlertasMisionesComarcales();
            recalcularCacheYDesplegable();

            if (!perfilActivoBase) { document.getElementById('setup-base-page').style.display = 'flex'; } else { actualizarEstado(); }
        };

        /* ==========================================================================
           11. XP EN TIEMPO REAL Y RECOMPENSAS ENTREGADAS
           ========================================================================== */

        window.activarEscuchaBiomasaEnVivo = () => {
            if(unsuscribeXpLive) unsuscribeXpLive();
            const q = query(collection(db, "alertas_xp"), where("perfilId", "==", perfilActiveId), where("estado", "==", "pendiente"));
            unsuscribeXpLive = onSnapshot(q, (snapshot) => {
                snapshot.docs.forEach(async (docSnap) => {
                    const alerta = docSnap.data(); const idAlerta = docSnap.id;
                    await updateDoc(doc(db, "alertas_xp", idAlerta), { estado: "entregado" });
                    await addDoc(collection(db, "capturas"), { nombreComun: alerta.titulo || "Cargamento de Biomasa", nombreCientifico: "Bonus Laboratorio Central", rareza: "especial", descripcion: alerta.mensaje || alerta.textMessage, foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='%2339FF14'><path d='M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z'/></svg>", fecha: new Date().toLocaleDateString(), timestamp: Date.now(), xp: parseInt(alerta.xp), loc: "Laboratorio Central", municipioId: "Admin", comarcaId: "Admin", perfil: perfilActiveId, usuarioEmail: usuarioEmailActual });
                    
                    const alertBox = document.getElementById('live-xp-badge-alert');
                    if (alertBox) {
                        document.getElementById('live-xp-amount-txt').innerText = `+${alerta.xp}`;
                        alertBox.classList.add('show-alert'); actualizarEstado();
                        setTimeout(() => { alertBox.classList.remove('show-alert'); }, 5000);
                    }
                });
            });
        };

        async function recalcularCacheYDesplegable() {
            const q = query(collection(db, "perfiles"), where("usuarioEmail", "==", usuarioEmailActual));
            const snap = await getDocs(q); cachePerfilesFamilia = [];
            snap.forEach(d => cachePerfilesFamilia.push({ id: d.id, ...d.data() }));
            buildDropdownDOM();
        }

        /* ==========================================================================
           12. CABECERA Y DROPDOWN DE PERFILES
           ========================================================================== */

        function buildDropdownDOM() {
            const container = document.getElementById('nav-dropdown-box'); if (!container) return; limpiarNodo(container);
            const avatarSeguroActivo = perfilActivoAvatar || "🧑‍🚀"; const nombreSeguroActivo = perfilActivoNombre || "Explorador";
            
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
            editActivo.addEventListener('click', (e) => { window.abrirEditorPerfilSpecifico(e, perfilActiveId); });
            rowActivo.appendChild(leftActivo);
            rowActivo.appendChild(editActivo);
            container.appendChild(rowActivo);

            cachePerfilesFamilia.forEach(p => {
                if (p.id === perfilActiveId) return;
                const row = document.createElement('div'); row.className = 'dropdown-account-item';
                const left = document.createElement('div');
                left.className = 'dropdown-left-clickable';
                const avatar = document.createElement('div');
                avatar.className = 'dropdown-avatar';
                renderizarAvatarSeguro(avatar, p.avatar || "🧑‍🚀");
                left.appendChild(avatar);
                left.appendChild(crearTexto('div', 'dropdown-name', p.nombre || 'Explorador'));
                left.addEventListener('click', () => { container.style.display = 'none'; window.seleccionarPerfil(p.id, p.nombre, p.fechaNacimiento || "2018-01-01", p.avatar || "🧑‍🚀", p.base || null, p.esExperto || false); if (document.getElementById('album').classList.contains('active')) cargarAlbum(); });

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

        window.toggleDropdownCuentasCabecera = (event) => { if(event) event.stopPropagation(); const box = document.getElementById('nav-dropdown-box'); box.style.display = (box.style.display === 'block') ? 'none' : 'block'; };
        document.addEventListener('click', (e) => { const box = document.getElementById('nav-dropdown-box'); const trigger = document.querySelector('.header-profile-box'); if (box && box.style.display === 'block' && !box.contains(e.target) && !trigger.contains(e.target)) box.style.display = 'none'; });

        /* ==========================================================================
           13. CONFIGURACIÓN DE BASE GPS/MANUAL
           ========================================================================== */

        window.localizarBasePorGPS = async () => {
            document.getElementById('loading-base-txt').innerText = "📡 BUSCANDO RESPUESTA DE SATÉLITES GPS EN TIEMPO REAL...";
            const gps = await window.getUbicacionGPS();
            if (!gps) {
                alert("No se ha podido adquirir telemetría GPS. Por favor, introduce tu comarca manualmente.");
                window.activarEntradaManualBase();
                return;
            }
            await calibrarBiomaPorCoordenadas(gps.lat, gps.lng, "Ubicación Satelital Automática");
        };

        window.activarEntradaManualBase = () => {
            document.getElementById('gps-base-box').style.display = 'none';
            document.getElementById('manual-base-box').style.display = 'block';
            document.getElementById('loading-base-txt').innerText = "Introduce tu municipio, comarca o provincia para sintonizar los biomas locales de forma manual:";
        };

        window.confirmarBaseManual = async () => {
            const txt = document.getElementById('manual-lugar-input').value.trim();
            if(!txt) return alert("Por favor, introduce un nombre de sector válido.");
            await calibrarBiomaPorCoordenadas(43.38, -3.22, txt);
        };

        async function calibrarBiomaPorCoordenadas(lat, lng, queryTxt) {
            let pais = "España"; let provincia = "Cantabria"; let comarca = "Costa Oriental"; let municipio = "Castro Urdiales";
            const normal = queryTxt.toLowerCase();
            
            if(normal.includes("jaen") || normal.includes("carolina") || normal.includes("mágina") || normal.includes("cazorla")) { provincia = "Jaén"; comarca = "Sierra Mágina"; municipio = "La Carolina"; }
            else if(normal.includes("bilbao") || normal.includes("viazcaya") || normal.includes("bizkaia")) { provincia = "Vizcaya"; comarca = "Gran Bilbao"; municipio = "Bilbao"; }
            else if(normal.includes("málaga") || normal.includes("ronda") || normal.includes("marbella")) { provincia = "Málaga"; comarca = "Serranía de Ronda"; municipio = "Málaga"; }
            else if(normal.includes("granada")) { provincia = "Granada"; comarca = "Granada Metropolitana"; municipio = "Granada"; }

            const baseObjeto = { lat: lat, lng: lng, pais: pais, provincia: provincia, comarca: comarca, municipio: municipio, queryLabel: queryTxt };
            await updateDoc(doc(db, "perfiles", perfilActiveId), { base: baseObjeto });
            
            perfilActivoBase = baseObjeto;
            document.getElementById('setup-base-page').style.display = 'none';
            alert(`¡Base Secreta Establecida en ${municipio} (${comarca})!`);
            
            actualizarEstado();
            await window.verificarAlertasMisionesComarcales();
            recalcularCacheYDesplegable();
        }

        /* ==========================================================================
           15. RADAR, CÁMARA, GEMINI Y PROCESAMIENTO DE CAPTURAS
           ========================================================================== */

        window.triggerCamera = () => { document.getElementById('camera-input').click(); };

        window.procesarFoto = async (event) => {
            const file = event.target.files[0]; if (!file) return;
            document.getElementById('loading').style.display = 'block';

            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // 1. Redimensionamos y extraemos la foto
                        const base64DataCompleta = comprobarImagenProporcional(img, 700, 0.7);
                        
                        // --- 🛡️ NUEVO CORTAFUEGOS ANTI ERROR 400 ---
                        if (!base64DataCompleta || !base64DataCompleta.includes(",")) {
                            document.getElementById('loading').style.display = 'none';
                            alert("⚠️ Error de Escáner: El formato de esta foto no es compatible en PC. Por favor, prueba con un JPG normal.");
                            return;
                        }
                        
                        const base64Data = base64DataCompleta.split(",")[1];
                        
                        if (!base64Data || base64Data.length < 100) {
                            document.getElementById('loading').style.display = 'none';
                            alert("⚠️ Error de Escáner: La imagen está corrupta o vacía. Intenta con otra.");
                            return;
                        }
                        // --------------------------------------------

                        let edadAventurero = calcularEdadExacta(perfilActivoNacimiento);
                        let sectorBaseTxt = perfilActivoBase ? `${perfilActivoBase.municipio}, en la provincia de ${perfilActivoBase.provincia}` : "Desconocido";

                        let planta;
                        const respuestaAnalisis = await analyzePlantImage({
                            imageBase64: base64Data,
                            edadAventurero,
                            sectorBaseTxt,
                            perfilActivoEsExperto
                        });

                        if (!respuestaAnalisis.ok) {
                            alert(`🚨 ERROR CRÍTICO: El satélite botánico no pudo completar el análisis.\nDetalle: ${respuestaAnalisis.body?.error || 'Error de comunicación con el servidor.'}`);
                            document.getElementById('loading').style.display = 'none';
                            return;
                        }

                        planta = respuestaAnalisis.body;
                        if (!planta || typeof planta !== 'object') {
                            alert("❌ ERROR DE PARSEO BOTÁNICO:\n\nEl servidor no devolvió un análisis válido.");
                            document.getElementById('loading').style.display = 'none';
                            return;
                        }

                       // INTERCEPTOR PASO 1: Si no es planta, abortamos de forma segura sin guardar en Firebase
                        if (planta.esPlanta === false) {
                            alert(`📡 ALERTA DE ANÁLISIS RECHAZADO:\n\n${planta.motivoRechazo || "La muestra recolectada no pertenece al reino vegetal."}`);
                            document.getElementById('loading').style.display = 'none';
                            return;
                        }

                        // --- NUEVO MOTOR DE ECONOMÍA Y ANTI-FARMING ---
                        document.getElementById('loading').innerText = "📡 Cruzando datos con el servidor central...";

                        const mult = MULTIPLICADORES_RAREZA[planta.rareza] || 1;
                        const baseXP = 20; 
                        const calculadoXP = Math.floor(baseXP * mult);

                        // 1. Consultar el historial del explorador activo para esta especie exacta
                        const qEspecie = query(collection(db, "capturas"), 
                            where("perfil", "==", perfilActiveId), 
                            where("nombreCientifico", "==", planta.nombreCientifico)
                        );
                        const snapEspecie = await getDocs(qEspecie);

                        let totalXP = 0;
                        let mensajeToastDesglose = "";
                        let esValidaParaEvolucion = false;
                        const municipioActual = perfilActivoBase?.municipio || "Desconocido";

                        // 2. Árbol de decisiones matemáticas
                        if (snapEspecie.empty) {
                            // ESCENARIO 1: Nunca vista
                            const bonoDescubrimiento = 100;
                            totalXP = calculadoXP + bonoDescubrimiento;
                            esValidaParaEvolucion = true;
                            mensajeToastDesglose = `🌟 ¡NUEVA ESPECIE!\n+${totalXP} XP (Base: ${calculadoXP} | Bono Descubrimiento: +${bonoDescubrimiento})`;
                        } else {
                            // Extraemos los municipios donde ya encontró esta planta
                            let municipiosRegistrados = [];
                            snapEspecie.forEach(d => municipiosRegistrados.push(d.data().municipioId));

                            if (!municipiosRegistrados.includes(municipioActual)) {
                                // ESCENARIO 2: Ya la tenía, pero es de un pueblo nuevo (ej. viaja a Laredo)
                                const bonoTerritorio = 50;
                                totalXP = calculadoXP + bonoTerritorio;
                                esValidaParaEvolucion = true;
                                mensajeToastDesglose = `🗺️ ¡NUEVO BIOMA REGISTRADO!\n+${totalXP} XP (Base: ${calculadoXP} | Bono Territorio: +${bonoTerritorio})`;
                            } else {
                                // ESCENARIO 3: Anti-farmeo (Misma planta, mismo pueblo)
                                totalXP = 2; 
                                esValidaParaEvolucion = false;
                                mensajeToastDesglose = `⚠️ ZONA AGOTADA\n+${totalXP} XP (Muestra redundante en ${municipioActual})`;
                            }
                        }

                        // 3. Guardado final en Firebase inyectando la nueva información
                        await addDoc(collection(db, "capturas"), {
                            nombreComun: planta.nombreComun,
                            nombreCientifico: planta.nombreCientifico,
                            rareza: planta.rareza,
                            descripcion: planta.descripcion,
                            foto: base64DataCompleta,
                            fecha: new Date().toLocaleDateString(),
                            timestamp: Date.now(),
                            xp: totalXP,
                            loc: perfilActivoBase?.municipio || "Exploración",
                            municipioId: municipioActual,
                            comarcaId: perfilActivoBase?.comarca || "Desconocido",
                            provinciaId: perfilActivoBase?.provincia || "Desconocido",
                            paisId: perfilActivoBase?.pais || "España",
                            perfil: perfilActiveId,
                            usuarioEmail: usuarioEmailActual,
                            tipoHoja: planta.tipoHoja || "No especificado",
                            origen: planta.origen || "Autóctona",
                            validaParaEvolucion: esValidaParaEvolucion
                        });

                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('camera-input').value = ''; // Limpiamos input
                        window.desplegarToastVictoryInmediata(mensajeToastDesglose);
                        cargarAlbum(); // Recargamos el álbum

                        // PREPARACIÓN Y DETONACIÓN DEL CROMO 3D
                        const muestraRecienCapturada = {
                            nombreComun: planta.nombreComun,
                            nombreCientifico: planta.nombreCientifico,
                            rareza: planta.rareza,
                            descripcion: planta.descripcion,
                            foto: base64DataCompleta,
                            fecha: new Date().toLocaleDateString(),
                            loc: municipioActual,
                            tipoHoja: planta.tipoHoja || "No especificado",
                            origen: planta.origen || "Autóctona",
                            copiasTotales: snapEspecie.empty ? 1 : snapEspecie.size + 1,
                            nombresAlternativosRecogidos: new Set([planta.nombreComun])
                        };

                        window.abrirVisualizadorDetalleCromo3D(muestraRecienCapturada);
                        
                    } catch (err) {
                        document.getElementById('loading').style.display = 'none';
                        alert(`💥 CRASH EN PROCESAR FOTO (Lógica Interna):\n\nDetalle: ${err.name} - ${err.message}`);
                        console.error(err);
                    }
                };
                img.src = readerEvent.target.result;
            };
            reader.readAsDataURL(file);
        };

        /* ==========================================================================
           16. BUZÓN, MENSAJES Y COMUNICADOS
           ========================================================================== */

        window.verificarAlertasMisionesComarcales = async () => {
            const snap = await getDocs(collection(db, "alertas_comunidad"));
            cacheAlertasGlobales = [];
            let unreadCount = 0;
            const leidosList = JSON.parse(localStorage.getItem(`leidos_${perfilActiveId}`) || "[]");

            snap.forEach(docSnap => {
                const a = docSnap.data(); const idA = docSnap.id;
                let elegible = false;

                if (a.targetType === "global") elegible = true;
                else if (a.targetType === "pais" && perfilActivoBase && a.targetValue === perfilActivoBase.pais) elegible = true;
                else if (a.targetType === "provincial" && perfilActivoBase && a.targetValue === perfilActivoBase.provincia) elegible = true;
                else if (a.targetType === "comarcal" && perfilActivoBase && a.targetValue === perfilActivoBase.comarca) elegible = true;
                else if (a.targetType === "cuenta" && a.targetValue === usuarioEmailActual) elegible = true;
                else if (a.targetType === "explorador" && a.targetValue === perfilActiveId) elegible = true;

                if (elegible) {
                    cacheAlertasGlobales.push({ id: idA, ...a });
                    if (!leidosList.includes(idA)) unreadCount++;
                }
            });

            const banner = document.getElementById('profesor-alert-banner');
            const msgTxt = document.getElementById('profesor-msg-text');
            const badge = document.getElementById('box-badge-num');

            if (cacheAlertasGlobales.length > 0) {
                cacheAlertasGlobales.sort((a,b) => b.timestamp - a.timestamp);
                msgTxt.innerText = cacheAlertasGlobales[0].textMessage;
                banner.style.display = 'block';
            } else { banner.style.display = 'none'; }

            if (unreadCount > 0) { badge.innerText = unreadCount; badge.style.display = 'flex'; }
            else { badge.style.display = 'none'; }
        };

        window.abrirBuzonHistoricoModal = () => {
            const container = document.getElementById('mailbox-list-container');
            limpiarNodo(container);
            const leidosList = JSON.parse(localStorage.getItem(`leidos_${perfilActiveId}`) || "[]");

            if (cacheAlertasGlobales.length === 0) {
                container.appendChild(crearTexto('div', 'mailbox-empty-state', 'No hay transmisiones archivadas en este cuadrante.'));
            }

            cacheAlertasGlobales.forEach(a => {
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
        };

        window.abrirLectorMensajeEspecifico = (idMsg, cuerpo) => {
            document.getElementById('mailbox-modal').style.display = 'none';
            document.getElementById('m-reader-body').innerText = cuerpo;
            
            const btn = document.getElementById('m-reader-btn-action');
            btn.onclick = () => {
                let leidosList = JSON.parse(localStorage.getItem(`leidos_${perfilActiveId}`) || "[]");
                if (!leidosList.includes(idMsg)) { leidosList.push(idMsg); localStorage.setItem(`leidos_${perfilActiveId}`, JSON.stringify(leidosList)); }
                document.getElementById('msg-reader-modal').style.display = 'none';
                window.verificarAlertasMisionesComarcales();
            };
            document.getElementById('msg-reader-modal').style.display = 'flex';
        };

        /* ==========================================================================
           17. NAVEGACIÓN ENTRE VISTAS
           ========================================================================== */

        window.switchPage = createSwitchPage({ onAlbumSelected: cargarAlbum });

        /* ==========================================================================
           18. XP, NIVELES Y ESTADO DEL RADAR
           ========================================================================== */

        async function actualizarEstado() {
            const q = query(collection(db, "capturas"), where("perfil", "==", perfilActiveId));
            const snap = await getDocs(q);
            let totalXP = 0;
            snap.forEach(d => totalXP += (d.data().xp || 0));
            
            let nivel = 1;
            let req = 100;
            let xpRestante = totalXP;
            
            while (xpRestante >= req && req > 0) {
                xpRestante -= req;
                nivel++;
                req = Math.floor(req * 1.2);
            }
            
            const txtNivel = document.getElementById('txt-nivel');
            const txtRango = document.getElementById('txt-rango');
            const barraProgreso = document.getElementById('barra-progreso');
            const txtXpContador = document.getElementById('txt-xp-contador');
            const totalXpMini = document.getElementById('total-xp-mini');
            const totalCountMini = document.getElementById('total-count-mini');

            if (txtNivel) txtNivel.innerText = `NIVEL ${nivel}`;
            if (txtRango) txtRango.innerText = RANGOS_EXPLORACION[Math.min(nivel - 1, 14)] || "Explorador";
            if (barraProgreso) barraProgreso.style.width = `${(xpRestante / req) * 100}%`;
            if (txtXpContador) txtXpContador.innerText = `${xpRestante} / ${req} XP`;
            if (totalXpMini) totalXpMini.innerText = totalXP;
            if (totalCountMini) totalCountMini.innerText = snap.size;
        }

        /* ==========================================================================
           19. ÁLBUM Y CROMOS
           ========================================================================== */

        async function cargarAlbum() {
            const q = query(collection(db, "capturas"), where("perfil", "==", perfilActiveId));
            const snap = await getDocs(q);
            albumEspeciesMemoria = {};
            
            snap.forEach(documento => {
                const d = documento.data();
                if (!albumEspeciesMemoria[d.nombreCientifico]) {
                    albumEspeciesMemoria[d.nombreCientifico] = {
                        nombreComun: d.nombreComun, nombreCientifico: d.nombreCientifico, rareza: d.rareza,
                        descripcion: d.descripcion, foto: d.foto, fecha: d.fecha, loc: d.loc || "Campo",
                        tipoHoja: d.tipoHoja || "No especificado", origen: d.origen || "Autóctona",
                        copiasTotales: 0, nombresAlternativosRecogidos: new Set()
                    };
                }
                albumEspeciesMemoria[d.nombreCientifico].copiasTotales++;
                albumEspeciesMemoria[d.nombreCientifico].nombresAlternativosRecogidos.add(d.nombreComun);
            });
            window.filtrarYOrdenarAlbum();
        }

        window.filtrarYOrdenarAlbum = () => {
            const wrapper = document.getElementById('album-dinamico-contenedor');
            limpiarNodo(wrapper);
            const filtroTexto = document.getElementById('search-botanika').value.toLowerCase().trim();

            Object.values(albumEspeciesMemoria).forEach(esp => {
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
                cardHtml.addEventListener('click', () => { window.abrirVisualizadorDetalleCromo3D(esp); });
                wrapper.appendChild(cardHtml);
            });
        };

        /* ==========================================================================
           20. MODAL DE CROMO 3D
           ========================================================================== */

        window.abrirVisualizadorDetalleCromo3D = (esp) => {
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
        };

        window.voltearCartaModal = (event, el) => {
            // Evita voltear la carta si están interactuando con la ventana de descripción o botones internos
            if(event.target.id === 'm-desc' || event.target.className === 'modal-desc-poke' || event.target.closest('.modal-body-poke') || event.target.closest('.modal-title-poke-clickable') || event.target.closest('#modal-names-dropdown') || event.target.id === 'btn-evolution-action') return;
            el.classList.toggle('flipped');
        };

        window.desplegarNombresAlternativosModal = (event) => {
            event.stopPropagation(); const d = document.getElementById('modal-names-dropdown');
            d.style.display = (d.style.display === 'block') ? 'none' : 'block';
        };

        window.evaluarCierrePorFondo = (event) => {
            if(event.target.id === 'cromo-overlay-modal' || event.target.className === 'close-modal-txt') {
                document.getElementById('cromo-overlay-modal').style.display = 'none';
            }
        };

        window.desplegarToastVictoryInmediata = (msg) => {
            const el = document.getElementById('botanik-toast-victory');
            document.getElementById('botanik-toast-msg-txt').innerText = msg;
            el.classList.add('show-toast');
            setTimeout(() => { el.classList.remove('show-toast'); }, 4000);
        };

        /* ==========================================================================
           21. INICIALIZACIÓN FINAL
           ========================================================================== */

        inicializarEventosEstaticos();

        window.onload = () => {
            document.getElementById('main-app-container').style.display = 'block';
        };
