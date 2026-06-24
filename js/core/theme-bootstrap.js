// Bootstrap mínimo previo al CSS para aplicar el tema antes del primer pintado.
(() => {
    try {
        const storedTheme = localStorage.getItem("botanik-theme");
        const preference = ["dark", "light", "system"].includes(storedTheme)
            ? storedTheme
            : "system";
        let resolvedTheme = preference;

        if (preference === "system") {
            resolvedTheme = window.matchMedia
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                : "dark";
        }

        document.documentElement.dataset.theme = resolvedTheme;
    } catch (err) {
        document.documentElement.dataset.theme = "dark";
    }
})();
