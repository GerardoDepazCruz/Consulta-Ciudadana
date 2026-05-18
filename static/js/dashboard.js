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

    const titulos = {
        licencias: '🚗 Licencias Municipales',
        padrones: '📋 Padrones Municipales',
        partidas: '📄 Partidas Registrales'
    };

    document.getElementById('sectionTitle').textContent = titulos[tipo];

    try {

        const response = await fetch(`${API_URL}/${tipo}`);
        const data = await response.json();

        if (data.success) {

            datosActuales = data.data;
            datosOriginales = data.data;

            totalPaginas = Math.ceil(datosActuales.length / filasPorPagina);

            mostrarTabla();

        }

    } catch (error) {

        document.getElementById('tableContent').innerHTML =
            '<p style="color:red;text-align:center;">❌ Error al conectar con la API</p>';

    }

}

function mostrarTabla() {

    if (datosActuales.length === 0) {

        document.getElementById('tableContent').innerHTML =
            '<p>No hay datos disponibles</p>';

        return;

    }

    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;

    const datosPagina = datosActuales.slice(inicio, fin);

    const columnas = Object.keys(datosPagina[0]);

    let html = `
        <table>
            <thead>
                <tr>
    `;

    columnas.forEach(col => {

        html += `<th>${col.replace(/_/g, ' ')}</th>`;

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
                <button class="btn-tramite"
                        onclick='iniciarTramite(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                    Iniciar
                </button>
            </td>
        `;

        html += `</tr>`;

    });

    html += `</tbody></table>`;

    html += `
        <div class="pagination">

            <button onclick="cambiarPagina(${paginaActual - 1})"
                ${paginaActual === 1 ? 'disabled' : ''}>
                ◀ Anterior
            </button>

            <button disabled>
                Página ${paginaActual} de ${totalPaginas}
            </button>

            <button onclick="cambiarPagina(${paginaActual + 1})"
                ${paginaActual === totalPaginas ? 'disabled' : ''}>
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

}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('searchInput').addEventListener('keyup', function () {

        const texto = this.value.toLowerCase();

        datosActuales = datosOriginales.filter(item =>
            JSON.stringify(item).toLowerCase().includes(texto)
        );

        totalPaginas = Math.ceil(datosActuales.length / filasPorPagina);

        paginaActual = 1;

        mostrarTabla();

    });

});

function iniciarTramite(tramite) {

    alert(
        '📝 Trámite iniciado correctamente\n\n' +
        JSON.stringify(tramite, null, 2)
    );

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

    const nuevaCita = {
        tipo: tipo,
        fecha: new Date().toLocaleString()
    };

    citas.push(nuevaCita);

    mostrarListaCitas();

    alert('✅ Cita registrada correctamente');

    event.target.reset();

}

function mostrarListaCitas() {

    let html = '';

    citas.forEach(cita => {

        html += `
            <div style="
                background:white;
                padding:15px;
                border-radius:15px;
                margin-top:15px;
                box-shadow:0 5px 15px rgba(0,0,0,0.08);
            ">

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
