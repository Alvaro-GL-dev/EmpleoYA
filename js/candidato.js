import { API_URL, getHeaders, logout, showToast } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem('token') || localStorage.getItem('rol') !== 'CANDIDATO') {
        window.location.href = 'login.html';
        return;
    }

    document.body.classList.remove('body-hidden');
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('formPerfilCandidatoCompleto')?.addEventListener('submit', guardarPerfilCandidato);
    document.getElementById('formNuevaPublicacion')?.addEventListener('submit', guardarNuevaPublicacion);
    document.getElementById('btnCargarCV')?.addEventListener('click', () => {document.getElementById('inputCargarCV').click();});

    // Eventos para la nueva barra de búsqueda
    document.getElementById('cSearchBtn')?.addEventListener('click', filtrarVacantes);
    document.getElementById('cSearchKeyword')?.addEventListener('input', filtrarVacantes);
    document.getElementById('cFilterLocation')?.addEventListener('change', filtrarVacantes);
    

    initTabs();

    const params = new URLSearchParams(window.location.search);
    
    // Abrir pestaña específica si viene en la URL
    const tabToOpen = params.get('tab');
    if (tabToOpen) {
        const tabButton = document.querySelector(`[data-tab="${tabToOpen}"]`);
        if (tabButton) tabButton.click();
    }

    // Abrir modal de vacante si viene en la URL
    const vacanteIdToOpen = params.get('vacante');
    if (vacanteIdToOpen) {
        setTimeout(() => {
            verDetallesVacante(vacanteIdToOpen);
        }, 500);
    }

    cargarPerfilCandidato(); 
    cargarVacantesDisponibles();
    cargarMisPostulaciones(); 
});

function initTabs() {
    const tabs = document.querySelectorAll('#navTabs .nav-link');
    const contents = {
        buscar: document.getElementById('buscarTab'),
        solicitudes: document.getElementById('solicitudesTab'),
        comunidad: document.getElementById('comunidadTab'),
        recursos: document.getElementById('recursosTab'),
        perfil: document.getElementById('perfilTab')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabId = tab.getAttribute('data-tab');
            Object.keys(contents).forEach(key => {
                if(contents[key]) contents[key].style.display = 'none';
            });

            if(contents[tabId]) {
                contents[tabId].style.display = 'block';
                try {
                    if(tabId === 'comunidad') cargarPostsForo();
                    if(tabId === 'recursos') cargarRecursos();
                    if(tabId === 'solicitudes') cargarMisPostulaciones();
                } catch(e) { console.error("Error en datos:", e); }
            }
        });
    });
}

// VACANTES
let todasLasVacantesCandidato = [];

async function cargarVacantesDisponibles() {
    const container = document.getElementById("jobsContainer");
    if(!container) return;

    try {
        const res = await fetch(`${API_URL}/vacantes`, { headers: getHeaders() });
        todasLasVacantesCandidato = await res.json();
        
        mostrarVacantes(todasLasVacantesCandidato);

        // Delegación de eventos (Aseguramos que solo se active una vez)
        if (!container.dataset.listenerAttached) {
            container.addEventListener('click', (e) => {
                const botonPostular = e.target.closest('.btn-postularse');
                if (botonPostular) {
                    const idVacante = botonPostular.getAttribute('data-id');
                    postularseAVacante(idVacante);
                    e.stopPropagation(); 
                    return;
                }

                const card = e.target.closest('.job-card');
                if (card) {
                    const idVacante = card.getAttribute('data-vacante-id');
                    if (idVacante) {
                        verDetallesVacante(idVacante);
                    }
                }
            });
            container.dataset.listenerAttached = 'true';
        }
    } catch (e) {
        container.innerHTML = "Error al cargar vacantes.";
    }
}

function mostrarVacantes(vacantes) {
    const container = document.getElementById("jobsContainer");
    document.getElementById("jobCount").innerText = `${vacantes.length} empleos`;

    if(vacantes.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted fs-5">No se encontraron vacantes con esos filtros.</p></div>';
        return;
    }

    container.innerHTML = vacantes.map(job => `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="job-card p-4 h-100 d-flex flex-column shadow-sm border border-light rounded-4 bg-white" data-vacante-id="${job.id}" style="cursor: pointer;">
            <div class="d-flex justify-content-between mb-2">
                <span class="badge bg-primary bg-opacity-10 text-primary">${job.modalidad}</span>
                <span class="text-success fw-bold small">${job.rango_salarial_max ? '$'+job.rango_salarial_max : 'A convenir'}</span>
            </div>
            <h5 class="fw-bold text-dark mt-2">${job.titulo_puesto}</h5>
                <div class="small text-muted mb-2"><i class="bi bi-building me-1"></i> ${job.empresa_nombre || job.nombre_comercial || job.razon_social || 'Empresa Confidencial'}</div>
            <p class="text-muted small flex-grow-1">${job.descripcion_puesto.substring(0, 90)}...</p>
            <div class="mt-auto pt-3 border-top">
                <button class="btn btn-primary rounded-pill w-100 fw-bold btn-postularse" data-id="${job.id}">
                    Postularme Ahora
                </button>
            </div>
          </div>
        </div>`).join('');
}

function filtrarVacantes() {
    const keyword = document.getElementById('cSearchKeyword').value.toLowerCase();
    const location = document.getElementById('cFilterLocation').value.toLowerCase();

    const filtradas = todasLasVacantesCandidato.filter(job => {
        const titulo = (job.titulo_puesto || '').toLowerCase();
        const empresa = (job.empresa_nombre || job.nombre_comercial || job.razon_social || '').toLowerCase();
        const modalidad = (job.modalidad || '').toLowerCase();
        const ubicacion = (job.ubicacion_especifica || '').toLowerCase();

        // Revisa si la palabra clave coincide con el título o la empresa
        const coincideKeyword = titulo.includes(keyword) || empresa.includes(keyword);
        
        // Revisa si la ubicación coincide con la sede o con modalidades como "Remoto"
        const coincideLocation = location === '' || ubicacion.includes(location) || modalidad.includes(location);

        return coincideKeyword && coincideLocation;
    });

    mostrarVacantes(filtradas);
}

async function postularseAVacante(id) {
    try {
        const res = await fetch(`${API_URL}/postulaciones`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vacante_id: id, vacanteId: id }) 
        });
        if(res.ok) { 
            showToast("¡Te has postulado con éxito!", "success"); 
            cargarMisPostulaciones();
            document.querySelector('[data-tab="solicitudes"]').click();
        } else {
            const data = await res.json();
            showToast(data.error || "Error al postularse", "warning");
        }
    } catch (e) { showToast("Error de conexión", "danger"); }
}

// MIS SOLICITUDES
async function cargarMisPostulaciones() {
    const container = document.getElementById("solicitudesContainer");
    if(!container) return;

    try {
        const res = await fetch(`${API_URL}/postulaciones/mis-postulaciones`, { headers: getHeaders() });
        const data = await res.json();

        container.innerHTML = data.map(post => {
            const estados = {
                'RECIBIDA': { color: 'secondary', step: 1, texto: 'Recibida' },
                'EN_REVISION': { color: 'warning', step: 1, texto: 'En Revisión' },
                'PRUEBA_TECNICA': { color: 'dark', step: 2, texto: 'Prueba Técnica' },
                'ENTREVISTA': { color: 'info', step: 2, texto: 'En Entrevista' },
                'OFERTA': { color: 'success', step: 3, texto: '¡Oferta!' },
                'RECHAZADA': { color: 'danger', step: 0, texto: 'Rechazada' },
                'CONTRATADO': { color: 'success', step: 3, texto: 'Contratado' }
            };
            const info = estados[post.etapa_actual] || estados['RECIBIDA'];

            return `
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="solicitud-card p-4 h-100 shadow-sm border-0 bg-white" style="border-radius: 24px; border-top: 5px solid var(--bs-${info.color}) !important;">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="text-primary fw-bold mb-0 small">${post.empresa_nombre || 'Empresa'}</h6>
                  <span class="badge bg-${info.color} px-2">${info.texto}</span>
                </div>
                <h5 class="fw-bold text-dark mt-2 h6">${post.titulo_puesto}</h5>
                <div class="small text-muted mb-4"><i class="bi bi-geo-alt me-1"></i> ${post.ubicacion_especifica || 'Modalidad Variable'}</div>
                
                ${post.etapa_actual !== 'RECHAZADA' ? `
                <div class="progress-stepper position-relative mb-4 px-2">
                    <div class="step-line"></div>
                    <div class="d-flex justify-content-between position-relative z-1">
                        <div class="step-dot ${info.step >= 1 ? 'active' : ''}"></div>
                        <div class="step-dot ${info.step >= 2 ? 'active' : ''}"></div>
                        <div class="step-dot ${info.step >= 3 ? 'active' : ''}"></div>
                    </div>
                    <div class="d-flex justify-content-between mt-1 px-1">
                        <small class="text-muted" style="font-size: 0.65rem;">Enviada</small>
                        <small class="text-muted" style="font-size: 0.65rem;">Proceso</small>
                        <small class="text-muted" style="font-size: 0.65rem;">Final</small>
                    </div>
                </div>` : `
                <div class="alert alert-danger py-1 small text-center rounded-pill mb-4">Proceso Finalizado</div>`}

                <div class="pt-3 border-top"><small class="text-muted"><i class="bi bi-calendar3"></i> ${new Date(post.fecha_postulacion).toLocaleDateString()}</small></div>
              </div>
            </div>`;
        }).join('');
    } catch (e) { container.innerHTML = "Sin postulaciones."; }
}

// FOROS Y RECURSOS
async function cargarRecursos() {
    const container = document.getElementById("recursosContainer");
    try {
        const res = await fetch(`${API_URL}/recursos`, { headers: getHeaders() });
        const data = await res.json();
        container.innerHTML = data.map(r => `
            <div class="col-md-4 mb-4">
              <div class="recurso-card shadow-sm h-100 bg-white overflow-hidden border-0 rounded-4">
                <div class="bg-light p-5 text-center" style="height: 160px; background-color: #f1f3f9 !important;">
                    <i class="bi bi-journal-text fs-1 text-primary opacity-50"></i>
                </div>
                <div class="p-4">
                  <h6 class="fw-bold text-dark mb-2">${r.titulo}</h6>
                  <p class="text-muted extra-small mb-3">Guía completa para destacar tus fortalezas profesionales.</p>
                  <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="tag-recurso">${r.tipo}</span>
                    <a href="https://developer.chrome.com/docs/devtools/resources?hl=es-419" target="_blank" class="btn btn-link p-0 text-primary fw-bold extra-small text-decoration-none">
                        Ver recurso
                    </a>
                  </div>
                </div>
              </div>
            </div>`).join('');
    } catch (e) { container.innerHTML = "Error al cargar recursos."; }
}

async function cargarPostsForo() {
    const container = document.getElementById("foroPostsContainer");
    try {
        const res = await fetch(`${API_URL}/foros`, { headers: getHeaders() });
        const posts = await res.json();
        container.innerHTML = posts.map(p => `
            <div class="card p-4 mb-3 border-0 shadow-sm rounded-4 bg-white">
                <div class="d-flex gap-3 align-items-center mb-3">
                    <div class="avatar-sm" style="width:35px; height:35px; font-size:0.8rem;">${p.autor_nombre?.[0] || 'U'}</div>
                    <div><h6 class="fw-bold mb-0 small">${p.autor_nombre}</h6><small class="text-muted extra-small">hace 2 horas · <span class="text-primary">${p.categoria || 'General'}</span></small></div>
                </div>
                <h6 class="fw-bold text-dark mb-1">${p.titulo}</h6>
                <p class="small text-muted mb-3">${p.contenido}</p>
                <div class="d-flex gap-4 border-top pt-3">
                    <span class="extra-small text-muted"><i class="bi bi-chat-left me-1"></i> ${p.num_respuestas || 0} respuestas</span>
                    <span class="extra-small text-muted"><i class="bi bi-hand-thumbs-up me-1"></i> ${p.votos || 0} votos</span>
                </div>
            </div>`).join('');
    } catch (e) { container.innerHTML = "Error al cargar comunidad."; }
}

async function cargarPerfilCandidato() {
    try {
        const res = await fetch(`${API_URL}/candidatos/mi-perfil`, { headers: getHeaders() });
        if (!res.ok) return;
        
        const data = await res.json();
        
        // 1. Llenar la Tarjeta Visual (Izquierda)
        if(document.getElementById('visualName')) {
            document.getElementById('visualName').innerText = `${data.nombres || ''} ${data.apellidos || ''}`.trim() || 'Candidato';
        }
        if(document.getElementById('visualTitle')) {
            document.getElementById('visualTitle').innerText = data.titular_profesional || 'Profesión no especificada';
        }
        if(document.getElementById('visualResumen')) {
            document.getElementById('visualResumen').innerText = data.resumen_biografico || 'Aún no has añadido un resumen.';
        }
        if(document.getElementById('metricVistas')) {
            document.getElementById('metricVistas').innerHTML = `<i class="bi bi-eye"></i> ${data.vistas_perfil || 0} Vistas`;
        }

        // 2. Llenar las "Píldoras" de Habilidades (Opcional pero recomendado para el UI)
        const skillsContainer = document.getElementById('visualSkillsContainer');
        if (skillsContainer) {
            if (data.habilidades_tecnicas && data.habilidades_tecnicas.length > 0) {
                skillsContainer.innerHTML = data.habilidades_tecnicas
                    .map(skill => `<span class="skill-pill">${skill}</span>`)
                    .join('');
            } else {
                skillsContainer.innerHTML = '';
            }
        }
        
        // 3. Llenar los campos del Formulario (Derecha)
        document.getElementById('cNombres').value = data.nombres || '';
        document.getElementById('cApellidos').value = data.apellidos || '';
        document.getElementById('cProfesion').value = data.titular_profesional || '';
        document.getElementById('cHabilidades').value = data.habilidades_tecnicas ? data.habilidades_tecnicas.join(', ') : '';
        document.getElementById('cResumen').value = data.resumen_biografico || '';
        document.getElementById('cTelefono').value = data.telefono_contacto || '';
        document.getElementById('cEmail').value = data.correo_electronico || data.usuario?.correo_electronico || '';

        if(data.fecha_nacimiento) {
            document.getElementById('cNacimiento').value = new Date(data.fecha_nacimiento).toISOString().split('T')[0];
        } else {
            document.getElementById('cNacimiento').value = '';
        }
                
    } catch (e) { 
        console.error("Error al cargar perfil:", e); 
    }
}

async function guardarPerfilCandidato(e) {
    e.preventDefault();
    
    const habilidadesInput = document.getElementById('cHabilidades').value;
    const habilidadesArray = habilidadesInput ? habilidadesInput.split(',').map(s => s.trim()).filter(Boolean) : [];

    const payload = {
        nombres: document.getElementById('cNombres').value,
        apellidos: document.getElementById('cApellidos').value,
        titular_profesional: document.getElementById('cProfesion').value,
        resumen_biografico: document.getElementById('cResumen').value,
        habilidades_tecnicas: habilidadesArray,
        telefono_contacto: document.getElementById('cTelefono').value,
        fecha_nacimiento: document.getElementById('cNacimiento').value || null
    };

    try {
        const res = await fetch(`${API_URL}/candidatos/mi-perfil`, { 
            method: 'POST',
            headers: getHeaders(), 
            body: JSON.stringify(payload) 
        });

        if(res.ok) { 
            showToast("Perfil actualizado correctamente", "success"); 
            cargarPerfilCandidato(); 
        } else {
            const data = await res.json();
            showToast(data.error || "Error al actualizar perfil", "danger");
        }
    } catch (e) { 
        showToast("Error de conexión con el servidor", "danger"); 
    }
}

async function guardarNuevaPublicacion(e) {
    e.preventDefault();
    
    const payload = {
        titulo: document.getElementById('postTitulo').value,
        contenido: document.getElementById('postContenido').value,
        categoria: document.getElementById('postCategoria').value
    };

    try {
        const res = await fetch(`${API_URL}/foros`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("¡Tu publicación ha sido compartida!", "success");
            
            // 1. Limpiar el formulario
            document.getElementById('formNuevaPublicacion').reset();
            
            // 2. Cerrar el modal
            const modalElement = document.getElementById('modalCrearPost');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            
            // 3. Recargar el foro para ver la nueva publicación
            cargarPostsForo();
        } else {
            const data = await res.json();
            showToast(data.error || "Error al crear post", "danger");
        }
    } catch (error) {
        showToast("Error de conexión con el servidor", "danger");
    }
}

async function verDetallesVacante(vacanteId) {
    try {
        // Pedimos al backend toda la info 
        const res = await fetch(`${API_URL}/vacantes/${vacanteId}`, { headers: getHeaders() });
        const v = await res.json();

        // Llenamos los datos del Trabajo
        document.getElementById('detVacanteTitulo').innerText = v.titulo_puesto;
        document.getElementById('detEmpresaNombre').innerText = v.nombre_comercial || v.razon_social;
        document.getElementById('detVacanteUbicacion').innerText = v.ubicacion_especifica || 'No especificada';
        document.getElementById('detVacanteModalidad').innerText = v.modalidad;
        document.getElementById('detVacanteDesc').innerText = v.descripcion_puesto;
        document.getElementById('detVacanteReq').innerText = v.requisitos;
        document.getElementById('detVacanteSalario').innerText = v.rango_salarial_max ? `$${v.rango_salarial_max}` : 'Sueldo competitivo';

        // Llenamos los datos del Perfil de Empresa
        document.getElementById('perfilEmpresaNombre').innerText = v.razon_social;
        document.getElementById('perfilEmpresaDesc').innerText = v.descripcion_empresa || 'Sin descripción disponible.';
        document.getElementById('perfilEmpresaSede').innerText = v.ubicacion_sede || 'San Salvador';
        document.getElementById('perfilEmpresaWeb').innerText = v.sitio_web || 'No disponible';
        document.getElementById('perfilEmpresaWeb').href = v.sitio_web || '#';
        document.getElementById('detEmpresaLogo').src = v.url_logo || 'img/default-company.png';

        const btnAplicar = document.getElementById('btnAplicarYa');
        btnAplicar.onclick = () => {
            postularseAVacante(vacanteId);
            
            const modalElement = document.getElementById('modalDetalleVacante');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if(modalInstance) modalInstance.hide();
        };
        // ------------------------------------------------

        // Mostramos el modal
        let modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalleVacante'));
        if (!modal) {
            modal = new bootstrap.Modal(document.getElementById('modalDetalleVacante'));
        }
        modal.show();
        
        document.getElementById('tab-trabajo').click();

    } catch (error) {
        showToast("No se pudo cargar la información", "danger");
    }
}

document.getElementById('inputCargarCV')?.addEventListener('change', (e) => {
    if(e.target.files.length > 0) {
        const nombreArchivo = e.target.files[0].name;
        showToast(`CV seleccionado: ${nombreArchivo}`, "success");
    }
});