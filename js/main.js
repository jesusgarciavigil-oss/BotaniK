        /* ==========================================================================
           1. IMPORTS
           ========================================================================== */

        import {
            collection,
            db,
            getDocs,
            query,
            where
        } from "./config/firebase.js";
        import { RANGOS_EXPLORACION } from "./core/constants.js";
        import { initializeThemeControls } from "./core/theme.js";
        import { createSwitchPage } from "./core/navigation.js";
        import { state } from "./core/state.js";
        import { initializeFamilyAuth } from "./features/auth.js";
        import {
            initializeProfiles,
            mostrarSelectorPerfiles,
            recalcularCacheYDesplegable
        } from "./features/profiles.js";
        import {
            cargarAlbum,
            initializeAlbum
        } from "./features/album.js";
        import {
            abrirVisualizadorDetalleCromo3D,
            initializeCardModal
        } from "./features/card-modal.js";
        import {
            activarEscuchaBiomasaEnVivo,
            desplegarToastVictoryInmediata,
            initializeRewards,
            verificarAlertasMisionesComarcales
        } from "./features/rewards.js";
        import { initializeMailbox } from "./features/mailbox.js";
        import { initializeBase } from "./features/base.js";
        import { initializeRadar } from "./features/radar.js";
        import { initializeCaptures } from "./features/captures.js";
        
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
           3. LISTENERS ESTÁTICOS DE INTERFAZ
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
           4. PUENTES DE COMPATIBILIDAD GLOBAL
           ========================================================================== */

        Object.defineProperty(window, 'modoRegistro', {
            get: () => state.modoRegistro,
            set: (value) => { state.modoRegistro = value; }
        });

        /* ==========================================================================
           5. UTILIDADES COMPARTIDAS
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

        function comprobarImagenProporcional(imgElement, maxAnchoAlto, calidad) {
            const canvas = document.createElement('canvas');
            let ancho = imgElement.width; let alto = imgElement.height;
            if (ancho > alto) { if (ancho > maxAnchoAlto) { alto *= maxAnchoAlto / ancho; ancho = maxAnchoAlto; } }
            else { if (alto > maxAnchoAlto) { ancho *= maxAnchoAlto / alto; alto = maxAnchoAlto; } }
            canvas.width = ancho; canvas.height = alto;
            canvas.getContext('2d').drawImage(imgElement, 0, 0, ancho, alto);
            return canvas.toDataURL('image/jpeg', calidad);
        }

        /* ==========================================================================
           6. INICIALIZACIÓN DE MÓDULOS
           ========================================================================== */

        initializeProfiles({
            calculateAge: calcularEdadExacta,
            compressProfileImage: (img) => comprobarImagenProporcional(img, 120, 0.7),
            onProfileSelected: async () => {
                activarEscuchaBiomasaEnVivo();
                await verificarAlertasMisionesComarcales();
            },
            onProfileNeedsBase: () => {
                document.getElementById('setup-base-page').style.display = 'flex';
            },
            onProfileReady: actualizarEstado,
            onAlbumRefresh: cargarAlbum,
            isAlbumActive: () => document.getElementById('album').classList.contains('active')
        });
        initializeCardModal();
        initializeAlbum({ openCardModal: abrirVisualizadorDetalleCromo3D });
        initializeRewards({ onStateRefresh: actualizarEstado });
        initializeMailbox({ onMessageRead: verificarAlertasMisionesComarcales });
        initializeFamilyAuth({ onAccessGranted: mostrarSelectorPerfiles });
        initializeBase({
            onStateRefresh: actualizarEstado,
            onAlertsRefresh: verificarAlertasMisionesComarcales,
            onProfilesRefresh: recalcularCacheYDesplegable
        });
        initializeRadar();
        initializeCaptures({
            calculateAge: calcularEdadExacta,
            compressImage: (img) => comprobarImagenProporcional(img, 700, 0.7),
            showVictoryToast: desplegarToastVictoryInmediata,
            onAlbumRefresh: cargarAlbum,
            openCardModal: abrirVisualizadorDetalleCromo3D
        });

        initializeThemeControls();

        window.switchPage = createSwitchPage({ onAlbumSelected: cargarAlbum });

        /* ==========================================================================
           7. ESTADO VISUAL GENERAL
           ========================================================================== */

        async function actualizarEstado() {
            const q = query(collection(db, "capturas"), where("perfil", "==", state.perfilActiveId));
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
           8. ARRANQUE DE LA APP
           ========================================================================== */

        inicializarEventosEstaticos();

        window.onload = () => {
            document.getElementById('main-app-container').style.display = 'block';
        };
