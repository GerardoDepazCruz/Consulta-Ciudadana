let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let capturedImage = null;
let stream = null;
let messageDiv = document.getElementById('message');

async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        video.srcObject = stream;
    } catch (err) {
        messageDiv.innerHTML = '<div class="error">❌ No se puede acceder a la cámara. Verifica los permisos.</div>';
    }
}

initCamera();

document.getElementById('captureBtn').addEventListener('click', async () => {
    messageDiv.innerHTML = '<div class="loading">📸 Procesando rostro...</div>';

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImage = canvas.toDataURL('image/jpeg');

    try {
        const response = await fetch('/api/check_face_registered', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: capturedImage })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.innerHTML = '<div class="success">✅ ' + data.message + '</div>';
            document.getElementById('stepFacial').style.display = 'none';
            document.getElementById('stepConfirm').style.display = 'block';
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            if (stream) stream.getTracks().forEach(track => track.stop());
        } else {
            messageDiv.innerHTML = '<div class="error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">❌ Error de conexión. Intenta de nuevo.</div>';
    }
});

document.getElementById('confirmYes').addEventListener('click', () => {
    document.getElementById('stepConfirm').style.display = 'none';
    document.getElementById('stepForm').style.display = 'block';
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step2').classList.add('completed');
    document.getElementById('step3').classList.add('active');
    messageDiv.innerHTML = '';
});

document.getElementById('confirmNo').addEventListener('click', () => {
    location.reload();
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const dni = document.getElementById('dni_facial').value;
    const celular = document.getElementById('celular_facial').value;
    const correo = document.getElementById('correo_facial').value;
    const password = document.getElementById('password_facial').value;

    if (!nombres || !apellidos || !dni || !celular || !correo || !password) {
        messageDiv.innerHTML = '<div class="error">❌ Todos los campos son obligatorios</div>';
        return;
    }
    if (dni.length !== 8 || !dni.match(/^\d+$/)) {
        messageDiv.innerHTML = '<div class="error">❌ El DNI debe tener 8 dígitos numéricos</div>';
        return;
    }
    if (celular.length !== 9 || !celular.match(/^\d+$/)) {
        messageDiv.innerHTML = '<div class="error">❌ El celular debe tener 9 dígitos numéricos</div>';
        return;
    }
    if (password.length < 6) {
        messageDiv.innerHTML = '<div class="error">❌ La contraseña debe tener al menos 6 caracteres</div>';
        return;
    }

    messageDiv.innerHTML = '<div class="loading">🔄 Registrando usuario con datos faciales...</div>';

    try {
        const response = await fetch('/api/register_facial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombres, apellidos, dni, celular, correo, password, image: capturedImage })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.innerHTML = '<div class="success">✅ ' + data.message + '<br>🎉 Ahora puedes iniciar sesión con tu rostro!</div>';
            setTimeout(() => { window.location.href = '/face_login_page'; }, 3000);
        } else {
            messageDiv.innerHTML = '<div class="error">❌ ' + data.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error">❌ Error de conexión. Intenta de nuevo.</div>';
    }
});

window.addEventListener('beforeunload', () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
});