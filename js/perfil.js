document.addEventListener("DOMContentLoaded", () => {
  // 1. CARGA DE SESIÓN Y SEGURIDAD
  const storedUser = localStorage.getItem("empleoya_current_user");
  if (!storedUser) { window.location.href = "login.html"; return; }

  const currentUser = JSON.parse(storedUser);
  const vistaUsuario = document.getElementById('userView');
  const vistaEmpresa = document.getElementById('companyView');
  const vistaAdmin = document.getElementById('adminView');

  // ELIMINAR FÍSICAMENTE LAS VISTAS NO PERMITIDAS
  if (currentUser.role === 'candidato') {
    vistaUsuario.style.display = 'block';
    vistaEmpresa.remove(); vistaAdmin.remove();
    initCandidato();
  } else if (currentUser.role === 'empresa') {
    vistaEmpresa.style.display = 'block';
    vistaUsuario.remove(); vistaAdmin.remove();
    initEmpresa();
  } else if (currentUser.role === 'admin') {
    vistaAdmin.style.display = 'block';
    vistaUsuario.remove(); vistaEmpresa.remove();
    initAdmin();
  }

  document.body.style.visibility = 'visible';

  // Logout Universal
  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("empleoya_current_user");
    window.location.href = "index.html";
  });

  // ==========================================
  // LÓGICA DE CANDIDATO
  // ==========================================
  function initCandidato() {
    // Datos Dinámicos
    document.getElementById('txtNombreCabecera').innerText = currentUser.name;
    document.getElementById('txtCorreoCabecera').innerText = currentUser.email;
    document.getElementById('txtAvatar').innerText = currentUser.name.charAt(0) + (currentUser.name.split(' ')[1]?.charAt(0) || '');

    // Cargar Alertas de Prueba
    const mockAlertas = [
      { cargo: "Frontend Engineer", tipo: "Remoto" },
      { cargo: "Java Developer Senior", tipo: "Local" },
      { cargo: "UI/UX Specialist", tipo: "Híbrido" }
    ];
    const contenedor = document.getElementById('contenedorDeAlertas');
    contenedor.innerHTML = mockAlertas.map(a => `
      <div class="job-alert-item d-flex justify-content-between align-items-center">
        <div><strong class="d-block">${a.cargo}</strong><span class="badge bg-primary-subtle text-primary mt-1">${a.tipo}</span></div>
        <button class="btn btn-sm text-danger"><i class="bi bi-x-lg"></i></button>
      </div>
    `).join('');

    // Switch de Edición Básica
    document.getElementById('btnEditarInfo').addEventListener('click', () => {
      document.getElementById('modoLecturaInfo').style.display = 'none';
      document.getElementById('modoEdicionInfo').style.display = 'block';
    });
    document.getElementById('btnCancelarInfo').addEventListener('click', () => {
      document.getElementById('modoLecturaInfo').style.display = 'flex';
      document.getElementById('modoEdicionInfo').style.display = 'none';
    });
    
    // Switch de Perfil Profesional
    document.getElementById('btnEditarPerfil').addEventListener('click', () => {
      document.getElementById('modoLecturaPerfil').style.display = 'none';
      document.getElementById('modoEdicionPerfil').style.display = 'block';
    });
    document.getElementById('btnCancelarEdicion').addEventListener('click', () => {
      document.getElementById('modoLecturaPerfil').style.display = 'block';
      document.getElementById('modoEdicionPerfil').style.display = 'none';
    });
  }

  // ==========================================
  // LÓGICA DE EMPRESA
  // ==========================================
  function initEmpresa() {
    // Candidatos de prueba
    const candidates = [
      { name: "Ana Martínez", match: "98%", title: "Senior React Dev" },
      { name: "Luis Rivera", match: "85%", title: "Full Stack" }
    ];
    document.getElementById('listaCandidatos').innerHTML = candidates.map(c => `
      <div class="list-group-item bg-transparent border-0 px-0 mb-2">
        <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded-4">
          <div><h6 class="fw-bold mb-0">${c.name}</h6><small class="text-muted">${c.title}</small></div>
          <span class="badge bg-success">${c.match} match</span>
        </div>
      </div>
    `).join('');

    // Lista de Vacantes (Simulando persistencia de empresa.js)
    const jobs = [
      { title: "Desarrollador Full Stack", loc: "Remoto", apps: 8 },
      { title: "Diseñador UI/UX", loc: "San Salvador", apps: 15 }
    ];
    document.getElementById('jobsListContainer').innerHTML = jobs.map(j => `
      <div class="card border border-light-subtle rounded-4 p-3 mb-3 hover-shadow">
        <div class="d-flex justify-content-between align-items-center">
          <div><h6 class="fw-bold mb-0">${j.title}</h6><small class="text-muted">${j.loc} · ${j.apps} postulantes</small></div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary rounded-pill">Ver candidatos</button>
            <button class="btn btn-sm btn-outline-danger border-0"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // LÓGICA DE ADMINISTRADOR
  // ==========================================
  function initAdmin() {
    const users = JSON.parse(localStorage.getItem("empleoya_users")) || [];
    document.getElementById('adminUserTable').innerHTML = users.map(u => `
      <tr>
        <td class="ps-4 fw-bold">${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'empresa' ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'} rounded-pill">${u.role}</span></td>
        <td><span class="badge bg-success-subtle text-success">Activo</span></td>
        <td class="text-end pe-4"><button class="btn btn-sm btn-outline-danger border-0"><i class="bi bi-person-slash"></i></button></td>
      </tr>
    `).join('');
  }
});