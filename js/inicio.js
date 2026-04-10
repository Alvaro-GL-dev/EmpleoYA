// ======================== BASE DE DATOS DE EMPLEOS ========================
const jobsDatabase = [
  { id: 1, title: "Consultor de Gestión del Cambio SAP", company: "IBM", location: "San Salvador", type: "Tiempo completo", description: "Liderar iniciativas de transformación empresarial y gestión del cambio para clientes globales.", salary: "USD 1800 - 2200", featured: true },
  { id: 2, title: "Desarrollador Full Stack (React + Node)", company: "TechSolutions SV", location: "Remoto", type: "Tiempo completo", description: "Desarrollo de aplicaciones web escalables, trabajo con metodologías ágiles.", featured: true },
  { id: 3, title: "Diseñador UI/UX", company: "CreativaStudio", location: "Santa Ana", type: "Medio tiempo", description: "Diseño de interfaces para apps móviles, experiencia con Figma y Adobe XD.", featured: true },
  { id: 4, title: "Especialista en Marketing Digital", company: "Agencia Growth", location: "San Miguel", type: "Tiempo completo", description: "Gestión de campañas en Google Ads y redes sociales, analítica.", featured: false },
  { id: 5, title: "Ingeniero de Datos", company: "DataCloud", location: "Remoto", type: "Freelance", description: "ETL, Python, SQL, modelado de datos.", featured: false },
  { id: 6, title: "Soporte Técnico IT", company: "GlobalHelp", location: "San Salvador", type: "Tiempo completo", description: "Atención a incidencias, mantenimiento de hardware/software.", featured: false }
];

// ======================== GESTIÓN DE SESIÓN UNIFICADA ========================
let currentUser = null;

function loadSession() {
  const stored = localStorage.getItem("empleoya_current_user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      updateNavbarForLoggedUser();
    } catch (e) {
      currentUser = null;
      updateNavbarForGuest();
    }
  } else {
    currentUser = null;
    updateNavbarForGuest();
  }
}

function updateNavbarForLoggedUser() {
  const container = document.getElementById("navAuthButtons");
  if (!container) return;
  if (currentUser) {
    // const dashboardUrl = currentUser.role === 'candidato' ? 'candidato-dashboard.html' : 'empresa.html';
    const dashboardUrl = 'perfil.html';
    container.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
          <div class="avatar-sm" style="width:32px;height:32px;font-size:0.9rem;">${currentUser.name.charAt(0)}</div>
          <span class="fw-semibold">${currentUser.name}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="${dashboardUrl}"><i class="bi bi-person-circle me-2"></i>Mi Panel</a></li>
          <li><a class="dropdown-item" href="#" id="uploadCvNav"><i class="bi bi-file-pdf me-2"></i>Cargar CV</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</a></li>
        </ul>
      </div>
    `;
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("uploadCvNav")?.addEventListener("click", () => showToast("📄 Puedes subir tu CV desde tu perfil.", "info"));
  } else {
    updateNavbarForGuest();
  }
}

function updateNavbarForGuest() {
  const container = document.getElementById("navAuthButtons");
  if (!container) return;
  container.innerHTML = `
    <a href="registro.html" class="btn btn-outline-primary"><i class="bi bi-upload"></i> Cargar CV</a>
    <a href="login.html" class="btn btn-primary"><i class="bi bi-box-arrow-in-right"></i> INICIAR SESIÓN</a>
    <a href="registro.html" class="btn btn-outline-primary">REGISTRARSE</a>
  `;
}

function logout() {
  localStorage.removeItem("empleoya_current_user");
  currentUser = null;
  updateNavbarForGuest();
  showToast("Sesión cerrada correctamente.", "info");
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
          <h6 class="mb-1">${escapeHtml(job.company)}</h6>
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
      if (currentUser) {
        if (currentUser.role === 'candidato') {
          saveApplicationForUser(job);
        } else {
          showToast("Las empresas no pueden postularse a empleos.", "warning");
        }
      } else {
        showToast("🔐 Debes iniciar sesión para postularte.", "warning");
        window.location.href = "login.html";
      }
    });
  });
}

function saveApplicationForUser(job) {
  const storageKey = `applications_${currentUser.email}`;
  let applications = JSON.parse(localStorage.getItem(storageKey)) || [];
  const alreadyApplied = applications.some(app => app.jobId === job.id);
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
  applications.unshift(application);
  localStorage.setItem(storageKey, JSON.stringify(applications));
  showToast(`✅ ¡Aplicaste a "${job.title}" en ${job.company}!`, "success");
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

// ======================== TOAST ========================
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("liveToast");
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

// ======================== INICIALIZACIÓN ========================
document.addEventListener("DOMContentLoaded", () => {
  loadSession();
  filterJobs();

  document.getElementById("searchBtn").addEventListener("click", filterJobs);
  document.getElementById("searchKeyword").addEventListener("keyup", (e) => { if (e.key === "Enter") filterJobs(); });
  document.getElementById("filterLocation").addEventListener("change", filterJobs);
  document.getElementById("filterType").addEventListener("change", filterJobs);
});