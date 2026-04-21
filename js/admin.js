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
// --- VARIABLES GLOBALES PARA LOS FILTROS ---
let todosLosUsuarios = [];
let todoElContenido = [];

// ==========================================
// 1. GESTIÓN DE USUARIOS (CARDS Y FILTROS)
// ==========================================
async function listarUsuariosAdmin() {
    const container = document.getElementById("listaUsuariosAdmin");
    if (!container) return;
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const res = await fetch(`${API_URL}/admin/usuarios`, { headers: getHeaders() });
        todosLosUsuarios = await res.json();
        renderizarUsuarios('TODOS');
        configurarFiltros('filtrosUsuarios', renderizarUsuarios);
    } catch (e) { container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar usuarios</div>'; }
}

function renderizarUsuarios(filtroRol) {
    const container = document.getElementById("listaUsuariosAdmin");
    const filtrados = filtroRol === 'TODOS' ? todosLosUsuarios : todosLosUsuarios.filter(u => u.rol === filtroRol);

    if (filtrados.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">No hay usuarios en esta categoría.</div>';
        return;
    }

    container.innerHTML = filtrados.map(u => {
        let badgeColor = u.rol === 'ADMINISTRADOR' ? 'dark' : (u.rol === 'EMPRESA' ? 'primary' : 'info');
        let statusColor = u.estado === 'ACTIVO' ? 'success' : (u.estado === 'SUSPENDIDO' ? 'danger' : 'warning');
        
        let btnAccion = u.estado === 'SUSPENDIDO' 
            ? `<button class="btn btn-sm btn-outline-success rounded-pill fw-bold w-100 mt-3" onclick="cambiarEstadoUsuario('${u.id}', 'activar')"><i class="bi bi-check-circle me-1"></i> Activar Cuenta</button>`
            : `<button class="btn btn-sm btn-outline-danger rounded-pill fw-bold w-100 mt-3" onclick="cambiarEstadoUsuario('${u.id}', 'suspender')"><i class="bi bi-slash-circle me-1"></i> Suspender</button>`;
        
        if (u.rol === 'ADMINISTRADOR') btnAccion = `<button class="btn btn-sm btn-light rounded-pill fw-bold w-100 mt-3" disabled>Cuenta Protegida</button>`;

        return `
        <div class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white metric-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="avatar-admin bg-${badgeColor}-soft text-${badgeColor} rounded-circle fw-bold fs-5" style="width:50px;height:50px">
                        ${u.correo_electronico.charAt(0).toUpperCase()}
                    </div>
                    <span class="badge bg-${statusColor} bg-opacity-10 text-${statusColor} rounded-pill px-3 py-2">${u.estado}</span>
                </div>
                <h6 class="fw-bold text-dark mb-1 text-truncate" title="${u.correo_electronico}">${u.correo_electronico}</h6>
                <div class="text-muted small mb-3">ID: ${u.id.substring(0, 8)}...</div>
                <div class="mt-auto border-top pt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${badgeColor} text-white rounded-pill px-3">${u.rol}</span>
                        <small class="text-muted extra-small">${new Date(u.creado_el).toLocaleDateString()}</small>
                    </div>
                    ${btnAccion}
                </div>
            </div>
        </div>`;
    }).join('');
}

window.cambiarEstadoUsuario = async (id, accion) => {
    if(!confirm(`¿Deseas ${accion} este usuario?`)) return;
    try {
        const res = await fetch(`${API_URL}/admin/usuarios/${id}/${accion}`, { method: 'PATCH', headers: getHeaders() });
        if (res.ok) { showToast(`Usuario actualizado`, "success"); listarUsuariosAdmin(); }
    } catch (error) { showToast("Error de red", "danger"); }
};


// ==========================================
// 2. GESTIÓN DE VACANTES (CARDS)
// ==========================================
async function listarVacantesAdmin() {
    const container = document.getElementById("listaVacantesAdmin");
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/admin/vacantes`, { headers: getHeaders() });
        const vacantes = await res.json();
        
        if (vacantes.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">No hay vacantes en el sistema.</div>';
            return;
        }

        container.innerHTML = vacantes.map(v => `
        <div class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white metric-card">
                <div class="d-flex justify-content-between mb-3">
                    <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">ACTIVA</span>
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarVacante('${v.id}')" title="Eliminar Vacante"><i class="bi bi-trash"></i></button>
                </div>
                <h5 class="fw-bold mb-2">${v.titulo_puesto || 'Sin título'}</h5>
                <p class="text-muted small mb-4"><i class="bi bi-building me-2"></i>${v.nombre_empresa || 'Empresa Desconocida'}</p>
            </div>
        </div>`).join('');
    } catch (e) { container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar vacantes</div>'; }
}

window.eliminarVacante = async (id) => {
    if(!confirm("¿Borrar esta vacante de forma permanente?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/vacantes/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (res.ok) { showToast("Eliminada", "success"); listarVacantesAdmin(); cargarMetricasReales(); }
    } catch (error) { showToast("Error", "danger"); }
};


// ==========================================
// 3. RECURSOS Y FORO (SOLUCIÓN DE BUG + FILTROS)
// ==========================================
async function listarRecursosAdmin() {
    const container = document.getElementById("listaRecursosAdmin");
    if (!container) return;
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        // SOLUCIÓN: Hacemos dos peticiones al mismo tiempo (Recursos y Foro)
        const [resForo, resRecursos] = await Promise.all([
            fetch(`${API_URL}/admin/foro`, { headers: getHeaders() }),
            fetch(`${API_URL}/recursos`, { headers: getHeaders() }) // Traemos los recursos oficiales
        ]);
        
        const foro = resForo.ok ? await resForo.json() : [];
        const recursos = resRecursos.ok ? await resRecursos.json() : [];

        // Los marcamos para saber de dónde vienen y los unimos
        const foroMarcado = foro.map(f => ({ ...f, origen: 'FORO' }));
        const recursosMarcados = recursos.map(r => ({ ...r, origen: 'RECURSO' }));
        
        todoElContenido = [...recursosMarcados, ...foroMarcado];

        // Ordenar por fecha (más recientes primero)
        todoElContenido.sort((a, b) => new Date(b.creado_el) - new Date(a.creado_el));

        renderizarContenido('TODOS');
        configurarFiltros('filtrosRecursos', renderizarContenido);

    } catch (e) { container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar contenido</div>'; }
}

function renderizarContenido(filtro) {
    const container = document.getElementById("listaRecursosAdmin");
    const filtrados = filtro === 'TODOS' ? todoElContenido : todoElContenido.filter(c => c.origen === filtro);

    if (filtrados.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">No hay contenido en esta categoría.</div>';
        return;
    }

    container.innerHTML = filtrados.map(item => {
        const esForo = item.origen === 'FORO';
        const color = esForo ? 'primary' : 'success';
        const icono = esForo ? 'bi-chat-left-text' : 'bi-journal-bookmark';
        
        // Endpoint dinámico para borrar
        const deleteParams = esForo ? `'${item.id}', 'foro'` : `'${item.id}', 'recursos'`;

        return `
        <div class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white metric-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge bg-${color} bg-opacity-10 text-${color} rounded-pill px-3 py-2"><i class="bi ${icono} me-1"></i> ${item.origen}</span>
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarContenido(${deleteParams})" title="Borrar"><i class="bi bi-trash"></i></button>
                </div>
                <h6 class="fw-bold mb-2">${item.titulo}</h6>
                <div class="text-muted small mb-3"><i class="bi bi-person me-1"></i> ${item.autor_nombre || item.autor || 'Admin'}</div>
                <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                    <span class="badge bg-light text-dark px-2">${item.tipo || item.categoria || 'General'}</span>
                    <small class="text-muted extra-small">${new Date(item.creado_el || Date.now()).toLocaleDateString()}</small>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.eliminarContenido = async (id, tipoEndpoint) => {
    if(!confirm("¿Borrar este contenido permanentemente?")) return;
    try {
        const ruta = tipoEndpoint === 'foro' ? `/foros/${id}` : `/recursos/${id}`;
        const res = await fetch(`${API_URL}${ruta}`, { method: 'DELETE', headers: getHeaders() });
        
        if (res.ok) { showToast("Contenido eliminado", "success"); listarRecursosAdmin(); }
        else { showToast("Error al eliminar", "danger"); }
    } catch (error) { showToast("Error de conexión", "danger");
    }
};

// FUNCIÓN AUXILIAR PARA BOTONES DE FILTRO
function configurarFiltros(contenedorId, funcionRender) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    
    // Evitamos duplicar eventos si el usuario entra y sale de la pestaña
    const nuevoContenedor = contenedor.cloneNode(true);
    contenedor.parentNode.replaceChild(nuevoContenedor, contenedor);

    nuevoContenedor.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            nuevoContenedor.querySelectorAll('button').forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-outline-secondary');
            });
            e.target.classList.remove('btn-outline-secondary');
            e.target.classList.add('btn-primary', 'active');
            
            const filtro = e.target.getAttribute('data-filter');
            funcionRender(filtro);
        }
    });
}

async function guardarNuevoRecurso(e) {
    e.preventDefault();

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