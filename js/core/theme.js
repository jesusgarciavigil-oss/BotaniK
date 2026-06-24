// Centraliza la preferencia de tema y la integración con el selector de interfaz.
const THEME_STORAGE_KEY = "botanik-theme";
const VALID_THEME_PREFERENCES = ["dark", "light", "system"];

function isValidThemePreference(value) {
    return VALID_THEME_PREFERENCES.includes(value);
}

function resolveSystemTheme() {
    try {
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: light)").matches
        ) {
            return "light";
        }
    } catch (err) {
        // Si el navegador bloquea matchMedia, mantenemos el tema oscuro por defecto.
    }
    return "dark";
}

export function getBotanikThemePreference() {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return isValidThemePreference(storedTheme) ? storedTheme : "system";
    } catch (err) {
        return "system";
    }
}

export function applyBotanikTheme(preference = getBotanikThemePreference()) {
    const safePreference = isValidThemePreference(preference)
        ? preference
        : "system";
    const resolvedTheme = safePreference === "dark" || safePreference === "light"
        ? safePreference
        : resolveSystemTheme();
    document.documentElement.dataset.theme = resolvedTheme;
    return resolvedTheme;
}

export function setBotanikThemePreference(preference) {
    if (!isValidThemePreference(preference)) {
        return applyBotanikTheme("system");
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (err) {
        // Aunque no se pueda guardar, aplicamos el tema solicitado en esta sesión.
    }
    return applyBotanikTheme(preference);
}

export function sincronizarSelectorTemaPerfil() {
    const themePreferenceSelect = document.getElementById('theme-preference-select');
    if (!themePreferenceSelect) return;
    themePreferenceSelect.value = getBotanikThemePreference();
}

export function initializeThemeControls() {
    window.getBotanikThemePreference = getBotanikThemePreference;
    window.applyBotanikTheme = applyBotanikTheme;
    window.setBotanikThemePreference = setBotanikThemePreference;

    applyBotanikTheme();

    const themePreferenceSelect = document.getElementById('theme-preference-select');
    if (themePreferenceSelect) {
        themePreferenceSelect.addEventListener('change', (event) => {
            setBotanikThemePreference(event.target.value);
        });
        sincronizarSelectorTemaPerfil();
    }
}
