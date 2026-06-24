// Procesamiento de capturas botánicas: imagen, IA, XP y guardado en Firestore.
import {
    addDoc,
    collection,
    db,
    getDocs,
    query,
    where
} from "../config/firebase.js";
import { MULTIPLICADORES_RAREZA } from "../core/constants.js";
import { state } from "../core/state.js";
import { analyzePlantImage } from "../services/plant-analysis.js";

const captureCallbacks = {
    calculateAge: null,
    compressImage: null,
    showVictoryToast: null,
    onAlbumRefresh: null,
    openCardModal: null
};

export function initializeCaptures(callbacks = {}) {
    Object.assign(captureCallbacks, callbacks);
    window.procesarFoto = procesarFoto;
}

export async function procesarFoto(event) {
    const file = event.target.files[0]; if (!file) return;
    document.getElementById('loading').style.display = 'block';

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
            try {
                // 1. Redimensionamos y extraemos la foto
                const base64DataCompleta = captureCallbacks.compressImage?.(img);
                
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

                let edadAventurero = captureCallbacks.calculateAge?.(state.perfilActivoNacimiento);
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
                captureCallbacks.showVictoryToast?.(mensajeToastDesglose);
                captureCallbacks.onAlbumRefresh?.(); // Recargamos el álbum

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

                captureCallbacks.openCardModal?.(muestraRecienCapturada);
                
            } catch (err) {
                document.getElementById('loading').style.display = 'none';
                alert(`💥 CRASH EN PROCESAR FOTO (Lógica Interna):\n\nDetalle: ${err.name} - ${err.message}`);
                console.error(err);
            }
        };
        img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
}
