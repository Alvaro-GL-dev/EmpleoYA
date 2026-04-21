import { API_URL, getHeaders, logout, showToast } from './api.js';

let dashboardChart;

document.addEventListener("DOMContentLoaded", () => {
    const rol = localStorage.getItem('rol');
    if (!localStorage.getItem('token') || rol !== 'ADMINISTRADOR') {
        window.location.replace('login.html');
        return;
    }

    initAdminTabs();
    initChart();
    cargarMetricasReales();
    initBuscadorGlobal();
    
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formNuevoRecursoAdmin')?.addEventListener('submit', guardarNuevoRecurso);
});

function initAdminTabs() {
    const tabs = document.querySelectorAll('#adminTabs .list-group-item');
    const contents = {
        dashboard: document.getElementById('dashboardTab'),
        usuarios: document.getElementById('usuariosTab'),
        empleos: document.getElementById('empleosTab'),
        recursos: document.getElementById('recursosTab')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            if(contents[tabId]) contents[tabId].style.display = 'block';
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('sectionTitle').innerText = tab.innerText.trim();
            
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput) searchInput.value = '';
            restaurarFilas();
            
            if(tabId === 'dashboard') cargarMetricasReales();
            if(tabId === 'usuarios') listarUsuariosAdmin();
            if(tabId === 'empleos') listarVacantesAdmin();
            if(tabId === 'recursos') listarRecursosAdmin();
        });
    });
}

function initBuscadorGlobal() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.tab-content:not([style*="display: none"]) tbody tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

function restaurarFilas() {
    document.querySelectorAll('tbody tr').forEach(row => row.style.display = '');
}

function initChart() {
    const ctx = document.getElementById('activityChart');
    if(!ctx) return;
    
    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Hace 5 días', 'Hace 4 días', 'Hace 3 días', 'Antier', 'Ayer', 'Hoy'],
            datasets: [{
                label: 'Usuarios Registrados',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });
}

async function cargarMetricasReales() {
    try {
        const res = await fetch(`${API_URL}/admin/metrics`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Fallo");
        
        const data = await res.json();
        
        if(document.getElementById('totalUsers')) document.getElementById('totalUsers').innerText = data.totalUsuarios || 0;
        if(document.getElementById('activeJobs')) document.getElementById('activeJobs').innerText = data.vacantesActivas || 0;
        if(document.getElementById('countPostulaciones')) document.getElementById('countPostulaciones').innerText = data.totalPostulaciones || 0;

        if (dashboardChart) {
            dashboardChart.data.datasets[0].data = [0, 0, 0, Math.floor((data.totalUsuarios||0)/2), (data.totalUsuarios||0) - 1, data.totalUsuarios||0];
            dashboardChart.update();
        }
    } catch (e) { console.warn("Métricas no cargadas."); }
}

// TABLA DE USUARIOS
async function listarUsuariosAdmin() {
    const container = document.getElementById("listaUsuariosAdmin");
    if (!container) return;
    container.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/usuarios`, { headers: getHeaders() });
        const usuarios = await res.json();

        if (usuarios.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay usuarios.</td></tr>';
            return;
        }

        container.innerHTML = usuarios.map(u => {
            let badgeColor = u.rol === 'ADMINISTRADOR' ? 'dark' : (u.rol === 'EMPRESA' ? 'primary' : 'info');
            let statusColor = u.estado === 'ACTIVO' ? 'success' : (u.estado === 'SUSPENDIDO' ? 'danger' : 'warning');
            
            // Lógica inteligente: Si está suspendido, muestra el botón de Activar. Si no, el de Suspender.
            let btnAccion = u.estado === 'SUSPENDIDO' 
                ? `<li><button class="dropdown-item small text-success fw-bold" onclick="cambiarEstadoUsuario('${u.id}', 'activar')"><i class="bi bi-check-circle me-2"></i>Activar</button></li>`
                : `<li><button class="dropdown-item small text-danger fw-bold" onclick="cambiarEstadoUsuario('${u.id}', 'suspender')"><i class="bi bi-slash-circle me-2"></i>Suspender</button></li>`;

            // Protegemos a los administradores para que no se puedan suspender a sí mismos
            if (u.rol === 'ADMINISTRADOR') btnAccion = `<li><span class="dropdown-item small text-muted">Protegido</span></li>`;

            return `
            <tr>
                <td class="ps-4 py-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-admin bg-${badgeColor}-soft text-${badgeColor} rounded-circle fw-bold" style="width:35px;height:35px">
                            ${u.correo_electronico.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-bold text-dark mb-0">${u.correo_electronico}</div>
                            <div class="text-muted extra-small">ID: ${u.id.substring(0, 8)}...</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-${badgeColor} bg-opacity-10 text-${badgeColor} rounded-pill px-3">${u.rol}</span></td>
                <td><span class="text-${statusColor} small fw-bold"><i class="bi bi-circle-fill me-1" style="font-size:0.5rem"></i> ${u.estado}</span></td>
                <td class="text-muted small fw-medium">${new Date(u.creado_el || Date.now()).toLocaleDateString()}</td>
                <td class="pe-4 text-end">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-light rounded-circle text-muted" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                        <ul class="dropdown-menu shadow-sm border-0">
                            ${btnAccion}
                        </ul>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { container.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error DB</td></tr>'; }
}

// Nueva función unificada para Activar y Suspender
window.cambiarEstadoUsuario = async (id, accion) => {
    const verbo = accion === 'activar' ? 'activar' : 'suspender';
    if(!confirm(`¿Deseas ${verbo} este usuario?`)) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/${accion}`, { method: 'PATCH', headers: getHeaders() });
        if (res.ok) { 
            showToast(`Usuario ${accion === 'activar' ? 'activado' : 'suspendido'}`, "success"); 
            listarUsuariosAdmin(); // Refresca la tabla automáticamente
        } else {
            showToast("Error en la operación", "danger");
        }
    } catch (error) { showToast("Error de red", "danger"); }
};


// TABLA DE VACANTES
async function listarVacantesAdmin() {
    const container = document.getElementById("listaVacantesAdmin");
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/admin/vacantes`, { headers: getHeaders() });
        const vacantes = await res.json();
        
        if (vacantes.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay vacantes.</td></tr>';
            return;
        }

        container.innerHTML = vacantes.map(v => `
            <tr>
                <td class="ps-4 fw-bold">${v.titulo_puesto || 'Sin título'}</td>
                <td class="text-muted">${v.nombre_empresa || 'Empresa Desconocida'}</td>
                <td><span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3">${v.estado || 'ACTIVA'}</span></td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarVacante('${v.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { container.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Error API</td></tr>'; }
}

window.eliminarVacante = async (id) => {
    if(!confirm("¿Borrar esta vacante?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/vacantes/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) { showToast("Eliminada", "success"); listarVacantesAdmin(); cargarMetricasReales(); }
    } catch (error) { showToast("Error", "danger"); }
};

// TABLA DE FORO/RECURSOS
async function listarRecursosAdmin() {
    const container = document.getElementById("listaRecursosAdmin");
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/admin/foro`, { headers: getHeaders() }); 
        const recursos = await res.json();

        if (recursos.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Foro vacío.</td></tr>';
            return;
        }

        container.innerHTML = recursos.map(r => `
            <tr>
                <td class="ps-4 fw-bold">${r.titulo || 'Publicación'}</td>
                <td><span class="badge bg-primary bg-opacity-10 text-primary">${r.tipo || 'General'}</span></td>
                <td class="text-muted small">${new Date(r.creado_el || Date.now()).toLocaleDateString()}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarRecurso('${r.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { container.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Error API</td></tr>'; }
}

window.eliminarRecurso = async (id) => {
    if(!confirm("¿Borrar este recurso/post?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/foro/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) { showToast("Eliminado", "success"); listarRecursosAdmin(); }
    } catch (error) { showToast("Error", "danger"); }
};

async function guardarNuevoRecurso(e) {
    e.preventDefault(); // Evita que la página se recargue

    // Recolectamos los datos exactos del formulario
    const nuevoRecurso = {
        titulo: document.getElementById('rTitulo').value,
        tipo: document.getElementById('rTipo').value,
        autor: document.getElementById('rAutor').value,
        tiempo_lectura: document.getElementById('rTiempo').value,
        imagen_url: document.getElementById('rImagen').value,
        resumen: document.getElementById('rResumen').value,
        contenido: document.getElementById('rContenido').value
    };

    try {
        const res = await fetch(`${API_URL}/admin/recursos`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoRecurso)
        });

        if (res.ok) {
            showToast("Recurso publicado con éxito", "success");
            
            // Cerrar el modal
            const modalEl = document.getElementById('modalNuevoRecurso');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Limpiar el formulario y recargar la tabla
            e.target.reset();
            listarRecursosAdmin(); 
        } else {
            showToast("Error al publicar el recurso", "danger");
        }
    } catch (error) {
        showToast("Error de conexión", "danger");
    }
}