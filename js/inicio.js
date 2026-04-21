import { API_URL, logout, showToast } from './api.js';

// Variable global para guardar los datos originales
let todasLasVacantes = [];

// Cargar Vacantes
async function cargarVacantes() {
    const container = document.getElementById("jobsContainer");
    const jobCountSpan = document.getElementById("jobCount");

    try {
        const res = await fetch(`${API_URL}/vacantes`);
        todasLasVacantes = await res.json();

        // Renderizamos por primera vez
        renderizarVacantes(todasLasVacantes);
        renderizarEmpresasDestacadas(todasLasVacantes);

    } catch (error) {
        container.innerHTML = `<p class="text-danger text-center w-100">Error al cargar las vacantes.</p>`;
    }
}

function renderizarVacantes(lista) {
    const container = document.getElementById("jobsContainer");
    const jobCountSpan = document.getElementById("jobCount");

    if (jobCountSpan) jobCountSpan.innerText = `${lista.length} empleos`;

    if (lista.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">No se encontraron empleos que coincidan con tu búsqueda.</p></div>`;
        return;
    }

    container.innerHTML = lista.map(job => `
        <div class="col-md-6 col-lg-4">
          <div class="job-card p-3 h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="text-primary fw-bold">${job.moneda || 'USD'} ${job.rango_salarial_max || 'A convenir'}</h6>
              <span class="badge bg-light text-dark rounded-pill">${job.modalidad}</span>
            </div>
            <h5 class="mt-2 fw-bold">${job.titulo_puesto}</h5>
            <div class="small text-muted mb-2">${job.nombre_comercial || 'Empresa Confidencial'}</div>
            <p class="text-muted small mt-2 flex-grow-1">${job.descripcion_puesto.substring(0, 100)}...</p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div><i class="bi bi-geo-alt text-primary me-1"></i> <span class="small">${job.ubicacion_especifica || 'Remoto'}</span></div>
            </div>
            <hr class="my-2">
            <div class="d-flex justify-content-between align-items-center">
              <button class="btn btn-sm btn-primary w-100 apply-btn" data-id="${job.id}">
                Postularse <i class="bi bi-arrow-right-short"></i>
              </button>
            </div>
          </div>
        </div>
    `).join('');

    document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            verificarYRedirigir();
        });
    });
}

// Función de filtrado
function filtrarVacantes() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const location = document.getElementById('filterLocation').value.toLowerCase();

    const filtradas = todasLasVacantes.filter(job => {
        const titulo = (job.titulo_puesto || '').toLowerCase();
        const empresa = (job.nombre_comercial || job.razon_social || '').toLowerCase();
        const modalidad = (job.modalidad || '').toLowerCase();
        const ubicacion = (job.ubicacion_especifica || '').toLowerCase();

        // Verifica si la palabra clave coincide con título o empresa
        const coincideKeyword = titulo.includes(keyword) || empresa.includes(keyword);
        
        // Verifica si la ubicación coincide con la ciudad o la modalidad
        const coincideLocation = location === '' || ubicacion.includes(location) || modalidad.includes(location);

        return coincideKeyword && coincideLocation;
    });

    renderizarVacantes(filtradas);
}

function renderizarEmpresasDestacadas(vacantes) {
    const container = document.getElementById("empresasContainer");
    if (!container) return;

    const empresasMap = {};
    vacantes.forEach(job => {
        const nombreEmpresa = job.empresa_nombre || job.nombre_comercial || job.razon_social || 'Empresa Confidencial';
        if (!empresasMap[nombreEmpresa]) {
            empresasMap[nombreEmpresa] = {
                nombre: nombreEmpresa,
                logo: job.empresa_logo || null,
                ubicacion: job.ubicacion_sede || 'El Salvador',
                cantidadVacantes: 0
            };
        }
        empresasMap[nombreEmpresa].cantidadVacantes++;
    });

    const empresasArray = Object.values(empresasMap).sort((a, b) => b.cantidadVacantes - a.cantidadVacantes);

    container.innerHTML = empresasArray.slice(0, 8).map(empresa => `
        <div class="col-md-4 col-lg-3 mb-4">
          <div class="card p-4 border-0 shadow-sm rounded-4 h-100 text-center job-card">
            <div class="mx-auto mb-3">
                ${empresa.logo 
                    ? `<img src="${empresa.logo}" class="rounded-circle shadow-sm" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid white;">`
                    : `<div class="rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center text-white fw-bold fs-3" style="width: 70px; height: 70px; background: linear-gradient(135deg, #0d6efd, #0b5ed7); border: 3px solid white;">${empresa.nombre.charAt(0)}</div>`
                }
            </div>
            <h6 class="fw-bold text-dark mb-1 text-truncate">${empresa.nombre}</h6>
            <p class="text-muted small mb-3"><i class="bi bi-geo-alt me-1"></i>${empresa.ubicacion}</p>
            <div class="mt-auto pt-3 border-top">
                <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 w-100">
                    ${empresa.cantidadVacantes} vacante(s) activa(s)
                </span>
            </div>
          </div>
        </div>
    `).join('');
}

const verificarYRedirigir = () => {
    if(!localStorage.getItem('token')) {
        showToast("Crea una cuenta para postularte a empleos o cargar tu CV", "info");
        setTimeout(() => window.location.href = 'registro.html', 1500);
        return false;
    }
    window.location.href = 'candidato-dashboard.html';
    return true;
};

const checkSession = () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const navAuth = document.getElementById('navAuthButtons');
    if (!navAuth) return;

    if (token) {
        const url = rol === 'EMPRESA' ? 'empresa.html' : 'candidato-dashboard.html';
        navAuth.innerHTML = `
            <a href="${url}" class="btn btn-primary rounded-pill px-4 fw-bold">Mi Panel</a>
            <button class="btn btn-outline-danger rounded-pill ms-2" id="btnLogout">Salir</button>
        `;
        document.getElementById('btnLogout').addEventListener('click', logout);
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary rounded-pill px-4 fw-bold border-2">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Registrarse</a>
        `;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    cargarVacantes();
    
    // EVENTOS DEL BUSCADOR
    document.getElementById('searchBtn')?.addEventListener('click', filtrarVacantes);
    
    document.getElementById('searchKeyword')?.addEventListener('input', filtrarVacantes);
    document.getElementById('filterLocation')?.addEventListener('change', filtrarVacantes);

    document.getElementById('heroUploadCV')?.addEventListener('click', verificarYRedirigir);
});