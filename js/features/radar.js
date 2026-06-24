// Radar principal y disparador de cámara de exploración.
export function initializeRadar() {
    window.triggerCamera = triggerCamera;
}

export function triggerCamera() {
    document.getElementById('camera-input').click();
}
