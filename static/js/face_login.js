let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let stream = null;
let scanning = false;

const scanBtn = document.getElementById('scanBtn');
const retryBtn = document.getElementById('retryBtn');
const statusMessage = document.getElementById('statusMessage');

async function initCamera() {
    try {
        if (stream) stream.getTracks().forEach(track => track.stop());
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        video.srcObject = stream;
    } catch (err) {
        statusMessage.innerHTML = '❌ No se puede acceder a la cámara. Verifica los permisos.';
        statusMessage.className = 'status-error';
    }
}

initCamera();

scanBtn.addEventListener('click', async () => {
    if (scanning) return;
    scanning = true;

    statusMessage.innerHTML = '📸 Escaneando rostro... Por favor espera.';
    statusMessage.className = 'status-info scanning';
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Escaneando...';

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
        const response = await fetch('/api/verify_face_only', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();

        if (data.success) {
            statusMessage.innerHTML = `✅ ${data.message}`;
            statusMessage.className = 'status-success';
            setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
        } else {
            statusMessage.innerHTML = `❌ ${data.message}`;
            statusMessage.className = 'status-error';
            scanBtn.disabled = false;
            scanBtn.innerHTML = '<span class="btn-icon">🔍</span> Escanear mi rostro';
            retryBtn.style.display = 'flex';
        }
    } catch (error) {
        statusMessage.innerHTML = '❌ Error de conexión. Intenta de nuevo.';
        statusMessage.className = 'status-error';
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<span class="btn-icon">🔍</span> Escanear mi rostro';
        retryBtn.style.display = 'flex';
    } finally {
        scanning = false;
    }
});

retryBtn.addEventListener('click', () => {
    statusMessage.innerHTML = '⚡ Listo para escanear. Presiona "Escanear mi rostro"';
    statusMessage.className = 'status-info';
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-icon">🔍</span> Escanear mi rostro';
    retryBtn.style.display = 'none';
});

window.addEventListener('beforeunload', () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
});