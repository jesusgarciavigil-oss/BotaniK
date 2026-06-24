// Navegación principal entre vistas de la app familiar.
export function createSwitchPage({ onAlbumSelected } = {}) {
    return function switchPage(pageId, buttonElement) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');
        if(buttonElement) buttonElement.classList.add('active');
        if(pageId === 'album') onAlbumSelected?.();
    };
}
