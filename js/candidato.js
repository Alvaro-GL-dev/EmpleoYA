// ======================== DATOS DEL USUARIO LOGUEADO ========================
let currentUser = null;
let userApplications = [];

const jobsDatabase = [
  { id: 1, title: "Consultor de Gestion del Cambio SAP", company: "IBM", location: "San Salvador", type: "Tiempo completo", description: "Liderar iniciativas de transformacion empresarial y gestion del cambio para clientes globales.", salary: "USD 1800 - 2200", featured: true },
  { id: 2, title: "Desarrollador Full Stack (React + Node)", company: "TechSolutions SV", location: "Remoto", type: "Tiempo completo", description: "Desarrollo de aplicaciones web escalables, trabajo con metodologias agiles.", salary: "USD 1400 - 1800", featured: true },
  { id: 3, title: "Disenador UI/UX", company: "CreativaStudio", location: "Santa Ana", type: "Medio tiempo", description: "Diseno de interfaces para apps moviles, experiencia con Figma y Adobe XD.", salary: "USD 900 - 1200", featured: true },
  { id: 4, title: "Especialista en Marketing Digital", company: "Agencia Growth", location: "San Miguel", type: "Tiempo completo", description: "Gestion de campanas en Google Ads y redes sociales, analitica.", salary: "USD 1000 - 1300", featured: false },
  { id: 5, title: "Ingeniero de Datos", company: "DataCloud", location: "Remoto", type: "Freelance", description: "ETL, Python, SQL, modelado de datos.", salary: "USD 1600 - 2100", featured: false },
  { id: 6, title: "Soporte Tecnico IT", company: "GlobalHelp", location: "San Salvador", type: "Tiempo completo", description: "Atencion a incidencias, mantenimiento de hardware/software.", salary: "USD 700 - 950", featured: false }
];

// ======================== CARGA Y PERSISTENCIA ========================
function loadUserData() {
  const stored = localStorage.getItem("empleoya_current_user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      if (currentUser.role !== "candidato") {
        window.location.href = currentUser.role === "empresa" ? "empresa.html" : "index.html";
        return;
      }
    } catch (e) {
      logout();
      return;
    }
  } else {
    window.location.href = "login.html";
    return;
  }

  const storedApps = localStorage.getItem(`applications_${currentUser.email}`);
  if (storedApps) {
    try {
      userApplications = JSON.parse(storedApps);
    } catch (e) {
      userApplications = [];
    }
  }

  updateUIWithUser();
}

function saveUserData() {
  localStorage.setItem("empleoya_current_user", JSON.stringify(currentUser));
  localStorage.setItem(`applications_${currentUser.email}`, JSON.stringify(userApplications));
}

function updateUIWithUser() {
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userAvatar = document.getElementById("userAvatar");
  const profileName = document.getElementById("profileName");
  const profileTitle = document.getElementById("profileTitle");
  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const profileAvatar = document.getElementById("profileAvatar");
  const statSolicitudes = document.getElementById("statSolicitudes");
  const statCV = document.getElementById("statCV");

  if (userNameDisplay) userNameDisplay.innerText = currentUser.name;
  if (userAvatar) userAvatar.innerText = currentUser.profile?.avatar || currentUser.name.charAt(0);
  if (profileName) profileName.innerText = currentUser.name;
  if (profileTitle) profileTitle.innerText = currentUser.profile?.title || "Sin titulo";
  if (profileEmail) profileEmail.innerText = currentUser.email;
  if (profilePhone) profilePhone.innerText = currentUser.profile?.phone || "No especificado";
  if (profileAvatar) profileAvatar.innerText = currentUser.profile?.avatar || currentUser.name.charAt(0);
  if (statSolicitudes) statSolicitudes.innerText = userApplications.length;
  if (statCV) statCV.innerHTML = currentUser.cvFileName ? "OK" : "No";
}

// ======================== RENDER JOBS ========================
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function renderJobs(filteredJobs) {
  const container = document.getElementById("jobsContainer");
  const jobCountSpan = document.getElementById("jobCount");
  if (!container || !jobCountSpan) return;

  if (!filteredJobs.length) {
    container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-inbox fs-1 text-muted"></i><p class="mt-2">No se encontraron empleos con esos filtros.</p></div>';
    jobCountSpan.innerText = "0 empleos";
    return;
  }

  jobCountSpan.innerText = `${filteredJobs.length} empleo${filteredJobs.length !== 1 ? "s" : ""}`;
  container.innerHTML = filteredJobs
    .map(
      (job) => `
    <div class="col-md-6 col-lg-4">
      <div class="job-card p-3 h-100 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="text-primary fw-bold">${escapeHtml(job.company)}</h6>
          <span class="badge bg-light text-dark rounded-pill">${job.type}</span>
        </div>
        <h5 class="mt-2 fw-bold">${escapeHtml(job.title)}</h5>
        <p class="text-muted small mt-2 flex-grow-1">${escapeHtml(job.description.substring(0, 100))}${job.description.length > 100 ? "..." : ""}</p>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div><i class="bi bi-geo-alt text-primary me-1"></i> <span class="small">${escapeHtml(job.location)}</span></div>
          <div><i class="bi bi-cash-stack text-success me-1"></i> <span class="small">${job.salary || "Segun perfil"}</span></div>
        </div>
        <hr class="my-2">
        <div class="d-flex justify-content-between align-items-center">
          <a href="#" class="apply-link text-primary fw-bold apply-job-btn" data-job-id="${job.id}">Aplicar <i class="bi bi-arrow-right-short"></i></a>
          <i class="bi bi-bookmark text-secondary" style="cursor:pointer;"></i>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".apply-job-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const jobId = parseInt(btn.getAttribute("data-job-id"), 10);
      const job = jobsDatabase.find((j) => j.id === jobId);
      if (job) applyToJob(job);
    });
  });
}

function applyToJob(job) {
  const alreadyApplied = userApplications.some((app) => app.jobId === job.id);
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
    appliedDate: new Date().toLocaleDateString("es-ES"),
    status: "En revision"
  };

  userApplications.unshift(application);
  saveUserData();
  updateUIWithUser();
  showToast(`Aplicaste a "${job.title}" en ${job.company}.`, "success");

  const solicitudesBtn = document.querySelector('[data-tab="solicitudes"]');
  if (solicitudesBtn && solicitudesBtn.classList.contains("active")) {
    renderApplications();
  }
}

function filterJobs() {
  const keyword = (document.getElementById("searchKeyword")?.value || "").toLowerCase();
  const location = (document.getElementById("filterLocation")?.value || "").toLowerCase();
  const type = (document.getElementById("filterType")?.value || "").toLowerCase();

  const filtered = jobsDatabase
    .filter((job) => {
      let match = true;
      if (keyword && !job.title.toLowerCase().includes(keyword) && !job.company.toLowerCase().includes(keyword)) match = false;
      if (location && !job.location.toLowerCase().includes(location)) match = false;
      if (type && !job.type.toLowerCase().includes(type)) match = false;
      return match;
    })
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  renderJobs(filtered);
}

// ======================== RENDER SOLICITUDES ========================
function renderApplications() {
  const container = document.getElementById("solicitudesContainer");
  if (!container) return;

  if (!userApplications.length) {
    container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-send-slash fs-1 text-muted"></i><p class="mt-2">Aun no has postulado a ninguna oferta.</p></div>';
    return;
  }

  container.innerHTML = userApplications
    .map(
      (app) => `
    <div class="col-md-6 col-lg-4">
      <div class="solicitud-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="text-primary fw-bold">${escapeHtml(app.company)}</h6>
          <span class="badge ${app.status === "En revision" ? "bg-warning" : "bg-success"}">${app.status}</span>
        </div>
        <h5 class="fw-bold">${escapeHtml(app.jobTitle)}</h5>
        <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${escapeHtml(app.location)} · ${app.type}</div>
        <div class="small text-muted">Postulado el: ${app.appliedDate}</div>
        <hr class="my-2">
        <button class="btn btn-sm btn-outline-secondary rounded-pill cancel-application" data-id="${app.id}">Cancelar postulacion</button>
      </div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".cancel-application").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"), 10);
      cancelApplication(id);
    });
  });
}

function cancelApplication(appId) {
  if (confirm("Cancelar tu postulacion?")) {
    userApplications = userApplications.filter((app) => app.id !== appId);
    saveUserData();
    updateUIWithUser();
    renderApplications();
    showToast("Postulacion cancelada.", "info");
  }
}

// ======================== PERFIL ========================
function setupProfileEditing() {
  const editProfileBtn = document.getElementById("editProfileBtn");
  const uploadCvProfileBtn = document.getElementById("uploadCvProfileBtn");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const newName = prompt("Nombre completo:", currentUser.name);
      if (newName && newName.trim()) currentUser.name = newName.trim();

      const newTitle = prompt("Titulo profesional:", currentUser.profile?.title || "");
      if (newTitle !== null) {
        if (!currentUser.profile) currentUser.profile = {};
        currentUser.profile.title = newTitle;
      }

      const newEmail = prompt("Correo electronico:", currentUser.email);
      if (newEmail !== null) currentUser.email = newEmail;

      const newPhone = prompt("Telefono:", currentUser.profile?.phone || "");
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
  }

  if (uploadCvProfileBtn) {
    uploadCvProfileBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf";
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
}

// ======================== NAVEGACION POR TABS ========================
function initTabs() {
  const tabs = document.querySelectorAll("#navTabs [data-tab]");
  const contents = {
    buscar: document.getElementById("buscarTab"),
    solicitudes: document.getElementById("solicitudesTab"),
    recursos: document.getElementById("recursosTab"),
    foros: document.getElementById("forosTab")
  };

  const switchTab = (tabId) => {
    if (!contents[tabId]) return;

    Object.keys(contents).forEach((key) => {
      if (contents[key]) contents[key].style.display = "none";
    });

    contents[tabId].style.display = "block";

    tabs.forEach((t) => t.classList.remove("active"));
    const target = document.querySelector(`#navTabs [data-tab="${tabId}"]`);
    if (target) target.classList.add("active");

    if (tabId === "buscar") filterJobs();
    if (tabId === "solicitudes") renderApplications();

    const newUrl = `${window.location.pathname}?tab=${encodeURIComponent(tabId)}`;
    if (window.location.search !== `?tab=${tabId}`) {
      window.history.replaceState({}, "", newUrl);
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(tab.getAttribute("data-tab"));
    });
  });

  const goHomeBrand = document.getElementById("goHomeBrand");
  if (goHomeBrand) {
    goHomeBrand.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("buscar");
    });
  }

  const tabFromUrl = new URLSearchParams(window.location.search).get("tab");
  if (tabFromUrl && contents[tabFromUrl]) {
    switchTab(tabFromUrl);
  }
}

// ======================== TOAST ========================
function showToast(message, type = "success") {
  let toastContainer = document.querySelector(".toast-notification");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-notification";
    document.body.appendChild(toastContainer);
  }

  const bgClass = type === "success" ? "bg-success" : type === "danger" ? "bg-danger" : type === "warning" ? "bg-warning" : "bg-info";
  const textClass = type === "warning" ? "text-dark" : "text-white";

  toastContainer.innerHTML = `
    <div class="toast align-items-center ${bgClass} ${textClass} border-0 show" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  const toastEl = toastContainer.querySelector(".toast");
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3500, autohide: true });
  bsToast.show();
  setTimeout(() => {
    if (toastEl) toastEl.remove();
  }, 3800);
}

// ======================== LOGOUT ========================
function logout() {
  localStorage.removeItem("empleoya_current_user");
  showToast("Sesion cerrada. Redirigiendo...", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
}

// ======================== CARGA DE CV DESDE NAVBAR ========================
function setupNavbarUpload() {
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  if (!uploadCvBtn) return;

  uploadCvBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
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
}

// ======================== FILTROS RECURSOS ========================
function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function setupResourcesFilters() {
  const container = document.getElementById("recursosTab");
  if (!container) return;

  const tabs = Array.from(container.querySelectorAll(".tabs-wrap .nav-tabs .nav-link"));
  const cards = Array.from(container.querySelectorAll(".section-main .col-lg-9 .row.g-3 > .col-md-4"));
  const searchInput = container.querySelector(".search-box input");
  const searchBtn = container.querySelector(".search-box .btn-search");

  if (!tabs.length || !cards.length || !searchInput) return;

  const cardGrid = cards[0].parentElement;
  const emptyState = document.createElement("div");
  emptyState.className = "col-12";
  emptyState.style.display = "none";
  emptyState.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-search me-1"></i>No se encontraron recursos.</div>';
  cardGrid.appendChild(emptyState);

  const mapTabToCategory = (tabLabel) => {
    const label = normalizeText(tabLabel);
    if (label === "todos") return "todos";
    if (label.includes("curso")) return "cursos";
    if (label.includes("guia")) return "guias";
    if (label.includes("consejo")) return "consejos";
    if (label.includes("plantilla")) return "plantillas cv";
    return "todos";
  };

  const mapCardToCategory = (cardCol) => {
    const badgeText = normalizeText(cardCol.querySelector(".badge-type")?.textContent);
    const titleText = normalizeText(cardCol.querySelector("h6")?.textContent);

    if (badgeText.includes("guia")) return "guias";
    if (badgeText.includes("consejo")) return "consejos";
    if (badgeText.includes("cv") || titleText.includes("plantilla")) return "plantillas cv";
    if (badgeText.includes("curso")) return "cursos";
    return "todos";
  };

  cards.forEach((card) => {
    card.dataset.category = mapCardToCategory(card);
    card.dataset.searchable = normalizeText(card.textContent);
  });

  let activeCategory = mapTabToCategory(tabs.find((tab) => tab.classList.contains("active"))?.textContent || "Todos");

  const applyFilters = () => {
    const query = normalizeText(searchInput.value);
    let visible = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === "todos" || card.dataset.category === activeCategory;
      const matchesQuery = !query || card.dataset.searchable.includes(query);
      const show = matchesCategory && matchesQuery;
      card.style.display = show ? "" : "none";
      if (show) visible += 1;
    });

    emptyState.style.display = visible ? "none" : "";
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      tabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = mapTabToCategory(tab.textContent);
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", (event) => {
      event.preventDefault();
      applyFilters();
    });
  }

  applyFilters();
}

// ======================== FILTROS FOROS ========================
function setupForosFilters() {
  const container = document.getElementById("forosTab");
  if (!container) return;

  const tabs = Array.from(container.querySelectorAll(".tabs-row .nav-pills .nav-link"));
  const sidebarCategories = Array.from(container.querySelectorAll(".cat-list a"));
  const searchInput = container.querySelector(".search-wrap input");
  const threads = Array.from(container.querySelectorAll(".main-wrap .col-lg-8 .thread-card"));

  if (!tabs.length || !searchInput || !threads.length) return;

  const threadsCol = threads[0].parentElement;
  const emptyState = document.createElement("div");
  emptyState.className = "text-center py-5 text-muted";
  emptyState.style.display = "none";
  emptyState.innerHTML = '<i class="bi bi-search me-1"></i>No se encontraron publicaciones.';
  threadsCol.appendChild(emptyState);

  const mapLabelToCategory = (label) => {
    const text = normalizeText(label);
    if (text === "todos") return "todos";
    if (text.includes("entrevista")) return "entrevistas";
    if (text === "cv") return "cv";
    if (text.includes("programacion")) return "programacion";
    if (text.includes("salario")) return "salarios";
    if (text.includes("consejo")) return "consejos";
    return "todos";
  };

  const mapThreadToCategory = (thread) => {
    const badge = thread.querySelector(".badge-cat");
    if (!badge) return "todos";

    const classes = Array.from(badge.classList);
    if (classes.includes("bc-entrevistas")) return "entrevistas";
    if (classes.includes("bc-cv")) return "cv";
    if (classes.includes("bc-programacion")) return "programacion";
    if (classes.includes("bc-salarios")) return "salarios";
    if (classes.includes("bc-consejos")) return "consejos";
    return mapLabelToCategory(badge.textContent);
  };

  threads.forEach((thread) => {
    thread.dataset.category = mapThreadToCategory(thread);
    thread.dataset.searchable = normalizeText(thread.textContent);
  });

  let activeCategory = mapLabelToCategory(tabs.find((tab) => tab.classList.contains("active"))?.textContent || "Todos");

  const syncSidebarActive = () => {
    sidebarCategories.forEach((link) => {
      const linkCategory = mapLabelToCategory(link.textContent);
      link.classList.toggle("active", linkCategory === activeCategory);
    });
  };

  const syncTabsActive = () => {
    const matchingTab = tabs.find((tab) => mapLabelToCategory(tab.textContent) === activeCategory);
    tabs.forEach((tab) => tab.classList.remove("active"));
    if (matchingTab) matchingTab.classList.add("active");
    else tabs[0]?.classList.add("active");
  };

  const applyFilters = () => {
    const query = normalizeText(searchInput.value);
    let visible = 0;

    threads.forEach((thread) => {
      const matchesCategory = activeCategory === "todos" || thread.dataset.category === activeCategory;
      const matchesQuery = !query || thread.dataset.searchable.includes(query);
      const show = matchesCategory && matchesQuery;
      thread.style.display = show ? "" : "none";
      if (show) visible += 1;
    });

    emptyState.style.display = visible ? "none" : "";
    syncSidebarActive();
    syncTabsActive();
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      activeCategory = mapLabelToCategory(tab.textContent);
      applyFilters();
    });
  });

  sidebarCategories.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      activeCategory = mapLabelToCategory(link.textContent);
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  });

  applyFilters();
}

// ======================== INICIALIZACION ========================
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  initTabs();
  filterJobs();
  renderApplications();
  setupProfileEditing();
  setupNavbarUpload();
  setupResourcesFilters();
  setupForosFilters();

  document.getElementById("searchBtn")?.addEventListener("click", filterJobs);
  document.getElementById("searchKeyword")?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterJobs();
  });
  document.getElementById("filterLocation")?.addEventListener("change", filterJobs);
  document.getElementById("filterType")?.addEventListener("change", filterJobs);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
});

