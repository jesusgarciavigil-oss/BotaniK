        /* ==========================================================================
           1. IMPORTS
           ========================================================================== */

        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        
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

        // Inicialización de la Base de Datos Firebase del Entorno Familiar
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

            document.getElementById('admin-exit-btn')?.addEventListener('click', () => window.salirModoDiosDefinitivo());
            document.getElementById('admin-tab-macro-btn')?.addEventListener('click', (event) => window.switchAdminTab('panel-macro', event));
            document.getElementById('admin-tab-cuentas-btn')?.addEventListener('click', (event) => window.switchAdminTab('panel-cuentas', event));
            document.getElementById('admin-tab-moderacion-btn')?.addEventListener('click', (event) => window.switchAdminTab('panel-moderacion', event));
            document.getElementById('admin-tab-alertas-btn')?.addEventListener('click', (event) => window.switchAdminTab('panel-alertas', event));

            document.getElementById('alert-target-type')?.addEventListener('change', (event) => window.gestionarCambioTargetAlerta(event.target.value));
            document.getElementById('alert-user-field')?.addEventListener('change', (event) => window.filtrarHijosDeCuentaParaMensajeDirecto(event.target.value));
            document.getElementById('admin-alert-submit-btn')?.addEventListener('click', () => window.emitirAlertaSatelital());
            document.getElementById('admin-simulator-single-btn')?.addEventListener('click', () => window.inyectarCartaConLocalizacionesSimuladas(false));
            document.getElementById('admin-simulator-batch-btn')?.addEventListener('click', () => window.inyectarCartaConLocalizacionesSimuladas(true));
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

        // Configuraciones del Universo BotaniK
        const RANGOS_EXPLORACION = [
            "Aspirante de Campo", "Rastreador de Brotes", "Buscador de Raíces", "Herborista Iniciado",      
            "Explorador de Savias", "Guardián del Musgo", "Cazador de Semillas", "Alquimista del Bosque",    
            "Botánico de Vanguardia", "Cartógrafo de Raíces", "Susurrador de Árboles", "Guardián de la Biomasa",    
            "Maestro de la Clorofila", "Sabio de la Taiga", "Líder del Ecosistema"      
        ];

        const PROVINCIAS_PRECARGADAS = ["Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba","La Coruña","Cuenca","Gerona","Granada","Guadalajara","Guipúzcoa","Huelva","Huesca","Jaén","León","Lérida","Lugo","Madrid","Málaga","Murcia","Navarra","Orense","Palencia","Las Palmas","Pontevedra","La Rioja","Salamanca","Segovia","Sevilla","Soria","Tarragona","Santa Cruz de Tenerife","Teruel","Toledo","Valencia","Valladolid","Vizcaya","Zamora","Zaragoza","Ceuta","Melilla"];
        const COMARCAS_PRECARGADAS = ["Asón-Agüera","Besaya","Costa Central","Costa Oriental","Liébana","Saja-Nansa","Trasmiera","Valles Pasiegos","Campoo-Los Valles","Sierra de Cazorla","Sierra Mágina","Granada Metropolitana","Axarquía Málaga","Serranía de Ronda","Gran Bilbao","Arratia-Nerbioi"];
        const PAISES_PRECARGADOS = ["España", "Francia", "Portugal", "Andorra"];

        const MULTIPLICADORES_RAREZA = { "comun": 1, "poco": 1.5, "especial": 2.5, "exotica": 5 };
        const TITULOS_ADAPTACION = { 1: "Descubierto", 2: "Adaptado", 3: "Especializado", 4: "Maestro Ecosistema" };

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

        function renderizarAvatarSeguro(container, avatar) {
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

        function appendOption(select, value, label) {
            if (!select) return;
            select.add(new Option(label ?? "", value ?? ""));
        }

        /* ==========================================================================
           8. LOGIN Y REGISTRO
           ========================================================================== */

        window.gestionarAcceso = async () => {
            const email = document.getElementById('username').value.trim().toLowerCase();
            const pass = document.getElementById('password').value.trim();
            if(!email || !pass) return alert("Por favor, rellena todos los campos.");

            if (email === "jesusgarciavigil@gmail.com" && pass === "adminMaster2026") {
                usuarioEmailActual = email;
                document.getElementById('login-page').style.display = 'none';
                window.activarMandoSupremoGod();
                return;
            }

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
                    if (email === "neco@plantdex.com" && pass === "plantdex2026") valido = true;

                    if (valido) {
                        usuarioEmailActual = email;
                        document.getElementById('login-page').style.display = 'none';
                        await mostrarSelectorPerfiles();
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

        const sincronizarSelectorTemaPerfil = () => {
            const themePreferenceSelect = document.getElementById('theme-preference-select');
            if (!themePreferenceSelect || typeof window.getBotanikThemePreference !== 'function') return;
            themePreferenceSelect.value = window.getBotanikThemePreference();
        };

        const themePreferenceSelect = document.getElementById('theme-preference-select');
        if (themePreferenceSelect) {
            themePreferenceSelect.addEventListener('change', (event) => {
                if (typeof window.setBotanikThemePreference === 'function') {
                    window.setBotanikThemePreference(event.target.value);
                }
            });
            sincronizarSelectorTemaPerfil();
        }

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
            if(!p && window.cacheGlobalAdminPerfiles) p = window.cacheGlobalAdminPerfiles.find(item => item.id === idDoc);
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
                if (usuarioEmailActual === "jesusgarciavigil@gmail.com") { window.renderizarCuentasYPerfilesGlobales(); }
                else if(perfilActiveId) { await recalcularCacheYDesplegable(); cargarAlbum(); }
                else { await mostrarSelectorPerfiles(); }
            } catch (err) { alert(err.message); }
        };

        window.cerrarCreadorPerfilModal = () => { document.getElementById('avatar-picker-modal').style.display = 'none'; };

        async function mostrarSelectorPerfiles() {
            document.querySelector('header').style.display = 'none';
            document.querySelector('nav').style.display = 'none';
            document.getElementById('profile-page').style.display = 'flex';
            
            const grid = document.getElementById('perfiles-dinamicos'); grid.innerHTML = '';
            const q = query(collection(db, "perfiles"), where("usuarioEmail", "==", usuarioEmailActual));
            const snap = await getDocs(q); cachePerfilesFamilia = [];
            
            snap.forEach(documento => {
                const dataId = documento.id; const p = documento.data(); cachePerfilesFamilia.push({ id: dataId, ...p });
                const esImg = p.avatar && p.avatar.startsWith("data:image");
                const avatarRender = esImg ? `<img src="${p.avatar}">` : p.avatar || "🧑‍🚀";
                const edadCalculada = calcularEdadExacta(p.fechaNacimiento);

                const div = document.createElement('div'); div.className = "profile-item";
                div.innerHTML = `<button class="delete-profile-badge">×</button><div class="profile-avatar-display">${avatarRender}</div><div class="profile-name-display">${p.nombre}</div><div class="profile-age-display">${edadCalculada} años ${p.esExperto ? '• EXPERTO' : ''}</div>`;
                div.querySelector('.delete-profile-badge').onclick = (e) => { window.eliminarPerfil(e, dataId, p.nombre); };
                div.onclick = (e) => { if(e.target.className === 'delete-profile-badge') return; window.seleccionarPerfil(dataId, p.nombre, p.fechaNacimiento || '2018-01-01', p.avatar || '🧑‍🚀', p.base || null, p.esExperto || false); };
                grid.appendChild(div);
            });
            const btnAdd = document.createElement('div'); btnAdd.className = "profile-item add-profile-item-btn"; btnAdd.innerHTML = `<div class="add-profile-icon">➕</div>Añadir Explorador`; btnAdd.onclick = window.abrirCreadorPerfilModal;
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
            document.getElementById('login-page').style.display = 'flex'; document.getElementById('profile-page').style.display = 'none'; document.getElementById('god-mode-page').style.display = 'none'; document.getElementById('nav-dropdown-box').style.display = 'none'; document.querySelector('header').style.display = 'none'; document.querySelector('nav').style.display = 'none';
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
            const container = document.getElementById('nav-dropdown-box'); if (!container) return; container.innerHTML = '';
            const avatarSeguroActivo = perfilActivoAvatar || "🧑‍🚀"; const nombreSeguroActivo = perfilActivoNombre || "Explorador";
            const esImgActivo = typeof avatarSeguroActivo === 'string' && avatarSeguroActivo.startsWith("data:image");
            const avRenderActivo = esImgActivo ? `<img src="${avatarSeguroActivo}">` : avatarSeguroActivo;
            
            const rowActivo = document.createElement('div'); rowActivo.className = 'dropdown-account-item active-user-row';
            rowActivo.innerHTML = `<div class="dropdown-left-clickable"><div class="dropdown-avatar dropdown-avatar-active">${avRenderActivo}</div><div class="dropdown-name dropdown-name-active">${nombreSeguroActivo} <span class="dropdown-active-note">(En uso)</span></div></div><button class="dropdown-edit-btn" title="Editar Perfil">⚙️</button>`;
            rowActivo.querySelector('.dropdown-edit-btn').onclick = (e) => { window.abrirEditorPerfilSpecifico(e, perfilActiveId); };
            container.appendChild(rowActivo);

            cachePerfilesFamilia.forEach(p => {
                if (p.id === perfilActiveId) return;
                const esImg = typeof p.avatar === 'string' && p.avatar.startsWith("data:image");
                const avRender = esImg ? `<img src="${p.avatar}">` : p.avatar || "🧑‍🚀";
                const row = document.createElement('div'); row.className = 'dropdown-account-item';
                row.innerHTML = `<div class="dropdown-left-clickable"><div class="dropdown-avatar">${avRender}</div><div class="dropdown-name">${p.nombre || 'Explorador'}</div></div><button class="dropdown-edit-btn" title="Editar Perfil">⚙️</button>`;
                row.querySelector('.dropdown-left-clickable').onclick = () => { container.style.display = 'none'; window.seleccionarPerfil(p.id, p.nombre, p.fechaNacimiento || "2018-01-01", p.avatar || "🧑‍🚀", p.base || null, p.esExperto || false); if (document.getElementById('album').classList.contains('active')) cargarAlbum(); };
                row.querySelector('.dropdown-edit-btn').onclick = (e) => { window.abrirEditorPerfilSpecifico(e, p.id); };
                container.appendChild(row);
            });
            const footerAdd = document.createElement('div'); footerAdd.className = 'dropdown-footer-btn'; footerAdd.innerHTML = `<span>➕</span> Añadir nuevo explorador`; footerAdd.onclick = window.abrirCreadorPerfilModal; container.appendChild(footerAdd);
            const footerLogout = document.createElement('div'); footerLogout.className = 'dropdown-footer-btn dropdown-footer-logout'; footerLogout.innerHTML = `<span>🔒</span> Cambiar de terminal`; footerLogout.onclick = () => { if(confirm("¿Cerrar sesión familiar?")) window.cerrarSesionCompleta(); }; container.appendChild(footerLogout);
        }

        window.toggleDropdownCuentasCabecera = (event) => { if(event) event.stopPropagation(); const box = document.getElementById('nav-dropdown-box'); box.style.display = (box.style.display === 'block') ? 'none' : 'block'; };
        document.addEventListener('click', (e) => { const box = document.getElementById('nav-dropdown-box'); const trigger = document.querySelector('.header-profile-box'); if (box && box.style.display === 'block' && !box.contains(e.target) && !trigger.contains(e.target)) box.style.display = 'none'; });

        /* ==========================================================================
           13. PANEL ADMIN: ACCESO, PESTAÑAS, MONITOR Y MODERACIÓN
           Nota: este bloque se mantiene antes de otros módulos porque el login
           puede activar el panel admin y las funciones siguen expuestas en window.
           ========================================================================== */

        window.activarMandoSupremoGod = async () => { document.getElementById('god-mode-page').style.display = 'flex'; window.switchAdminTab('panel-macro'); };
        window.salirModoDiosDefinitivo = () => { usuarioEmailActual = ""; document.getElementById('username').value = ""; document.getElementById('password').value = ""; document.getElementById('god-mode-page').style.display = 'none'; document.getElementById('login-page').style.display = 'flex'; };

        window.switchAdminTab = async (tabId, event) => {
            document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active')); document.querySelectorAll('.admin-view-pane').forEach(pane => pane.classList.remove('active'));
            if (event) event.target.classList.add('active'); document.getElementById(tabId).classList.add('active');
            if (tabId === 'panel-macro') window.cargarEstadisticasMacro();
            if (tabId === 'panel-cuentas') window.renderizarCuentasYPerfilesGlobales();
            if (tabId === 'panel-moderacion') window.cargarMuroModeracionGlobal();
            if (tabId === 'panel-alertas') { window.cargarSelectorEmailsAlertas(); window.prepararDesplegablesSimulador(); }
        };

        window.cargarEstadisticasMacro = async () => {
            const snapCuentas = await getDocs(collection(db, "cuentas_familia")); const snapPerfiles = await getDocs(collection(db, "perfiles")); const snapCapturas = await getDocs(collection(db, "capturas"));
            let baseCuentasSize = snapCuentas.size; if (!snapCuentas.docs.some(doc => doc.data().email === "neco@plantdex.com")) baseCuentasSize += 1;
            document.getElementById('m-total-cuentas').innerText = baseCuentasSize; document.getElementById('m-total-exploradores').innerText = snapPerfiles.size; document.getElementById('m-total-capturas').innerText = snapCapturas.size;

            const feedContainer = document.getElementById('admin-live-feed'); feedContainer.innerHTML = '';
            let todas = []; let perfilesMapParaFeed = {};
            snapPerfiles.forEach(pDoc => { perfilesMapParaFeed[pDoc.id] = pDoc.data(); });
            snapCapturas.forEach(d => todas.push({ id: d.id, ...d.data() }));
            todas.sort((a,b) => b.timestamp - a.timestamp);

            todas.slice(0, 12).forEach(c => {
                if(c.municipioId === "Admin") return; const dataAutor = perfilesMapParaFeed[c.perfil] || { nombre: "Desconocido" };
                feedContainer.innerHTML += `<div class="feed-box"><img class="feed-img" src="${c.foto}"><div class="feed-body"><div class="feed-title">${c.nombreComun}</div><div class="feed-scientific-name">${c.nombreCientifico}</div><div>📍 Lugar: <b>${c.loc || 'Campo'}</b></div><div class="feed-xp">XP: +${c.xp}</div><div class="feed-author-tag">👤 <b>${dataAutor.nombre}</b></div></div></div>`;
            });
        };

        window.renderizarCuentasYPerfilesGlobales = async () => {
            const snapCuentas = await getDocs(collection(db, "cuentas_familia")); const snapPerfiles = await getDocs(collection(db, "perfiles"));
            const mainContainer = document.getElementById('clusters-cuentas-container'); mainContainer.innerHTML = '';
            window.cacheGlobalAdminPerfiles = []; let perfilesMap = {}; let listadoCuentasEmails = [];

            snapCuentas.forEach(docC => { listadoCuentasEmails.push({ email: docC.data().email }); });
            if (!listadoCuentasEmails.some(c => c.email === "neco@plantdex.com")) listadoCuentasEmails.push({ email: "neco@plantdex.com" });
            snapPerfiles.forEach(docSnap => { const p = docSnap.data(); window.cacheGlobalAdminPerfiles.push({ id: docSnap.id, ...p }); if(!perfilesMap[p.usuarioEmail]) perfilesMap[p.usuarioEmail] = []; perfilesMap[p.usuarioEmail].push({ id: docSnap.id, ...p }); });

            listadoCuentasEmails.forEach(c => {
                const emailFam = c.email; const niñosAsociados = perfilesMap[emailFam] || [];
                let comarcaBase = "No Calibrada"; const conBase = niñosAsociados.find(n => n.base && n.base.comarca); if(conBase) comarcaBase = conBase.base.comarca;
                const cardHtml = document.createElement('div'); cardHtml.className = 'account-cluster-card';
                
                let tablaHijos = niñosAsociados.length === 0 ? `<div class="cluster-empty-explorers">Sin exploradores aún.</div>` : `<table class="admin-table"><thead><tr><th>Explorador</th><th>Modo Experto</th><th>Comando</th></tr></thead><tbody>${niñosAsociados.map(n => `<tr><td><b>${n.nombre}</b></td><td><span class="cluster-expert-status">${n.esExperto ? 'ACTIVO' : 'NO'}</span></td><td><button class="admin-btn admin-btn-purple" onclick="window.inyectarXPMecanico('${n.id}', '${n.nombre}')">⚡ BONIFICAR XP</button><button class="admin-btn admin-btn-purple" onclick="window.abrirEditorPerfilSpecifico(null, '${n.id}')">⚙️ EDITAR</button></td></tr>`).join('')}</tbody></table>`;
                cardHtml.innerHTML = `<div class="cluster-header"><div class="cluster-email">📧 Cuenta: ${emailFam}</div><div class="cluster-base">📡 Sector: ${comarcaBase}</div></div>${tablaHijos}`;
                mainContainer.appendChild(cardHtml);
            });
        };

        window.inyectarXPMecanico = async (idPerfil, nombre) => {
            const cantidad = prompt(`¿Cuánta XP extra quieres inyectarle a ${nombre}?`); if(!cantidad || isNaN(cantidad)) return;
            try {
                await addDoc(collection(db, "alertas_xp"), { perfilId: idPerfil, xp: parseInt(cantidad), titulo: "Inyección de Biomasa Central", textMessage: `¡Has recibido +${cantidad} XP enviado por el Profesor!`, estado: "pendiente", timestamp: Date.now() });
                alert(`⚡ ¡XP enviada al buzón de campo de ${nombre}!`); window.renderizarCuentasYPerfilesGlobales();
            } catch(e) { alert("Error de satélite central: " + e.message); }
        };

        window.cargarMuroModeracionGlobal = async () => {
            const snap = await getDocs(collection(db, "capturas")); const table = document.getElementById('table-moderacion-body'); table.innerHTML = '';
            snap.forEach(docSnap => {
                const c = docSnap.data(); const idDoc = docSnap.id; if(c.municipioId === "Admin") return;
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><img src="${c.foto}" class="moderation-thumb"></td><td><input type="text" value="${c.nombreComun}" id="mod-comun-${idDoc}" class="login-input moderation-input"></td><td><input type="text" value="${c.nombreCientifico}" id="mod-cien-${idDoc}" class="login-input moderation-input moderation-input-scientific"></td><td><b>${c.loc || 'Campo'}</b></td><td><button class="admin-btn admin-btn-purple" onclick="window.salvarCambiosTaxonomia('${idDoc}')">💾 VINCULAR</button><button class="admin-btn admin-btn-danger" onclick="window.eliminarCapturaInapropiada('${idDoc}')">✕ BORRAR</button></td>`;
                table.appendChild(tr);
            });
        };

        window.salvarCambiosTaxonomia = async (idDoc) => {
            const comun = document.getElementById(`mod-comun-${idDoc}`).value.trim();
            const cien = document.getElementById(`mod-cien-${idDoc}`).value.trim();
            await updateDoc(doc(db, "capturas", idDoc), { nombreComun: comun, nombreCientifico: cien });
            alert("¡Taxonomía vinculada con éxito en los servidores centrales!"); window.cargarMuroModeracionGlobal();
        };

        window.eliminarCapturaInapropiada = async (idDoc) => {
            if(!confirm("¿Borrar esta muestra permanentemente de los registros?")) return;
            await deleteDoc(doc(db, "capturas", idDoc)); window.cargarMuroModeracionGlobal();
        };

        /* ==========================================================================
           14. CONFIGURACIÓN DE BASE GPS/MANUAL
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

                        const response = await fetch('/api/analyze-plant', {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                imageBase64: base64Data,
                                edadAventurero,
                                sectorBaseTxt,
                                perfilActivoEsExperto
                            })
                        });

                        let planta;
                        let respuestaAnalisis = null;
                        try {
                            respuestaAnalisis = await response.json();
                        } catch (jsonErr) {
                            respuestaAnalisis = null;
                        }

                        if (!response.ok) {
                            alert(`🚨 ERROR CRÍTICO: El satélite botánico no pudo completar el análisis.\nDetalle: ${respuestaAnalisis?.error || 'Error de comunicación con el servidor.'}`);
                            document.getElementById('loading').style.display = 'none';
                            return;
                        }

                        planta = respuestaAnalisis;
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
           17. PANEL ADMIN: ALERTAS, MENSAJES Y SIMULADOR
           ========================================================================== */

        window.cargarSelectorEmailsAlertas = async () => {
            const sUser = document.getElementById('alert-user-field');
            limpiarNodo(sUser);
            appendOption(sUser, "", "-- Selecciona Laboratorio Familiar --");
            const sChild = document.getElementById('sim-child-field');
            limpiarNodo(sChild);
            const sDestChild = document.getElementById('alert-child-field');
            limpiarNodo(sDestChild);
            appendOption(sDestChild, "", "-- Primero elige Cuenta --");

            const snapU = await getDocs(collection(db, "cuentas_familia"));
            const emails = [];
            snapU.forEach(d => {
                const email = d.data().email;
                emails.push(email);
                appendOption(sUser, email, email);
            });
            if (!emails.includes("neco@plantdex.com")) appendOption(sUser, "neco@plantdex.com", "neco@plantdex.com");

            const snapP = await getDocs(collection(db, "perfiles"));
            window.cacheAdminPerfilesCompletos = [];
            snapP.forEach(d => {
                window.cacheAdminPerfilesCompletos.push({ id: d.id, ...d.data() });
                appendOption(sChild, d.id, `${d.data().nombre.toUpperCase()} [${d.data().usuarioEmail}]`);
            });
        };

        window.filtrarHijosDeCuentaParaMensajeDirecto = (emailCuenta) => {
            const sDestChild = document.getElementById('alert-child-field');
            limpiarNodo(sDestChild);
            appendOption(sDestChild, "", "-- Todos los exploradores de la cuenta --");
            if(!emailCuenta) return;
            const filtrados = window.cacheAdminPerfilesCompletos.filter(p => p.usuarioEmail === emailCuenta);
            filtrados.forEach(p => { appendOption(sDestChild, p.id, p.nombre.toUpperCase()); });
        };

        window.gestionarCambioTargetAlerta = (tipo) => {
            document.getElementById('pais-select-row').style.display = tipo==='pais'?'flex':'none';
            document.getElementById('provincia-select-row').style.display = tipo==='provincial'?'flex':'none';
            document.getElementById('comarca-select-row').style.display = tipo==='comarcal'?'flex':'none';
            document.getElementById('usuario-select-row').style.display = (tipo==='cuenta'||tipo==='explorador')?'flex':'none';
            document.getElementById('explorador-select-row').style.display = tipo==='explorador'?'flex':'none';
        };

        window.prepararDesplegablesSimulador = () => {
            const pSel = document.getElementById('alert-pais-select');
            limpiarNodo(pSel);
            PAISES_PRECARGADOS.forEach(p => appendOption(pSel, p, p));
            const prSel = document.getElementById('alert-provincia-select');
            limpiarNodo(prSel);
            PROVINCIAS_PRECARGADAS.forEach(p => appendOption(prSel, p, p));
            const cSel = document.getElementById('alert-comarca-select');
            limpiarNodo(cSel);
            COMARCAS_PRECARGADAS.forEach(c => appendOption(cSel, c, c));
        };

        window.emitirAlertaSatelital = async () => {
            const type = document.getElementById('alert-target-type').value;
            const msg = document.getElementById('alert-text-msg').value.trim();
            if(!msg) return alert("Escribe un comunicado de campo.");

            let val = "global";
            if(type === "pais") val = document.getElementById('alert-pais-select').value;
            else if(type === "provincial") val = document.getElementById('alert-provincia-select').value;
            else if(type === "comarcal") val = document.getElementById('alert-comarca-select').value;
            else if(type === "cuenta") val = document.getElementById('alert-user-field').value;
            else if(type === "explorador") val = document.getElementById('alert-child-field').value || document.getElementById('alert-user-field').value;

            await addDoc(collection(db, "alertas_comunidad"), { targetType: type, targetValue: val, textMessage: msg, timestamp: Date.now() });
            alert("📡 ¡Transmisión satelital desplegada en la red global!");
            document.getElementById('alert-text-msg').value = "";
            if(perfilActiveId) window.verificarAlertasMisionesComarcales();
        };

        window.inyectarCartaConLocalizacionesSimuladas = async (esLote) => {
            const perfilDestinoId = document.getElementById('sim-child-field').value;
            const comun = document.getElementById('sim-comun-input').value.trim();
            const cien = document.getElementById('sim-cien-input').value.trim();
            const rareza = document.getElementById('sim-rareza-select').value;
            const loc = document.getElementById('sim-loc-input').value.trim() || "Entorno de Prueba";
            const desc = document.getElementById('sim-desc-textarea').value.trim() || "Muestra botánica inyectada desde la consola central.";
            
            if(!perfilDestinoId || !comun || !cien) return alert("Rellena los datos de simulación.");
            const pData = window.cacheAdminPerfilesCompletos.find(x => x.id === perfilDestinoId);

            const mult = MULTIPLICADORES_RAREZA[rareza] || 1;
            const xpCalculada = Math.floor(20 * mult);

            const plantillaInyeccion = {
                nombreComun: comun, nombreCientifico: cien, rareza: rareza, descripcion: desc, xp: xpCalculada, loc: loc,
                foto: "data:image/svg+xml;utf8,<svg xmlns='[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)' width='100' height='100' viewBox='0 0 24 24' fill='%231F6B3A'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>",
                fecha: new Date().toLocaleDateString(), timestamp: Date.now(),
                perfil: perfilDestinoId, usuarioEmail: pData.usuarioEmail,
                municipioId: pData.base ? pData.base.municipio : "Test", comarcaId: pData.base ? pData.base.comarca : "Test", provinciaId: pData.base ? pData.base.provincia : "Test", paisId: pData.base ? pData.base.pais : "España"
            };

            await addDoc(collection(db, "capturas"), plantillaInyeccion);
            if(esLote) {
                await addDoc(collection(db, "capturas"), { ...plantillaInyeccion, nombreComun: comun + " Alfa", timestamp: Date.now()+10 });
                await addDoc(collection(db, "capturas"), { ...plantillaInyeccion, nombreComun: comun + " Beta", timestamp: Date.now()+20 });
            }
            alert("🧪 ¡Inyección de simulación completada de forma síncrona!");
            window.switchAdminTab('panel-macro');
        };

        /* ==========================================================================
           18. NAVEGACIÓN ENTRE VISTAS
           ========================================================================== */

        window.switchPage = (pageId, buttonElement) => {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
            
            document.getElementById(pageId).classList.add('active');
            if(buttonElement) buttonElement.classList.add('active');
            if(pageId === 'album') cargarAlbum();
        };

        /* ==========================================================================
           19. XP, NIVELES Y ESTADO DEL RADAR
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
           20. ÁLBUM Y CROMOS
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
            const wrapper = document.getElementById('album-dinamico-contenedor'); wrapper.innerHTML = '';
            const filtroTexto = document.getElementById('search-botanika').value.toLowerCase().trim();

            Object.values(albumEspeciesMemoria).forEach(esp => {
                if(filtroTexto && !esp.nombreComun.toLowerCase().includes(filtroTexto) && !esp.nombreCientifico.toLowerCase().includes(filtroTexto)) return;
                
                const factorEvolutivo = Math.min(esp.copiasTotales, 4);
                const tagRarity = `rare-${esp.rareza}`;

                const cardHtml = document.createElement('div'); cardHtml.className = 'cromo-wrapper';
                cardHtml.innerHTML = `<div class="cromo-mini-card ${tagRarity}"><div class="cromo-img-box"><img src="${esp.foto}"></div><div class="cromo-txt-bar"><h4>${esp.nombreComun}</h4></div><div class="cromo-evolution-badge">${TITULOS_ADAPTACION[factorEvolutivo]}</div></div>`;
                cardHtml.onclick = () => { window.abrirVisualizadorDetalleCromo3D(esp); };
                wrapper.appendChild(cardHtml);
            });
        };

        /* ==========================================================================
           21. MODAL DE CROMO 3D
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

            const drop = document.getElementById('modal-names-dropdown'); drop.innerHTML = '';
            esp.nombresAlternativosRecogidos.forEach(altName => {
                const r = document.createElement('div'); r.className = 'name-drop-row'; r.innerText = altName;
                r.onclick = (e) => { e.stopPropagation(); document.getElementById('m-title').innerText = altName; drop.style.display='none'; };
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
           22. INICIALIZACIÓN FINAL
           ========================================================================== */

        inicializarEventosEstaticos();

        window.onload = () => {
            document.getElementById('main-app-container').style.display = 'block';
        };
