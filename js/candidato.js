// ======================== DATOS DEL USUARIO LOGUEADO ========================
let currentUser = null;
let userApplications = [];

const jobsDatabase = [
  // ... (mismo array que en inicio.js)
  { id: 1, title: "Consultor de Gestión del Cambio SAP", company: "IBM", location: "San Salvador", type: "Tiempo completo", description: "Liderar iniciativas de transformación empresarial y gestión del cambio para clientes globales.", salary: "USD 1800 - 2200", featured: true },
  { id: 2, title: "Desarrollador Full Stack (React + Node)", company: "TechSolutions SV", location: "Remoto", type: "Tiempo completo", description: "Desarrollo de aplicaciones web escalables, trabajo con metodologías ágiles.", featured: true },
  { id: 3, title: "Diseñador UI/UX", company: "CreativaStudio", location: "Santa Ana", type: "Medio tiempo", description: "Diseño de interfaces para apps móviles, experiencia con Figma y Adobe XD.", featured: true },
  { id: 4, title: "Especialista en Marketing Digital", company: "Agencia Growth", location: "San Miguel", type: "Tiempo completo", description: "Gestión de campañas en Google Ads y redes sociales, analítica.", featured: false },
  { id: 5, title: "Ingeniero de Datos", company: "DataCloud", location: "Remoto", type: "Freelance", description: "ETL, Python, SQL, modelado de datos.", featured: false },
  { id: 6, title: "Soporte Técnico IT", company: "GlobalHelp", location: "San Salvador", type: "Tiempo completo", description: "Atención a incidencias, mantenimiento de hardware/software.", featured: false }
];

// ======================== CARGA Y PERSISTENCIA ========================
function loadUserData() {
  const stored = localStorage.getItem("empleoya_current_user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      if (currentUser.role !== 'candidato') {
        window.location.href = currentUser.role === 'empresa' ? 'empresa.html' : 'index.html';
        return;
      }
    } catch (e) {
      logout();
      return;
    }
  } else {
    window.location.href = 'login.html';
    return;
  }

  const storedApps = localStorage.getItem(`applications_${currentUser.email}`);
  if (storedApps) {
    try {
      userApplications = JSON.parse(storedApps);
    } catch (e) { userApplications = []; }
  }
  updateUIWithUser();
}

function saveUserData() {
  localStorage.setItem("empleoya_current_user", JSON.stringify(currentUser));
  localStorage.setItem(`applications_${currentUser.email}`, JSON.stringify(userApplications));
}

function updateUIWithUser() {
  document.getElementById("userNameDisplay").innerText = currentUser.name;
  document.getElementById("userAvatar").innerText = currentUser.profile?.avatar || currentUser.name.charAt(0);
  document.getElementById("profileName").innerText = currentUser.name;
  document.getElementById("profileTitle").innerText = currentUser.profile?.title || "Sin título";
  document.getElementById("profileEmail").innerText = currentUser.email;
  document.getElementById("profilePhone").innerText = currentUser.profile?.phone || "No especificado";
  document.getElementById("profileAvatar").innerText = currentUser.profile?.avatar || currentUser.name.charAt(0);
  document.getElementById("statSolicitudes").innerText = userApplications.length;
  const cvStatus = currentUser.cvFileName ? "✅" : "❌";
  document.getElementById("statCV").innerHTML = cvStatus;
}

// ======================== RENDER JOBS ========================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderJobs(filteredJobs) {
  const container = document.getElementById("jobsContainer");
  const jobCountSpan = document.getElementById("jobCount");
  if (!filteredJobs.length) {
    container.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-inbox fs-1 text-muted"></i><p class="mt-2">No se encontraron empleos con esos filtros.</p></div>`;
    jobCountSpan.innerText = "0 empleos";
    return;
  }
  jobCountSpan.innerText = filteredJobs.length + " empleo" + (filteredJobs.length !== 1 ? "s" : "");
  container.innerHTML = filteredJobs.map(job => `
    <div class="col-md-6 col-lg-4">
      <div class="job-card p-3 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="text-primary fw-bold">${escapeHtml(job.company)}</h6>
          <span class="badge bg-light text-dark rounded-pill">${job.type}</span>
        </div>
        <h5 class="mt-2 fw-bold">${escapeHtml(job.title)}</h5>
        <p class="text-muted small mt-2 flex-grow-1">${escapeHtml(job.description.substring(0, 100))}${job.description.length > 100 ? '…' : ''}</p>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div><i class="bi bi-geo-alt text-primary me-1"></i> <span class="small">${escapeHtml(job.location)}</span></div>
          <div><i class="bi bi-cash-stack text-success me-1"></i> <span class="small">${job.salary || "Según perfil"}</span></div>
        </div>
        <hr class="my-2">
        <div class="d-flex justify-content-between align-items-center">
          <a href="#" class="apply-link text-primary fw-bold apply-job-btn" data-job-id="${job.id}">Aplicar <i class="bi bi-arrow-right-short"></i></a>
          <i class="bi bi-bookmark text-secondary" style="cursor:pointer;"></i>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.apply-job-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const jobId = parseInt(btn.getAttribute('data-job-id'));
      const job = jobsDatabase.find(j => j.id === jobId);
      applyToJob(job);
    });
  });
}

function applyToJob(job) {
  const alreadyApplied = userApplications.some(app => app.jobId === job.id);
  if (alreadyApplied) {
    showToast(`Ya has aplicado a "${job.title}" anteriormente.`, "warning");
    return;
  }
  const application = {
    id: Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    appliedDate: new Date().toLocaleDateString('es-ES'),
    status: "En revisión"
  };
  userApplications.unshift(application);
  saveUserData();
  updateUIWithUser();
  showToast(`✅ ¡Aplicaste a "${job.title}" en ${job.company}!`, "success");
  if (document.querySelector('[data-tab="solicitudes"]').classList.contains('active')) {
    renderApplications();
  }
}

function filterJobs() {
  const keyword = document.getElementById("searchKeyword").value.toLowerCase();
  const location = document.getElementById("filterLocation").value.toLowerCase();
  const type = document.getElementById("filterType").value.toLowerCase();
  let filtered = jobsDatabase.filter(job => {
    let match = true;
    if (keyword && !job.title.toLowerCase().includes(keyword) && !job.company.toLowerCase().includes(keyword)) match = false;
    if (location && !job.location.toLowerCase().includes(location)) match = false;
    if (type && !job.type.toLowerCase().includes(type)) match = false;
    return match;
  });
  filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  renderJobs(filtered);
}

// ======================== RENDER SOLICITUDES ========================
function renderApplications() {
  const container = document.getElementById("solicitudesContainer");
  if (!userApplications.length) {
    container.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-send-slash fs-1 text-muted"></i><p class="mt-2">Aún no has postulado a ninguna oferta.</p></div>`;
    return;
  }
  container.innerHTML = userApplications.map(app => `
    <div class="col-md-6 col-lg-4">
      <div class="solicitud-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="text-primary fw-bold">${escapeHtml(app.company)}</h6>
          <span class="badge ${app.status === 'En revisión' ? 'bg-warning' : 'bg-success'}">${app.status}</span>
        </div>
        <h5 class="fw-bold">${escapeHtml(app.jobTitle)}</h5>
        <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${escapeHtml(app.location)} · ${app.type}</div>
        <div class="small text-muted">Postulado el: ${app.appliedDate}</div>
        <hr class="my-2">
        <button class="btn btn-sm btn-outline-secondary rounded-pill cancel-application" data-id="${app.id}">Cancelar postulación</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.cancel-application').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.getAttribute('data-id'));
      cancelApplication(id);
    });
  });
}

function cancelApplication(appId) {
  if (confirm("¿Cancelar tu postulación?")) {
    userApplications = userApplications.filter(app => app.id !== appId);
    saveUserData();
    updateUIWithUser();
    renderApplications();
    showToast("Postulación cancelada.", "info");
  }
}

// ======================== PERFIL ========================
function setupProfileEditing() {
  document.getElementById("editProfileBtn").addEventListener("click", () => {
    const newName = prompt("Nombre completo:", currentUser.name);
    if (newName && newName.trim()) currentUser.name = newName.trim();
    const newTitle = prompt("Título profesional:", currentUser.profile?.title || "");
    if (newTitle !== null) {
      if (!currentUser.profile) currentUser.profile = {};
      currentUser.profile.title = newTitle;
    }
    const newEmail = prompt("Correo electrónico:", currentUser.email);
    if (newEmail !== null) currentUser.email = newEmail;
    const newPhone = prompt("Teléfono:", currentUser.profile?.phone || "");
    if (newPhone !== null) {
      if (!currentUser.profile) currentUser.profile = {};
      currentUser.profile.phone = newPhone;
    }
    if (!currentUser.profile) currentUser.profile = {};
    currentUser.profile.avatar = currentUser.name.charAt(0);
    saveUserData();
    updateUIWithUser();
    showToast("Perfil actualizado", "success");
  });

  document.getElementById("uploadCvProfileBtn").addEventListener("click", () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        currentUser.cvFileName = e.target.files[0].name;
        saveUserData();
        updateUIWithUser();
        showToast(`CV "${currentUser.cvFileName}" cargado`, "success");
      }
    };
    input.click();
  });
}

// ======================== NAVEGACIÓN POR TABS ========================
function initTabs() {
  const tabs = document.querySelectorAll('#navTabs .nav-link');
  const contents = {
    buscar: document.getElementById('buscarTab'),
    solicitudes: document.getElementById('solicitudesTab'),
    perfil: document.getElementById('perfilTab')
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      Object.keys(contents).forEach(key => {
        contents[key].style.display = 'none';
      });
      contents[tabId].style.display = 'block';
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tabId === 'buscar') filterJobs();
      if (tabId === 'solicitudes') renderApplications();
      if (tabId === 'perfil') updateUIWithUser();
    });
  });
}

// ======================== TOAST ========================
function showToast(message, type = "success") {
  let toastContainer = document.querySelector(".toast-notification");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-notification";
    document.body.appendChild(toastContainer);
  }
  const bgClass = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : (type === "warning" ? "bg-warning" : "bg-info"));
  const textClass = type === "warning" ? "text-dark" : "text-white";
  toastContainer.innerHTML = `
    <div class="toast align-items-center ${bgClass} ${textClass} border-0 show" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  const toastEl = toastContainer.querySelector('.toast');
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3500, autohide: true });
  bsToast.show();
  setTimeout(() => { if (toastEl) toastEl.remove(); }, 3800);
}

// ======================== LOGOUT ========================
function logout() {
  localStorage.removeItem("empleoya_current_user");
  showToast("Sesión cerrada. Redirigiendo...", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 1500);
}

// ======================== CARGA DE CV DESDE NAVBAR ========================
function setupNavbarUpload() {
  document.getElementById("uploadCvBtn").addEventListener("click", () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        currentUser.cvFileName = e.target.files[0].name;
        saveUserData();
        updateUIWithUser();
        showToast(`CV "${currentUser.cvFileName}" actualizado`, "success");
      }
    };
    input.click();
  });
  document.getElementById("goToProfile").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="perfil"]').click();
  });
}

// ======================== INICIALIZACIÓN ========================
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  initTabs();
  filterJobs();
  renderApplications();
  setupProfileEditing();
  setupNavbarUpload();
  document.getElementById("searchBtn").addEventListener("click", filterJobs);
  document.getElementById("searchKeyword").addEventListener("keyup", (e) => { if (e.key === "Enter") filterJobs(); });
  document.getElementById("filterLocation").addEventListener("change", filterJobs);
  document.getElementById("filterType").addEventListener("change", filterJobs);
  document.getElementById("logoutBtn").addEventListener("click", logout);
});