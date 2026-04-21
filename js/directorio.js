import { API_URL, logout } from './api.js';

let todasLasEmpresas = [];
let todasLasVacantes = [];

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    cargarDirectorio();

    // Evento para el buscador en tiempo real
    document.getElementById('buscarEmpresa')?.addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase();
        const filtradas = todasLasEmpresas.filter(emp => emp.nombre.toLowerCase().includes(texto));
        renderizarTarjetas(filtradas);
    });
});

async function cargarDirectorio() {
    const container = document.getElementById("directorioContainer");

    try {
        // Obtenemos todas las vacantes para saber qué empresas están activas
        const res = await fetch(`${API_URL}/vacantes`);
        const vacantes = await res.json();

        // Agrupar vacantes por empresa
        const empresasMap = {};
        todasLasVacantes = vacantes;
        
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

        // Convertir a arreglo y ordenar alfabéticamente
        todasLasEmpresas = Object.values(empresasMap).sort((a, b) => a.nombre.localeCompare(b.nombre));

        renderizarTarjetas(todasLasEmpresas);

    } catch (error) {
        container.innerHTML = `<div class="col-12"><p class="text-danger text-center w-100">Error al cargar el directorio.</p></div>`;
    }
}

function renderizarTarjetas(empresasArray) {
    const container = document.getElementById("directorioContainer");

    if (empresasArray.length === 0) {
        container.innerHTML = `<div class="col-12"><p class="text-muted text-center py-5">No se encontraron empresas con ese nombre.</p></div>`;
        return;
    }

    container.innerHTML = empresasArray.map(empresa => `
        <div class="col-md-4 col-lg-3">
          <div class="card p-4 border-0 shadow-sm rounded-4 h-100 text-center card-custom transition-hover">
            <div class="mx-auto mb-3">
                ${empresa.logo 
                    ? `<img src="${empresa.logo}" class="rounded-circle shadow-sm" style="width: 80px; height: 80px; object-fit: cover; border: 3px solid white;">`
                    : `<div class="rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center text-white fw-bold fs-2" style="width: 80px; height: 80px; background: linear-gradient(135deg, #0d6efd, #0b5ed7); border: 3px solid white;">${empresa.nombre.charAt(0)}</div>`
                }
            </div>
            <h5 class="fw-bold text-dark mb-1 text-truncate" title="${empresa.nombre}">${empresa.nombre}</h5>
            <p class="text-muted small mb-3"><i class="bi bi-geo-alt-fill text-primary opacity-75 me-1"></i>${empresa.ubicacion}</p>
            <div class="mt-auto pt-3 border-top">
                <button onclick="window.verVacantesEmpresa('${empresa.nombre}')" class="btn btn-outline-primary rounded-pill w-100 fw-bold btn-sm">
                    Ver ${empresa.cantidadVacantes} vacante(s)
                </button>
            </div>
          </div>
        </div>
    `).join('');
}


window.verVacantesEmpresa = (nombreEmpresa) => {
    const container = document.getElementById('listaVacantesEmpresa');
    document.getElementById('modalVacantesTitulo').innerText = `Oportunidades en ${nombreEmpresa}`;

    //Filtrar las vacantes que le pertenecen a esta empresa exacta
    const vacantesFiltradas = todasLasVacantes.filter(job => {
        const nombre = job.empresa_nombre || job.nombre_comercial || job.razon_social || 'Empresa Confidencial';
        return nombre === nombreEmpresa;
    });

    //Dibujar mini-tarjetas para cada vacante
    if (vacantesFiltradas.length === 0) {
        container.innerHTML = '<p class="text-muted w-100 text-center py-4">No hay vacantes públicas en este momento.</p>';
    } else {

    container.innerHTML = vacantesFiltradas.map(job => `
        <div class="col-md-6">
            <a href="candidato-dashboard.html?tab=buscar&vacante=${job.id}" class="text-decoration-none">
                <div class="card p-3 border rounded-4 h-100 shadow-sm transition-hover" style="background-color: #f8fafc; cursor: pointer;">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-primary bg-opacity-10 text-primary">${job.modalidad}</span>
                        <span class="text-success fw-bold small">${job.rango_salarial_max ? '$'+job.rango_salarial_max : 'A convenir'}</span>
                    </div>
                    <h6 class="fw-bold mb-1 text-dark">${job.titulo_puesto}</h6>
                    <p class="text-muted extra-small mb-3"><i class="bi bi-geo-alt-fill me-1 opacity-75"></i>${job.ubicacion_especifica || 'Ubicación no especificada'}</p>
                    <div class="btn btn-primary btn-sm rounded-pill w-100 fw-bold mt-auto shadow-sm">Ver detalles y aplicar</div>
                </div>
            </a>
        </div>
    `).join('');
    }

    //Abrir el modal usando Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('modalVacantesEmpresa'));
    modal.show();
};

// Configurar Navbar Dinámico
const checkSession = () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const navAuth = document.getElementById('navAuthButtons');
    const navDinamico = document.getElementById('navDinamico');
    
    if (!navAuth || !navDinamico) return;

    if (token) {
        const urlDashboard = rol === 'EMPRESA' ? 'empresa.html' : 'candidato-dashboard.html';
        navAuth.innerHTML = `
            <div class="text-end d-none d-md-block border-start ps-3 ms-2 me-2">
                <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 700;">SESIÓN INICIADA</small>
                <span class="fw-bold text-primary" style="font-size: 0.85rem;">${rol}</span>
            </div>
            <button class="btn btn-outline-danger rounded-pill px-3 btn-sm" id="btnLogout" title="Cerrar sesión">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        `;
        document.getElementById('btnLogout').addEventListener('click', logout);

        // MENÚ DINÁMICO
        if (rol === 'CANDIDATO') {
            // --- AQUÍ REEMPLAZAMOS LOS BOTONES DE SESIÓN PARA AGREGAR EL DE CV ---
            navAuth.innerHTML = `
                <button class="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm me-2" id="btnCargarCVDirec">
                    <i class="bi bi-cloud-upload me-1"></i> Cargar CV
                </button>
                <input type="file" id="inputCargarCVDirec" accept=".pdf,.doc,.docx" class="d-none">

                <div class="text-end d-none d-md-block border-start ps-3 ms-1 me-2">
                    <small class="text-muted d-block" style="font-size: 0.7rem; font-weight: 700;">SESIÓN INICIADA</small>
                    <span class="fw-bold text-primary" style="font-size: 0.85rem;">CANDIDATO</span>
                </div>
                <button class="btn btn-outline-danger rounded-pill px-3 btn-sm" id="btnLogout" title="Cerrar sesión">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            `;
            
            // Volvemos a atar el evento de logout porque reescribimos el innerHTML
            document.getElementById('btnLogout').addEventListener('click', logout);

            // Le damos vida al botón de Cargar CV
            document.getElementById('btnCargarCVDirec')?.addEventListener('click', () => {
                document.getElementById('inputCargarCVDirec').click();
            });

            document.getElementById('inputCargarCVDirec')?.addEventListener('change', (e) => {
                if(e.target.files.length > 0) {
                    const nombre = e.target.files[0].name;
                    // Llama a showToast si lo importas al inicio, o usa alert temporal
                    alert(`CV seleccionado: ${nombre}`); 
                }
            });
            
            // TUS ENLACES DE CANDIDATO (ALINEADOS A LA IZQUIERDA GRACIAS AL me-auto DE HTML)
            navDinamico.innerHTML = `
                <li class="nav-item"><a href="candidato-dashboard.html?tab=buscar" class="nav-link">Buscar Empleos</a></li>
                <li class="nav-item"><a href="directorio.html" class="nav-link active">Empresas</a></li>
                <li class="nav-item"><a href="candidato-dashboard.html?tab=solicitudes" class="nav-link">Mis solicitudes</a></li>
                <li class="nav-item"><a href="candidato-dashboard.html?tab=recursos" class="nav-link">Recursos</a></li>
                <li class="nav-item"><a href="candidato-dashboard.html?tab=comunidad" class="nav-link">Foros</a></li>
                <li class="nav-item"><a href="candidato-dashboard.html?tab=perfil" class="nav-link">Mi perfil</a></li>
            `;
        } else if (rol === 'EMPRESA') {
            // La empresa ve su panel + Directorio
            navDinamico.innerHTML = `
                <li class="nav-item"><a href="empresa.html" class="nav-link">Mis Vacantes</a></li>
                <li class="nav-item"><a href="empresa.html" class="nav-link">Candidatos</a></li>
                <li class="nav-item"><a href="directorio.html" class="nav-link active">Directorio</a></li>
                <li class="nav-item"><a href="perfil.html" class="nav-link">Perfil Empresarial</a></li>
            `;
        }
    } else {
        // USUARIO INVITADO
        navDinamico.innerHTML = `
            <li class="nav-item"><a href="index.html" class="nav-link">Inicio</a></li>
            <li class="nav-item"><a href="index.html#ofertas" class="nav-link">Buscar Empleos</a></li>
            <li class="nav-item"><a href="directorio.html" class="nav-link active">Empresas</a></li>
        `;
        navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary rounded-pill px-4 btn-sm fw-bold">Iniciar Sesión</a>
            <a href="registro.html" class="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm">Registrarse</a>
        `;
    }
};