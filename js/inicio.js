// js/inicio.js
import { API_URL, logout, showToast } from './api.js';

// Cargar Vacantes
async function cargarVacantes() {
    const container = document.getElementById("jobsContainer");
    const jobCountSpan = document.getElementById("jobCount");

    try {
        const res = await fetch(`${API_URL}/vacantes`);
        const vacantes = await res.json();

        jobCountSpan.innerText = `${vacantes.length} empleos`;
        container.innerHTML = vacantes.map(job => `
            <div class="col-md-6 col-lg-4">
              <div class="job-card p-3 h-100 d-flex flex-column" onclick="verDetalles('${job.id}')">
                <div class="d-flex justify-content-between align-items-start">
                  <h6 class="text-primary fw-bold">${job.moneda || 'USD'} ${job.rango_salarial_max || 'A convenir'}</h6>
                  <span class="badge bg-light text-dark rounded-pill">${job.modalidad}</span>
                </div>
                <h5 class="mt-2 fw-bold">${job.titulo_puesto}</h5>
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

        // Manejo de clics en "Postularse"
        document.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                verificarYRedirigir();
            });
        });

    } catch (error) {
        container.innerHTML = `<p class="text-danger text-center w-100">Error al cargar las vacantes.</p>`;
    }
}

// Verificación de Seguridad
const verificarYRedirigir = () => {
    if(!localStorage.getItem('token')) {
        showToast("Crea una cuenta para postularte a empleos o cargar tu CV", "info");
        setTimeout(() => window.location.href = 'registro.html', 1500);
        return false;
    }
    window.location.href = 'candidato-dashboard.html';
    return true;
};

// Configurar Navbar Dinámico
const checkSession = () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const navAuth = document.getElementById('navAuthButtons');
    
    if (!navAuth) return;

    if (token) {
        // USUARIO LOGUEADO
        const url = rol === 'EMPRESA' ? 'empresa.html' : 'candidato-dashboard.html';
        navAuth.innerHTML = `
            <a href="${url}" class="btn btn-primary rounded-pill px-4 fw-bold">Mi Panel</a>
            <button class="btn btn-outline-danger rounded-pill ms-2" id="btnLogout">Salir</button>
        `;
        document.getElementById('btnLogout').addEventListener('click', logout);
    } else {
        // USUARIO NO LOGUEADO (BOTONES DE REGISTRO)
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary rounded-pill px-4 fw-bold border-2">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Registrarse</a>
        `;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    cargarVacantes();
    
    document.getElementById('heroUploadCV')?.addEventListener('click', verificarYRedirigir);
});