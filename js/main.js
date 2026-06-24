        /* ==========================================================================
           1. IMPORTS
           ========================================================================== */

        import {
            addDoc,
            collection,
            db,
            doc,
            getDocs,
            onSnapshot,
            query,
            updateDoc,
            where
        } from "./config/firebase.js";
        import {
            MULTIPLICADORES_RAREZA,
            RANGOS_EXPLORACION,
            TITULOS_ADAPTACION
        } from "./core/constants.js";
        import {
            crearTexto,
            limpiarNodo,
            obtenerClaseRarezaSegura,
        } from "./core/dom.js";
        import { initializeThemeControls } from "./core/theme.js";
        import { createSwitchPage } from "./core/navigation.js";
        import {
            limpiarEscuchaXpLive,
            setUnsubscribeXpLive,
            state
        } from "./core/state.js";
        import { analyzePlantImage } from "./services/plant-analysis.js";
        import { initializeFamilyAuth } from "./features/auth.js";
        import {
            initializeProfiles,
            mostrarSelectorPerfiles,
            recalcularCacheYDesplegable
        } from "./features/profiles.js";
        
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
                window.activarEscuchaBiomasaEnVivo();
                await window.verificarAlertasMisionesComarcales();
            },
            onProfileNeedsBase: () => {
                document.getElementById('setup-base-page').style.display = 'flex';
            },
            onProfileReady: actualizarEstado,
            onAlbumRefresh: cargarAlbum,
            isAlbumActive: () => document.getElementById('album').classList.contains('active')
        });
        initializeFamilyAuth({ onAccessGranted: mostrarSelectorPerfiles });

        /* ==========================================================================
           9. TEMA DENTRO DEL MODAL DE PERFIL
           ========================================================================== */

        initializeThemeControls();

        /* ==========================================================================
           10. PERFILES Y SELECTOR DE EXPLORADORES
           ========================================================================== */

        /* ==========================================================================
           11. XP EN TIEMPO REAL Y RECOMPENSAS ENTREGADAS
           ========================================================================== */

        window.activarEscuchaBiomasaEnVivo = () => {
            limpiarEscuchaXpLive();
            const q = query(collection(db, "alertas_xp"), where("perfilId", "==", state.perfilActiveId), where("estado", "==", "pendiente"));
            setUnsubscribeXpLive(onSnapshot(q, (snapshot) => {
                snapshot.docs.forEach(async (docSnap) => {
                    const alerta = docSnap.data(); const idAlerta = docSnap.id;
                    await updateDoc(doc(db, "alertas_xp", idAlerta), { estado: "entregado" });
                    await addDoc(collection(db, "capturas"), { nombreComun: alerta.titulo || "Cargamento de Biomasa", nombreCientifico: "Bonus Laboratorio Central", rareza: "especial", descripcion: alerta.mensaje || alerta.textMessage, foto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='%2339FF14'><path d='M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z'/></svg>", fecha: new Date().toLocaleDateString(), timestamp: Date.now(), xp: parseInt(alerta.xp), loc: "Laboratorio Central", municipioId: "Admin", comarcaId: "Admin", perfil: state.perfilActiveId, usuarioEmail: state.usuarioEmailActual });
                    
                    const alertBox = document.getElementById('live-xp-badge-alert');
                    if (alertBox) {
                        document.getElementById('live-xp-amount-txt').innerText = `+${alerta.xp}`;
                        alertBox.classList.add('show-alert'); actualizarEstado();
                        setTimeout(() => { alertBox.classList.remove('show-alert'); }, 5000);
                    }
                });
            }));
        };

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
            state.cacheAlertasGlobales = [];
            let unreadCount = 0;
            const leidosList = JSON.parse(localStorage.getItem(`leidos_${state.perfilActiveId}`) || "[]");

            snap.forEach(docSnap => {
                const a = docSnap.data(); const idA = docSnap.id;
                let elegible = false;

                if (a.targetType === "global") elegible = true;
                else if (a.targetType === "pais" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.pais) elegible = true;
                else if (a.targetType === "provincial" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.provincia) elegible = true;
                else if (a.targetType === "comarcal" && state.perfilActivoBase && a.targetValue === state.perfilActivoBase.comarca) elegible = true;
                else if (a.targetType === "cuenta" && a.targetValue === state.usuarioEmailActual) elegible = true;
                else if (a.targetType === "explorador" && a.targetValue === state.perfilActiveId) elegible = true;

                if (elegible) {
                    state.cacheAlertasGlobales.push({ id: idA, ...a });
                    if (!leidosList.includes(idA)) unreadCount++;
                }
            });

            const banner = document.getElementById('profesor-alert-banner');
            const msgTxt = document.getElementById('profesor-msg-text');
            const badge = document.getElementById('box-badge-num');

            if (state.cacheAlertasGlobales.length > 0) {
                state.cacheAlertasGlobales.sort((a,b) => b.timestamp - a.timestamp);
                msgTxt.innerText = state.cacheAlertasGlobales[0].textMessage;
                banner.style.display = 'block';
            } else { banner.style.display = 'none'; }

            if (unreadCount > 0) { badge.innerText = unreadCount; badge.style.display = 'flex'; }
            else { badge.style.display = 'none'; }
        };

        window.abrirBuzonHistoricoModal = () => {
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
        };

        window.abrirLectorMensajeEspecifico = (idMsg, cuerpo) => {
            document.getElementById('mailbox-modal').style.display = 'none';
            document.getElementById('m-reader-body').innerText = cuerpo;
            
            const btn = document.getElementById('m-reader-btn-action');
            btn.onclick = () => {
                let leidosList = JSON.parse(localStorage.getItem(`leidos_${state.perfilActiveId}`) || "[]");
                if (!leidosList.includes(idMsg)) { leidosList.push(idMsg); localStorage.setItem(`leidos_${state.perfilActiveId}`, JSON.stringify(leidosList)); }
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
           19. ÁLBUM Y CROMOS
           ========================================================================== */

        async function cargarAlbum() {
            const q = query(collection(db, "capturas"), where("perfil", "==", state.perfilActiveId));
            const snap = await getDocs(q);
            state.albumEspeciesMemoria = {};
            
            snap.forEach(documento => {
                const d = documento.data();
                if (!state.albumEspeciesMemoria[d.nombreCientifico]) {
                    state.albumEspeciesMemoria[d.nombreCientifico] = {
                        nombreComun: d.nombreComun, nombreCientifico: d.nombreCientifico, rareza: d.rareza,
                        descripcion: d.descripcion, foto: d.foto, fecha: d.fecha, loc: d.loc || "Campo",
                        tipoHoja: d.tipoHoja || "No especificado", origen: d.origen || "Autóctona",
                        copiasTotales: 0, nombresAlternativosRecogidos: new Set()
                    };
                }
                state.albumEspeciesMemoria[d.nombreCientifico].copiasTotales++;
                state.albumEspeciesMemoria[d.nombreCientifico].nombresAlternativosRecogidos.add(d.nombreComun);
            });
            window.filtrarYOrdenarAlbum();
        }

        window.filtrarYOrdenarAlbum = () => {
            const wrapper = document.getElementById('album-dinamico-contenedor');
            limpiarNodo(wrapper);
            const filtroTexto = document.getElementById('search-botanika').value.toLowerCase().trim();

            Object.values(state.albumEspeciesMemoria).forEach(esp => {
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
