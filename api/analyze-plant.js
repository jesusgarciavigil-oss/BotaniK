const GEMINI_MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function buildPrompt({ edadAventurero, sectorBaseTxt, perfilActivoEsExperto }) {
    return `Eres el Satélite Botánico del laboratorio central BotaniK. Tu primera tarea obligatoria es realizar un análisis espectral de la imagen para buscar tejidos vegetales, clorofila, estructuras foliares, tallos, raíces o flores.

SISTEMA DE EXCLUSIÓN CRÍTICO:
Si la imagen contiene objetos domésticos, personas, animales, pantallas, textos, habitaciones, paisajes urbanos sin vegetación enfocada o CUALQUIER otra muestra que NO sea una planta real, debes detener el escaneo inmediatamente y devolver de forma estricta este JSON exacto:
{
  "esPlanta": false,
  "motivoRechazo": "El escáner de campo no ha detectado actividad fotosintética ni estructuras celulares del reino vegetal en esta superficie."
}

Solo si la imagen contiene de forma clara y evidente una muestra botánica real, pon "esPlanta": true y rellena el resto de los campos con total rigor científico.
Relato pedagógico adaptado para un explorador de ${edadAventurero} años con Base Secreta en ${sectorBaseTxt}. (Modo Experto: ${perfilActivoEsExperto}). Incluye mitología local de la provincia (ej. Cantabria: Anjanas/Trastolillos; Jaén: mitos íberos).

Campos obligatorios si es planta (sin usar bloques de código \`\`\`json ni caracteres markdown):
{
  "esPlanta": true,
  "nombreComun": "NOMBRE DE LA PLANTA EN MAYÚSCULAS",
  "nombreCientifico": "Género y especie",
  "rareza": "comun, poco, especial o exotica",
  "descripcion": "Narración MUY BREVE (Máximo 2 líneas o 120 caracteres) combinando ciencia y mitología local. Debe ser un texto corto y misterioso que quepa en un cromo físico impreso.",
  "tipoHoja": "Perenne/Caduca/No aplica",
  "origen": "Autóctona/Exótica"
}`;
}

function parseGeminiPlantResponse(geminiResponse) {
    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        const error = new Error("Gemini no generó candidatos para esta imagen.");
        error.statusCode = 422;
        throw error;
    }

    let rawText = geminiResponse.candidates[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) {
        const error = new Error("Gemini devolvió una respuesta vacía.");
        error.statusCode = 502;
        throw error;
    }

    if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```json/i, "").replace(/```$/, "").trim();
    }

    try {
        return JSON.parse(rawText);
    } catch (parseError) {
        const error = new Error("Gemini no devolvió un JSON válido.");
        error.statusCode = 502;
        throw error;
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "La clave de Gemini no está configurada en el servidor." });
    }

    let requestBody = {};
    try {
        requestBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (parseError) {
        return res.status(400).json({ error: "Cuerpo de petición no válido." });
    }

    const {
        imageBase64,
        edadAventurero = "desconocida",
        sectorBaseTxt = "Desconocido",
        perfilActivoEsExperto = false
    } = requestBody;

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 100) {
        return res.status(400).json({ error: "Imagen no válida para el análisis." });
    }

    try {
        const geminiResponse = await fetch(`${GEMINI_MODEL_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: buildPrompt({ edadAventurero, sectorBaseTxt, perfilActivoEsExperto }) },
                        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                    ]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const statusCode = geminiResponse.status === 429 ? 429 : 502;
            return res.status(statusCode).json({ error: "Gemini no pudo completar el análisis." });
        }

        const body = await geminiResponse.json();
        const plantData = parseGeminiPlantResponse(body);

        return res.status(200).json(plantData);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Error interno durante el análisis botánico."
        });
    }
};
