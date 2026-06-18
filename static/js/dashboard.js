const API_URL = 'http://localhost:5001/api/v1';

let datosActuales = [];
let datosOriginales = [];
let paginaActual = 1;
let filasPorPagina = 10;
let totalPaginas = 1;

let citas = [];

async function cargarEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/estadisticas`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalLicencias').textContent = data.data.licencias;
            document.getElementById('totalPadrones').textContent = data.data.padrones;
            document.getElementById('totalPartidas').textContent = data.data.partidas;
        }
    } catch (error) {
        console.error(error);
    }
}

function ocultarTodo() {
    document.getElementById('inicioSection').style.display = 'none';
    document.getElementById('tramitesContent').classList.remove('active');
    document.getElementById('citasSection').classList.remove('active');
}

function mostrarInicio() {
    ocultarTodo();
    document.getElementById('inicioSection').style.display = 'block';
}

async function mostrarTramites(tipo) {
    ocultarTodo();
    document.getElementById('tramitesContent').classList.add('active');
    paginaActual = 1;

    document.getElementById('searchInput').value = '';
    document.getElementById('ordenFiltro').value = 'asc';

    const titulos = {
        licencias: '🚗 Licencias Municipales',
        padrones: '📋 Padrones Municipales',
        partidas: '📄 Partidas Registrales'
    };

    document.getElementById('sectionTitle').textContent = titulos[tipo];

    document.getElementById('tableContent').innerHTML = `
        <div style="text-align:center; padding:30px; font-size:18px; color:#667eea; font-weight:600; animation:pulse 1s infinite;">
            ⏳ Cargando datos de ${titulos[tipo].substring(3)}...
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/${tipo}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            datosActuales = data.data;
            datosOriginales = data.data;
            totalPaginas = Math.ceil(datosActuales.length / filasPorPagina);

            const columnas = Object.keys(datosOriginales[0]);
            let opcionesHTML = '<option value="todas">🔍 Buscar en todas</option>';
            columnas.forEach(col => {
                opcionesHTML += `<option value="${col}">📌 ${col.replace(/_/g, ' ').toUpperCase()}</option>`;
            });
            document.getElementById('columnaFiltro').innerHTML = opcionesHTML;

            setTimeout(() => {
                mostrarTabla();
            }, 1000);
        } else {
            datosActuales = [];
            mostrarTabla();
        }
    } catch (error) {
        document.getElementById('tableContent').innerHTML = '<p style="color:red;text-align:center;">❌ Error al conectar con la API</p>';
    }
}

function mostrarTabla() {
    if (datosActuales.length === 0) {
        document.getElementById('tableContent').innerHTML =
            '<p style="text-align:center; padding: 20px; font-weight: 500; color: #666;">No se encontraron resultados para los filtros aplicados.</p>';
        return;
    }

    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const datosPagina = datosActuales.slice(inicio, fin);
    const columnas = Object.keys(datosPagina[0]);

    let html = `
        <div style="width: 100%; overflow-x: auto; padding-bottom: 15px;">
            <table style="width: 100%; white-space: nowrap; border-collapse: collapse;">
                <thead>
                    <tr>
    `;

    columnas.forEach(col => {
        html += `<th>${col.replace(/_/g, ' ').toUpperCase()}</th>`;
    });

    html += `<th>ACCIÓN</th></tr></thead><tbody>`;

    datosPagina.forEach(item => {
        html += `<tr>`;

        columnas.forEach(col => {
            let valor = item[col] || '-';
            if (typeof valor === 'string' && valor.length > 40) {
                valor = valor.substring(0, 40) + '...';
            }
            html += `<td>${valor}</td>`;
        });

        html += `
            <td>
                <button class="btn-cabot btn-primary" style="padding: 8px 15px; font-size: 14px;"
                        onclick='iniciarTramite(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                    Iniciar
                </button>
            </td>
        `;
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    html += `
        <div class="pagination" style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 30px; padding-bottom: 20px;">
            <button class="btn-cabot btn-secondary" style="padding: 10px 20px; font-size: 15px; width: auto;" 
                onclick="cambiarPagina(${paginaActual - 1})"
                ${paginaActual === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                ◀ Anterior
            </button>
            <div style="background: #f0f4ff; color: #1a5fa8; padding: 10px 24px; border-radius: 12px; font-weight: 600; font-family: 'Inter', sans-serif;">
                Página ${paginaActual} de ${totalPaginas}
            </div>
            <button class="btn-cabot btn-secondary" style="padding: 10px 20px; font-size: 15px; width: auto;" 
                onclick="cambiarPagina(${paginaActual + 1})"
                ${paginaActual === totalPaginas ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                Siguiente ▶
            </button>
        </div>
    `;

    document.getElementById('tableContent').innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    paginaActual = nuevaPagina;
    mostrarTabla();
    document.getElementById('tramitesContent').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const columnaFiltro = document.getElementById('columnaFiltro');
    const ordenFiltro = document.getElementById('ordenFiltro');

    if (searchInput && columnaFiltro && ordenFiltro) {
        function aplicarFiltros() {
            const texto = searchInput.value.toLowerCase();
            const columna = columnaFiltro.value;
            const orden = ordenFiltro.value;

            datosActuales = datosOriginales.filter(item => {
                if (columna === 'todas') {
                    return JSON.stringify(item).toLowerCase().includes(texto);
                } else {
                    const valor = item[columna] ? String(item[columna]).toLowerCase() : '';
                    return valor.includes(texto);
                }
            });

            datosActuales.sort((a, b) => {
                let colOrden = columna === 'todas' ? Object.keys(datosOriginales[0])[0] : columna;
                let valA = a[colOrden] ? String(a[colOrden]).toLowerCase() : '';
                let valB = b[colOrden] ? String(b[colOrden]).toLowerCase() : '';
                
                if (valA < valB) return orden === 'asc' ? -1 : 1;
                if (valA > valB) return orden === 'asc' ? 1 : -1;
                return 0;
            });

            totalPaginas = Math.ceil(datosActuales.length / filasPorPagina) || 1;
            paginaActual = 1;
            mostrarTabla();
        }

        searchInput.addEventListener('keyup', aplicarFiltros);
        columnaFiltro.addEventListener('change', aplicarFiltros);
        ordenFiltro.addEventListener('change', aplicarFiltros);
    }
});

function iniciarTramite(tramite) {
    alert('📝 Trámite iniciado correctamente\n\n' + JSON.stringify(tramite, null, 2));
}

function volverInicio() {
    mostrarInicio();
}

function mostrarCitas() {
    ocultarTodo();
    document.getElementById('citasSection').classList.add('active');
}

function guardarCita(event, tipo) {
    event.preventDefault();
    const nuevaCita = { tipo: tipo, fecha: new Date().toLocaleString() };
    citas.push(nuevaCita);
    mostrarListaCitas();
    alert('✅ Cita registrada correctamente');
    event.target.reset();
}

function mostrarListaCitas() {
    let html = '';
    citas.forEach(cita => {
        html += `
            <div style="background:white; padding:15px; border-radius:15px; margin-top:15px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">
                <h4>${cita.tipo}</h4>
                <p>${cita.fecha}</p>
            </div>
        `;
    });
    document.getElementById('listaCitas').innerHTML = html;
}

function logout() {
    window.location.href = '/logout';
}

cargarEstadisticas();

/* =========================================
   LÓGICA DEL MODO OSCURO (TEMA)
========================================= */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    actualizarIconoTema(isDark);
}

function actualizarIconoTema(isDark) {
    const icon = document.getElementById('darkModeIcon');
    if(icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        actualizarIconoTema(true);
    } else {
        actualizarIconoTema(false);
    }
});