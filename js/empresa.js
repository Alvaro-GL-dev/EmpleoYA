// ======================== DATOS INICIALES ========================
let currentUser = null;
let companyData = {
  profile: {
    name: "",
    email: "",
    website: "",
    description: ""
  },
  jobs: []
};

// ======================== LOCALSTORAGE ========================
function loadCompanyData() {
  const storedUser = localStorage.getItem("empleoya_current_user");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      if (currentUser.role !== 'empresa') {
        window.location.href = currentUser.role === 'candidato' ? 'candidato-dashboard.html' : 'index.html';
        return;
      }
      document.getElementById("companyNameDisplay").innerText = currentUser.name;
      companyData.profile.name = currentUser.name;
      companyData.profile.email = currentUser.email;
    } catch (e) {
      logout();
      return;
    }
  } else {
    window.location.href = 'login.html';
    return;
  }

  const storedJobs = localStorage.getItem(`company_jobs_${currentUser.email}`);
  if (storedJobs) {
    try {
      companyData.jobs = JSON.parse(storedJobs);
    } catch (e) { companyData.jobs = []; }
  } else {
    // Datos demo iniciales
    companyData.jobs = [
      { id: "job1", title: "Consultor de Gestión del Cambio SAP", company: currentUser.name, location: "San Salvador", type: "Tiempo completo", salary: "$1800 - $2200", description: "Liderar iniciativas de transformación empresarial.", applicants: 12, date: "2025-03-01" },
      { id: "job2", title: "Desarrollador Full Stack", company: currentUser.name, location: "Remoto", type: "Tiempo completo", salary: "$2000 - $2500", description: "React, Node.js, MongoDB.", applicants: 8, date: "2025-03-10" },
      { id: "job3", title: "Diseñador UI/UX", company: currentUser.name, location: "Santa Ana", type: "Medio tiempo", salary: "$1200 - $1500", description: "Figma, investigación de usuarios.", applicants: 5, date: "2025-03-15" }
    ];
  }
  saveCompanyData();
}

function saveCompanyData() {
  if (currentUser) {
    localStorage.setItem(`company_jobs_${currentUser.email}`, JSON.stringify(companyData.jobs));
  }
}

// ======================== RENDER VACANTES ========================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderVacantes() {
  const container = document.getElementById("vacantesContainer");
  const searchTerm = document.getElementById("searchVacante")?.value.toLowerCase() || "";
  const ubicacion = document.getElementById("filterUbicacion")?.value.toLowerCase() || "";
  const tipo = document.getElementById("filterTipo")?.value.toLowerCase() || "";

  let filtered = companyData.jobs.filter(job => {
    let match = true;
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm) && !job.company.toLowerCase().includes(searchTerm)) match = false;
    if (ubicacion && !job.location.toLowerCase().includes(ubicacion)) match = false;
    if (tipo && !job.type.toLowerCase().includes(tipo)) match = false;
    return match;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-inbox fs-1 text-muted"></i><p class="mt-2">No hay vacantes que coincidan.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(job => `
    <div class="col-md-6 col-lg-4">
      <div class="job-card p-3 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge-status">${job.type}</span>
          <div>
            <button class="btn-icon edit-job" data-id="${job.id}"><i class="bi bi-pencil-square"></i></button>
            <button class="btn-icon delete-job text-danger" data-id="${job.id}"><i class="bi bi-trash3"></i></button>
          </div>
        </div>
        <h6 class="text-primary fw-bold">${escapeHtml(job.company)}</h6>
        <h5 class="fw-bold">${escapeHtml(job.title)}</h5>
        <p class="text-muted small mt-2 flex-grow-1">${escapeHtml(job.description.substring(0, 100))}${job.description.length > 100 ? '…' : ''}</p>
        <div class="mt-3">
          <div class="d-flex justify-content-between small text-muted mb-2">
            <span><i class="bi bi-geo-alt"></i> ${escapeHtml(job.location)}</span>
            <span><i class="bi bi-cash-stack"></i> ${job.salary || "No especificado"}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="small"><i class="bi bi-people"></i> ${job.applicants || 0} postulantes</span>
            <button class="btn btn-sm btn-outline-primary rounded-pill view-applicants" data-job-title="${escapeHtml(job.title)}">Ver candidatos</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll(".edit-job").forEach(btn => {
    btn.addEventListener("click", () => editJob(btn.getAttribute("data-id")));
  });
  document.querySelectorAll(".delete-job").forEach(btn => {
    btn.addEventListener("click", () => deleteJob(btn.getAttribute("data-id")));
  });
  document.querySelectorAll(".view-applicants").forEach(btn => {
    btn.addEventListener("click", () => {
      const jobTitle = btn.getAttribute("data-job-title");
      showCandidatesForJob(jobTitle);
    });
  });
}

function editJob(id) {
  const job = companyData.jobs.find(j => j.id === id);
  if (!job) return;
  document.getElementById("vacanteId").value = job.id;
  document.getElementById("tituloVacante").value = job.title;
  document.getElementById("empresaVacante").value = job.company;
  document.getElementById("ubicacionVacante").value = job.location;
  document.getElementById("tipoTrabajo").value = job.type;
  document.getElementById("salarioVacante").value = job.salary || "";
  document.getElementById("descripcionVacante").value = job.description;
  document.getElementById("modalVacanteLabel").innerText = "Editar vacante";
  new bootstrap.Modal(document.getElementById("modalVacante")).show();
}

function deleteJob(id) {
  if (confirm("¿Eliminar esta vacante permanentemente?")) {
    companyData.jobs = companyData.jobs.filter(j => j.id !== id);
    saveCompanyData();
    renderVacantes();
    showToast("Vacante eliminada", "danger");
  }
}

function saveJobFromForm(event) {
  event.preventDefault();
  const id = document.getElementById("vacanteId").value;
  const title = document.getElementById("tituloVacante").value;
  const company = document.getElementById("empresaVacante").value;
  const location = document.getElementById("ubicacionVacante").value;
  const type = document.getElementById("tipoTrabajo").value;
  const salary = document.getElementById("salarioVacante").value;
  const description = document.getElementById("descripcionVacante").value;

  if (!title || !company || !location || !type || !description) {
    showToast("Completa todos los campos obligatorios", "warning");
    return;
  }

  if (id) {
    const index = companyData.jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      companyData.jobs[index] = { ...companyData.jobs[index], title, company, location, type, salary, description };
    }
    showToast("Vacante actualizada", "success");
  } else {
    const newJob = {
      id: Date.now().toString(),
      title, company, location, type, salary, description,
      applicants: 0,
      date: new Date().toISOString().split('T')[0]
    };
    companyData.jobs.unshift(newJob);
    showToast("Vacante publicada", "success");
  }
  saveCompanyData();
  renderVacantes();
  document.getElementById("formVacante").reset();
  document.getElementById("vacanteId").value = "";
  document.getElementById("modalVacanteLabel").innerText = "Publicar nueva vacante";
  bootstrap.Modal.getInstance(document.getElementById("modalVacante")).hide();
}

// ======================== CANDIDATOS (simulado) ========================
const mockCandidates = [
  { id: 1, name: "Ana López", title: "Desarrolladora Full Stack", location: "San Salvador", skills: "React, Node, AWS", appliedTo: "Desarrollador Full Stack", match: 92 },
  { id: 2, name: "Carlos Méndez", title: "Consultor SAP", location: "Santa Ana", skills: "SAP, Gestión del Cambio", appliedTo: "Consultor de Gestión del Cambio SAP", match: 88 },
  { id: 3, name: "María Flores", title: "Diseñadora UI/UX", location: "Remoto", skills: "Figma, Adobe XD", appliedTo: "Diseñador UI/UX", match: 95 },
  { id: 4, name: "Javier Ramírez", title: "Ingeniero de Software", location: "San Miguel", skills: "Java, Spring, Angular", appliedTo: "Desarrollador Full Stack", match: 78 }
];

function renderCandidatos() {
  const container = document.getElementById("candidatosContainer");
  container.innerHTML = mockCandidates.map(cand => `
    <div class="col-md-6 col-lg-4">
      <div class="candidate-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="fw-bold mb-1">${escapeHtml(cand.name)}</h6>
            <p class="text-muted small">${escapeHtml(cand.title)}</p>
          </div>
          <span class="badge bg-success">${cand.match}% match</span>
        </div>
        <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${cand.location}</div>
        <div class="mb-2"><span class="badge bg-light text-dark">${escapeHtml(cand.skills)}</span></div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <span class="small">Postuló a: <strong>${escapeHtml(cand.appliedTo)}</strong></span>
          <button class="btn btn-sm btn-outline-primary rounded-pill">Contactar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function showCandidatesForJob(jobTitle) {
  document.querySelector('[data-tab="candidatos"]').click();
  showToast(`Mostrando candidatos para "${jobTitle}"`, "info");
}

// ======================== PERFIL EMPRESARIAL ========================
function loadCompanyProfileForm() {
  document.getElementById("empresaNombre").value = companyData.profile.name;
  document.getElementById("empresaEmail").value = companyData.profile.email;
  document.getElementById("empresaWeb").value = companyData.profile.website;
  document.getElementById("empresaDescripcion").value = companyData.profile.description;
}

function saveCompanyProfile(event) {
  event.preventDefault();
  companyData.profile.name = document.getElementById("empresaNombre").value;
  companyData.profile.email = document.getElementById("empresaEmail").value;
  companyData.profile.website = document.getElementById("empresaWeb").value;
  companyData.profile.description = document.getElementById("empresaDescripcion").value;
  // Actualizar usuario
  currentUser.name = companyData.profile.name;
  currentUser.email = companyData.profile.email;
  localStorage.setItem("empleoya_current_user", JSON.stringify(currentUser));
  saveCompanyData();
  document.getElementById("companyNameDisplay").innerText = companyData.profile.name;
  showToast("Perfil actualizado", "success");
}

// ======================== FILTROS UBICACIONES ========================
function updateLocationFilter() {
  const locations = [...new Set(companyData.jobs.map(job => job.location))];
  const select = document.getElementById("filterUbicacion");
  select.innerHTML = '<option value="">Todas las ubicaciones</option>';
  locations.forEach(loc => {
    select.innerHTML += `<option value="${escapeHtml(loc)}">${escapeHtml(loc)}</option>`;
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

// ======================== TAB NAVIGATION ========================
function initTabs() {
  const tabs = document.querySelectorAll('#navTabs .nav-link');
  const contents = {
    vacantes: document.getElementById('vacantesTab'),
    candidatos: document.getElementById('candidatosTab'),
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
      if (tabId === 'vacantes') renderVacantes();
      if (tabId === 'candidatos') renderCandidatos();
      if (tabId === 'perfil') loadCompanyProfileForm();
    });
  });
}

// ======================== LOGOUT ========================
function logout() {
  localStorage.removeItem("empleoya_current_user");
  showToast("Sesión cerrada. Redirigiendo...", "info");
  setTimeout(() => { window.location.href = "index.html"; }, 1500);
}

// ======================== INICIALIZACIÓN ========================
document.addEventListener("DOMContentLoaded", () => {
  loadCompanyData();
  initTabs();
  renderVacantes();
  updateLocationFilter();
  renderCandidatos();
  loadCompanyProfileForm();

  document.getElementById("formVacante").addEventListener("submit", saveJobFromForm);
  document.getElementById("companyProfileForm").addEventListener("submit", saveCompanyProfile);
  document.getElementById("searchVacante").addEventListener("input", renderVacantes);
  document.getElementById("filterUbicacion").addEventListener("change", renderVacantes);
  document.getElementById("filterTipo").addEventListener("change", renderVacantes);
  document.getElementById("resetFiltros").addEventListener("click", () => {
    document.getElementById("searchVacante").value = "";
    document.getElementById("filterUbicacion").value = "";
    document.getElementById("filterTipo").value = "";
    renderVacantes();
  });
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("modalVacante").addEventListener("show.bs.modal", () => {
    if (!document.getElementById("vacanteId").value) {
      document.getElementById("formVacante").reset();
      document.getElementById("modalVacanteLabel").innerText = "Publicar nueva vacante";
    }
  });
});