const crypto = require("crypto");

const SESSION_TTL_SECONDS = 2 * 60 * 60;

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

function signPayload(payloadPart, secret) {
    return crypto.createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

function safeCompare(a, b) {
    const aBuffer = Buffer.from(a || "");
    const bBuffer = Buffer.from(b || "");
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function createAdminToken(secret) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        role: "admin",
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
        nonce: crypto.randomBytes(16).toString("base64url")
    };
    const payloadPart = base64url(JSON.stringify(payload));
    const signature = signPayload(payloadPart, secret);
    return `${payloadPart}.${signature}`;
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!adminPassword || !sessionSecret) {
        return res.status(500).json({ error: "Acceso admin no configurado." });
    }

    let requestBody = {};
    try {
        requestBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (error) {
        return res.status(400).json({ error: "Solicitud no válida." });
    }

    const password = typeof requestBody.password === "string" ? requestBody.password : "";
    if (!password || !safeCompare(password, adminPassword)) {
        return res.status(401).json({ error: "Acceso admin no autorizado." });
    }

    return res.status(200).json({
        ok: true,
        token: createAdminToken(sessionSecret),
        expiresIn: SESSION_TTL_SECONDS
    });
};
