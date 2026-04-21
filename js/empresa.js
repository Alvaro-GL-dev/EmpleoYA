import { API_URL, getHeaders, logout, showToast } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (!token || rol !== 'EMPRESA') { 
        window.location.href = 'login.html'; 
        return; 
    }

    document.body.style.visibility = 'visible';
    
    initTabs();
    cargarMisVacantes();
    cargarPerfilEmpresa();

    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formNuevaVacante')?.addEventListener('submit', guardarVacante);
    document.getElementById('searchVacante')?.addEventListener('input', filtrarVacantesLocal);

    // Limpiar el modal al cerrarlo para volver a modo "Crear"
    document.getElementById('modalVacante').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formNuevaVacante').reset();
        document.getElementById('vVacanteId').value = '';
        document.querySelector('#modalVacante .modal-title').innerText = "Publicar Vacante";
        document.getElementById('btnSubmitVacante').innerText = "Guardar Información";
    });
});

// GESTIÓN DE TABS 
function initTabs() {
    const tabs = document.querySelectorAll('#navTabs .nav-link, #navTabs button');
    const contents = { 
        vacantes: document.getElementById('vacantesTab'), 
        candidatos: document.getElementById('candidatosTab'), 
        perfil: document.getElementById('perfilTab') 
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if(!tabId) return;
            Object.keys(contents).forEach(key => { if(contents[key]) contents[key].style.display = 'none'; });
            if(contents[tabId]) contents[tabId].style.display = 'block';
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

// CRUD VACANTES 
async function cargarMisVacantes() {
    const container = document.getElementById("vacantesContainer");
    try {
        const res = await fetch(`${API_URL}/vacantes/mis-vacantes`, { headers: getHeaders() });
        const vacantes = await res.json();
        
        if (!Array.isArray(vacantes) || vacantes.length === 0) { 
            container.innerHTML = '<div class="text-center w-100 py-5"><p class="text-muted">No tienes vacantes activas.</p></div>'; 
            return; 
        }

        container.innerHTML = vacantes.map(job => `
            <div class="col-md-6 col-lg-4">
              <div class="job-card p-4 h-100 shadow-sm d-flex flex-column bg-white border">
                <div class="d-flex justify-content-between mb-3">
                    <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">${job.modalidad}</span>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted p-0 border-0" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical fs-5"></i></button>
                        <ul class="dropdown-menu shadow border-0">
                            <li><button class="dropdown-item" onclick="window.abrirEdicion('${encodeURIComponent(JSON.stringify(job))}')"><i class="bi bi-pencil me-2"></i>Editar</button></li>
                            <li><button class="dropdown-item text-danger" onclick="window.eliminarVacante('${job.id}')"><i class="bi bi-trash me-2"></i>Eliminar</button></li>                        </ul>
                    </div>
                </div>
                <h5 class="fw-bold">${job.titulo_puesto}</h5>
                <p class="text-muted small mb-4">${job.descripcion_puesto.substring(0, 85)}...</p>
                <div class="mt-auto border-top pt-3">
                    <button class="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold" onclick="window.verPostulantes('${job.id}', '${job.titulo_puesto}')">
                        <i class="bi bi-people me-1"></i> Ver Postulantes
                    </button>
                </div>
              </div>
            </div>`).join('');
    } catch (e) { container.innerHTML = "Error de conexión con el servidor."; }
}

async function guardarVacante(e) {
    e.preventDefault();
    const id = document.getElementById('vVacanteId').value;
    
    const payload = {
        titulo_puesto: document.getElementById('vTitulo').value,
        modalidad: document.getElementById('vModalidad').value,
        descripcion_puesto: document.getElementById('vDescripcion').value,
        requisitos: document.getElementById('vRequisitos').value,
        ubicacion_especifica: document.getElementById('vUbicacion').value,
        rango_salarial_min: parseFloat(document.getElementById('vSalarioMin').value) || null,
        rango_salarial_max: parseFloat(document.getElementById('vSalarioMax').value) || null,
        beneficios: document.getElementById('vBeneficios').value
    };

    try {
        const url = id ? `${API_URL}/vacantes/${id}` : `${API_URL}/vacantes`;
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            showToast(id ? "Vacante actualizada" : "Vacante publicada", "success");
            bootstrap.Modal.getInstance(document.getElementById('modalVacante')).hide();
            cargarMisVacantes();
        } else {
            const data = await res.json();
            showToast(data.error || "Error al procesar", "danger");
        }
    } catch (e) { showToast("Error de red", "danger"); }
}

window.verPostulantes = async (vacanteId, titulo) => {
    document.getElementById("tabCandidatos").click();
    document.getElementById("tituloVacanteCandidatos").innerHTML = `Gestión: <span class="text-primary">${titulo}</span>`;
    const container = document.getElementById("candidatosContainer");
    container.innerHTML = '<div class="text-center w-100 py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const res = await fetch(`${API_URL}/postulaciones/vacante/${vacanteId}/postulantes`, { headers: getHeaders() });
        const data = await res.json();
        const lista = Array.isArray(data.postulantes) ? data.postulantes : [];

        const etapas = ['RECIBIDA', 'EN_REVISION', 'PRUEBA_TECNICA', 'ENTREVISTA', 'OFERTA', 'RECHAZADA', 'CONTRATADO'];
        const colores = { 
            'RECIBIDA': 'secondary', 'EN_REVISION': 'warning', 'PRUEBA_TECNICA': 'dark', 
            'ENTREVISTA': 'info', 'OFERTA': 'primary', 'RECHAZADA': 'danger', 'CONTRATADO': 'success' 
        };

        if (lista.length === 0) { container.innerHTML = '<p class="text-center w-100 py-5 text-muted">Sin candidatos postulados aún.</p>'; return; }

        container.innerHTML = lista.map(p => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="candidate-card p-4 shadow-sm border bg-white h-100" data-candidato-id="${p.candidato_id}" style="cursor: pointer;">
        <div class="d-flex align-items-center gap-3 mb-3">
            <div class="avatar-sm bg-primary bg-opacity-10 text-primary rounded-circle"><i class="bi bi-person-fill"></i></div>
            <div><h6 class="fw-bold mb-0">${p.nombres} ${p.apellidos}</h6><small class="text-muted">${p.titular_profesional || 'Postulante'}</small></div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3"><small class="fw-bold text-muted">Fase actual:</small><span class="badge bg-${colores[p.etapa_actual]}">${p.etapa_actual.replace('_', ' ')}</span></div>
        <div class="pipeline-grid mb-3">
            ${etapas.map(et => {
                const active = p.etapa_actual === et;
                return `<button class="btn btn-pipeline ${active ? 'btn-' + colores[et] : 'btn-outline-' + colores[et]}" 
                        onclick="window.actualizarEstado('${p.postulacion_id}', '${et}', '${vacanteId}', '${titulo}')">${et.replace('_',' ')}</button>`;
            }).join('')}
        </div>
        <div class="pt-3 border-top"><a href="${p.url_curriculum_pdf || '#'}" target="_blank" class="small fw-bold text-decoration-none">Ver CV <i class="bi bi-box-arrow-up-right me-1"></i></a></div>
      </div>
    </div>`).join('');


container.addEventListener('click', (e) => {
    // Si el clic fue en un botón o enlace, no abrir el modal
    if (e.target.closest('button') || e.target.closest('a')) {
        return;
    }
    
    
    const card = e.target.closest('.candidate-card');
    if (card) {
        const candidatoId = card.getAttribute('data-candidato-id');
        if (candidatoId) {
            verPerfilCandidato(candidatoId);
        }
    }
});
    } catch (e) { container.innerHTML = "Error al cargar candidatos."; }
};

window.actualizarEstado = async (id, est, vacId, tit) => {
    try {
        const res = await fetch(`${API_URL}/postulaciones/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ etapa_actual: est }) });
        if(res.ok) { showToast(`Candidato movido a ${est}`, "success"); window.verPostulantes(vacId, tit); }
    } catch (e) { showToast("Error de conexión", "danger"); }
};

// AUXILIARES 
window.abrirEdicion = (vStr) => {
    const v = JSON.parse(decodeURIComponent(vStr));
    document.getElementById('vVacanteId').value = v.id;
    document.getElementById('vTitulo').value = v.titulo_puesto;
    document.getElementById('vModalidad').value = v.modalidad;
    document.getElementById('vDescripcion').value = v.descripcion_puesto;
    document.getElementById('vRequisitos').value = v.requisitos;
    document.getElementById('vBeneficios').value = v.beneficios || '';
    document.getElementById('vUbicacion').value = v.ubicacion_especifica || '';
    document.getElementById('vSalarioMin').value = v.rango_salarial_min || '';
    document.getElementById('vSalarioMax').value = v.rango_salarial_max || '';
    
    document.querySelector('#modalVacante .modal-title').innerText = "Editar Vacante";
    document.getElementById('btnSubmitVacante').innerText = "Guardar Cambios";
    new bootstrap.Modal(document.getElementById('modalVacante')).show();
};

window.eliminarVacante = async (id) => {
    if(!confirm("¿Estás seguro de ELIMINAR esta vacante permanentemente? Esto borrará también a todos los candidatos postulados a ella.")) return;
    
    try {
        const res = await fetch(`${API_URL}/vacantes/${id}`, { 
            method: 'DELETE', 
            headers: getHeaders() 
        });
        
        if(res.ok) { 
            showToast("Vacante y postulaciones eliminadas permanentemente", "success"); 
            cargarMisVacantes(); 
        } else {
            const data = await res.json();
            showToast(data.error || "Error al eliminar la vacante", "danger");
        }
    } catch (e) { 
        showToast("Error de conexión al intentar eliminar", "danger"); 
    }
};

async function cargarPerfilEmpresa() {
    try {
        const res = await fetch(`${API_URL}/empresas/mi-empresa`, { headers: getHeaders() });
        
        if (res.ok) {
            const data = await res.json();
            
            const nombreEmpresa = data.nombre_comercial || data.razon_social || 'Mi Empresa';
            
            // Actualizamos el Navbar
            const displayElement = document.getElementById('companyNameDisplay');
            if (displayElement) {
                displayElement.innerText = nombreEmpresa;
            }
        }
    } catch (e) {
        console.error("Error al cargar el perfil de la empresa:", e);
    }
}

function filtrarVacantesLocal(e) {
    const texto = e.target.value.toLowerCase();
    document.querySelectorAll('#vacantesContainer > div').forEach(card => {
        const titulo = card.querySelector('h5').innerText.toLowerCase();
        card.style.display = titulo.includes(texto) ? 'block' : 'none';
    });
}

// Función para cargar y mostrar el perfil 
async function verPerfilCandidato(candidatoId) {
    try {
        // Obtener datos del candidato
        const res = await fetch(`${API_URL}/candidatos/${candidatoId}`, {
            headers: getHeaders()
        });
        
        if (!res.ok) {
            showToast("No se pudo cargar el perfil del candidato", "danger");
            return;
        }
        
        const data = await res.json();
        
        // Llenar datos básicos
        document.getElementById('perfilCandidatoNombre').innerText = `${data.nombres} ${data.apellidos}`;
        document.getElementById('perfilCandidatoTitular').innerText = data.titular_profesional || 'Sin título profesional';
        document.getElementById('perfilCandidatoResumen').innerText = data.resumen_biografico || 'Este candidato aún no ha añadido un resumen profesional.';
        document.getElementById('perfilCandidatoTelefono').innerText = data.telefono_contacto || 'No registrado';
        document.getElementById('perfilCandidatoCorreo').innerText = data.usuario?.correo_electronico || 'No disponible';
        document.getElementById('perfilCandidatoNacimiento').innerText = data.fecha_nacimiento 
            ? new Date(data.fecha_nacimiento).toLocaleDateString() 
            : 'No especificada';
        document.getElementById('perfilCandidatoVistas').innerText = data.vistas_perfil || 0;
        
        // Avatar con iniciales
        const avatarDiv = document.getElementById('perfilCandidatoAvatar');
        avatarDiv.innerText = `${data.nombres?.[0] || ''}${data.apellidos?.[0] || ''}`;
        
        // Habilidades
        const habilidadesContainer = document.getElementById('perfilCandidatoHabilidades');
        if (data.habilidades_tecnicas && data.habilidades_tecnicas.length > 0) {
            habilidadesContainer.innerHTML = data.habilidades_tecnicas.map(h => 
                `<span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">${h}</span>`
            ).join('');
        } else {
            habilidadesContainer.innerHTML = '<span class="text-muted small">No ha especificado habilidades</span>';
        }
        
        // CV
        const btnCV = document.getElementById('btnVerCVCompleto');
        if (data.url_curriculum_pdf) {
            btnCV.href = data.url_curriculum_pdf;
            btnCV.classList.remove('disabled');
        } else {
            btnCV.href = '#';
            btnCV.classList.add('disabled');
            btnCV.setAttribute('aria-disabled', 'true');
        }
        
        // Registrar vista del perfil (para estadísticas)
        fetch(`${API_URL}/candidatos/${candidatoId}/vista`, {
            method: 'POST',
            headers: getHeaders()
        }).catch(err => console.warn("No se pudo registrar la vista:", err));
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalPerfilCandidato'));
        modal.show();
        
    } catch (error) {
        console.error("Error cargando perfil:", error);
        showToast("Error de conexión al cargar el perfil", "danger");
    }
}

// Hacer la función accesible globalmente para el onclick inline (aunque usaremos delegación)
window.verPerfilCandidato = verPerfilCandidato;