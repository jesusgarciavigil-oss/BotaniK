// Centraliza la llamada serverless de análisis botánico con IA.
export async function analyzePlantImage({
    imageBase64,
    edadAventurero,
    sectorBaseTxt,
    perfilActivoEsExperto
}) {
    const response = await fetch('/api/analyze-plant', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            imageBase64,
            edadAventurero,
            sectorBaseTxt,
            perfilActivoEsExperto
        })
    });

    let body = null;
    try {
        body = await response.json();
    } catch (jsonErr) {
        body = null;
    }

    return { ok: response.ok, body };
}
