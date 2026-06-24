const crypto = require("crypto");

function signPayload(payloadPart, secret) {
    return crypto.createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

function safeCompare(a, b) {
    const aBuffer = Buffer.from(a || "");
    const bBuffer = Buffer.from(b || "");
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function validateAdminToken(token, secret) {
    const [payloadPart, signature] = String(token || "").split(".");
    if (!payloadPart || !signature) return false;

    const expectedSignature = signPayload(payloadPart, secret);
    if (!safeCompare(signature, expectedSignature)) return false;

    let payload = null;
    try {
        payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    } catch (error) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload && payload.role === "admin" && Number.isFinite(payload.exp) && payload.exp > now;
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!sessionSecret) {
        return res.status(500).json({ error: "Acceso admin no configurado." });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!validateAdminToken(token, sessionSecret)) {
        return res.status(401).json({ error: "Sesión admin no válida." });
    }

    return res.status(200).json({ ok: true });
};
