import { API_URL, getHeaders, logout, showToast } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  // Si no está logueado o si intenta entrar un Candidato, lo mandamos al login
  if (!token || rol !== 'EMPRESA') { 
      window.location.href = "login.html"; 
      return; 
  }

  // Mostrar el Dashboard de Empresa
  document.getElementById('companyDashboard').style.display = 'block';
  document.body.style.visibility = 'visible';
  
  document.getElementById("btnLogout")?.addEventListener("click", logout);
  document.getElementById('formPerfilEmpresaDashboard')?.addEventListener('submit', actualizarPerfilEmpresa);

  // Cargar datos
  cargarDatosEmpresa();
  cargarDashboardStats();
});
// ======================== FUNCIONES DE ALEXTECH ========================

async function cargarDatosEmpresa() {
    try {
        const res = await fetch(`${API_URL}/empresas/mi-empresa`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) {
            // Llenar inputs
            document.getElementById('compNombre').value = data.nombre_comercial || '';
            document.getElementById('compWeb').value = data.sitio_web || '';
            document.getElementById('compUbicacion').value = data.ubicacion || '';
            document.getElementById('compDesc').value = data.descripcion || '';
            
            // Actualizar saludo dinámico
            const name = data.nombre_comercial || data.razon_social || 'AlexTech';
            document.getElementById('dashboardTitle').innerText = name;
        }
    } catch (e) { console.error("Error al cargar datos"); }
}

async function cargarDashboardStats() {
    const container = document.getElementById("jobsListContainer");
    const activeJobsSpan = document.getElementById("activeJobsCount");

    try {
        const res = await fetch(`${API_URL}/vacantes`, { headers: getHeaders() });
        const vacantes = await res.json();

        if (Array.isArray(vacantes)) {
            activeJobsSpan.innerText = vacantes.length;
            
            if (vacantes.length === 0) {
                container.innerHTML = `<p class="text-muted text-center py-5">Sin vacantes publicadas.</p>`;
                return;
            }

            container.innerHTML = vacantes.slice(0, 4).map(v => `
                <div class="d-flex justify-content-between align-items-center p-3 mb-3 bg-white rounded-4 border hover-shadow transition shadow-sm">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box bg-primary-soft text-primary"><i class="bi bi-lightning-fill"></i></div>
                        <div>
                            <h6 class="fw-bold mb-0 small">${v.titulo_puesto}</h6>
                            <p class="mb-0 extra-small text-muted">${v.modalidad} · ${v.ubicacion_especifica || 'Global'}</p>
                        </div>
                    </div>
                    <span class="badge bg-success-soft text-success rounded-pill px-3 py-2 extra-small fw-bold">ACTIVA</span>
                </div>
            `).join('');
        }
    } catch (e) { container.innerHTML = "Error de conexión"; }
}

async function actualizarPerfilEmpresa(e) {
    e.preventDefault();
    showToast("Sincronizando con el servidor...", "info");

    // MAPEAMOS LOS CAMPOS AL NOMBRE QUE PIDE EL BACKEND
    const payload = {
        razon_social: document.getElementById('compNombre').value,
        nombre_comercial: document.getElementById('compNombre').value, // o un campo separado si lo tienes
        sitio_web: document.getElementById('compWeb').value,
        ubicacion_sede: document.getElementById('compUbicacion').value,
        descripcion_empresa: document.getElementById('compDesc').value,
        // Opcionales: nit_o_registro, url_logo (pueden quedar null)
    };

    try {
        const res = await fetch(`${API_URL}/empresas/mi-empresa`, {
            method: 'POST', 
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("¡Datos de AlexTech actualizados!", "success");
            // Actualizar el nombre en el saludo
            document.getElementById('dashboardTitle').innerText = payload.razon_social;
        } else {
            const errorData = await res.json();
            // Esto mostrará el error específico si algo más falta
            showToast(errorData.error || "Error de validación", "danger");
        }
    } catch (e) {
        console.error("Error de red:", e);
        showToast("Error de conexión con el servidor", "danger");
    }
}

async function cargarPerfilCandidato() {
  try {
    const res = await fetch(`${API_URL}/candidatos/mi-perfil`, { headers: getHeaders() });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) {
      if (res.status === 404) {
        console.log("Perfil aún no creado, mostrando formulario vacío.");
        return; // Es normal si es nuevo
      }
      throw new Error("Error al cargar perfil");
    }
    const data = await res.json();
    // Llenar campos
    document.getElementById('cNombres').value = data.nombres || '';
    document.getElementById('cApellidos').value = data.apellidos || '';
    document.getElementById('cTelefono').value = data.telefono_contacto || '';
    document.getElementById('cFechaNac').value = data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '';
    document.getElementById('cProfesion').value = data.titular_profesional || '';
    document.getElementById('cCV').value = data.url_curriculum_pdf || '';
    document.getElementById('cFoto').value = data.foto_perfil_url || '';
    document.getElementById('cResumen').value = data.resumen_biografico || '';
    // Habilidades: unir array con comas
    if (data.habilidades_tecnicas && Array.isArray(data.habilidades_tecnicas)) {
      document.getElementById('cHabilidades').value = data.habilidades_tecnicas.join(', ');
    } else {
      document.getElementById('cHabilidades').value = '';
    }
  } catch (error) {
    console.error("Error cargando perfil candidato:", error);
    showToast("No se pudo cargar tu perfil", "danger");
  }
}

async function guardarPerfilCandidato(e) {
  e.preventDefault();
  const habilidadesInput = document.getElementById('cHabilidades').value;
  const habilidadesArr = habilidadesInput ? habilidadesInput.split(',').map(s => s.trim()) : [];

  const payload = {
    nombres: document.getElementById('cNombres').value,
    apellidos: document.getElementById('cApellidos').value,
    telefono_contacto: document.getElementById('cTelefono').value || null,
    fecha_nacimiento: document.getElementById('cFechaNac').value || null,
    titular_profesional: document.getElementById('cProfesion').value,
    resumen_biografico: document.getElementById('cResumen').value || null,
    url_curriculum_pdf: document.getElementById('cCV').value || null,
    foto_perfil_url: document.getElementById('cFoto').value || null,
    habilidades_tecnicas: habilidadesArr
  };

  try {
    const res = await fetch(`${API_URL}/candidatos/mi-perfil`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Perfil actualizado exitosamente", "success");
    } else {
      showToast(data.error || "Error al guardar", "danger");
    }
  } catch (error) {
    showToast("Error de conexión", "danger");
  }
}