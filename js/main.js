        /* ==========================================================================
           1. IMPORTS
           ========================================================================== */

        import {
            addDoc,
            collection,
            db,
            doc,
            getDocs,
            query,
            updateDoc,
            where
        } from "./config/firebase.js";
        import {
            MULTIPLICADORES_RAREZA,
            RANGOS_EXPLORACION
        } from "./core/constants.js";
        import { initializeThemeControls } from "./core/theme.js";
        import { createSwitchPage } from "./core/navigation.js";
        import { state } from "./core/state.js";
        import { analyzePlantImage } from "./services/plant-analysis.js";
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

        Object.defineProperty(window, 'modoRegistro', {
            get: () => state.modoRegistro,
            set: (value) => { state.modoRegistro = value; }
        });

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

        /* ==========================================================================
           8. LOGIN Y REGISTRO
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

        /* ==========================================================================
           9. TEMA DENTRO DEL MODAL DE PERFIL
           ========================================================================== */

        initializeThemeControls();

        /* ==========================================================================
           10. PERFILES Y SELECTOR DE EXPLORADORES
           ========================================================================== */

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
            await updateDoc(doc(db, "perfiles", state.perfilActiveId), { base: baseObjeto });
            
            state.perfilActivoBase = baseObjeto;
            document.getElementById('setup-base-page').style.display = 'none';
            alert(`¡Base Secreta Establecida en ${municipio} (${comarca})!`);
            
            actualizarEstado();
            await verificarAlertasMisionesComarcales();
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

                        let edadAventurero = calcularEdadExacta(state.perfilActivoNacimiento);
                        let sectorBaseTxt = state.perfilActivoBase ? `${state.perfilActivoBase.municipio}, en la provincia de ${state.perfilActivoBase.provincia}` : "Desconocido";

                        let planta;
                        const respuestaAnalisis = await analyzePlantImage({
                            imageBase64: base64Data,
                            edadAventurero,
                            sectorBaseTxt,
                            perfilActivoEsExperto: state.perfilActivoEsExperto
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
                            where("perfil", "==", state.perfilActiveId), 
                            where("nombreCientifico", "==", planta.nombreCientifico)
                        );
                        const snapEspecie = await getDocs(qEspecie);

                        let totalXP = 0;
                        let mensajeToastDesglose = "";
                        let esValidaParaEvolucion = false;
                        const municipioActual = state.perfilActivoBase?.municipio || "Desconocido";

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
                            loc: state.perfilActivoBase?.municipio || "Exploración",
                            municipioId: municipioActual,
                            comarcaId: state.perfilActivoBase?.comarca || "Desconocido",
                            provinciaId: state.perfilActivoBase?.provincia || "Desconocido",
                            paisId: state.perfilActivoBase?.pais || "España",
                            perfil: state.perfilActiveId,
                            usuarioEmail: state.usuarioEmailActual,
                            tipoHoja: planta.tipoHoja || "No especificado",
                            origen: planta.origen || "Autóctona",
                            validaParaEvolucion: esValidaParaEvolucion
                        });

                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('camera-input').value = ''; // Limpiamos input
                        desplegarToastVictoryInmediata(mensajeToastDesglose);
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
           17. NAVEGACIÓN ENTRE VISTAS
           ========================================================================== */

        window.switchPage = createSwitchPage({ onAlbumSelected: cargarAlbum });

        /* ==========================================================================
           18. XP, NIVELES Y ESTADO DEL RADAR
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
           21. INICIALIZACIÓN FINAL
           ========================================================================== */

        inicializarEventosEstaticos();

        window.onload = () => {
            document.getElementById('main-app-container').style.display = 'block';
        };
