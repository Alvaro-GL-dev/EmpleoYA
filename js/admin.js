// ======================== VERIFICACIÓN DE SESIÓN ADMIN ========================
const currentUser = JSON.parse(localStorage.getItem("empleoya_current_user") || "null");
if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "login.html";
}

// ======================== DATOS GLOBALES ========================
let usersData = [];
let companiesData = [];
let jobsData = [];
let reportsData = [
  { id: 1, title: "Gana dinero fácil", company: "SpamCorp", reason: "Spam", type: "job", status: "pending" },
  { id: 2, comment: "Este contenido es ofensivo", user: "usuario456@gmail.com", reason: "Ofensivo", type: "comment", status: "pending" }
];

// Cargar datos reales del localStorage
function loadAllData() {
  // Usuarios
  const storedUsers = localStorage.getItem("empleoya_users");
  if (storedUsers) {
    try {
      usersData = JSON.parse(storedUsers).map((u, index) => ({
        ...u,
        id: index + 1,
        status: u.status || "active" // Añadir estado por defecto
      }));
    } catch(e) { usersData = []; }
  } else {
    // Datos demo iniciales (admin incluido)
    usersData = [
      { id: 1, email: "admin@empleoya.com", password: "admin123", name: "Administrador", role: "admin", status: "active", profile: { avatar: "AD" } },
      { id: 2, email: "juan@empleoya.com", password: "123456", name: "Juan Pérez", role: "candidato", status: "active", profile: { title: "Desarrollador Full Stack", phone: "(503) 7012-3456", avatar: "JP" } },
      { id: 3, email: "techcorp@empleoya.com", password: "empresa123", name: "TechCorp Solutions", role: "empresa", status: "active", profile: { website: "https://techcorp.com", description: "Empresa líder en tecnología" } },
      { id: 4, email: "maria@mail.com", password: "123456", name: "María Gómez", role: "candidato", status: "active", profile: {} },
      { id: 5, email: "carlos@empresa.com", password: "123456", name: "Carlos López", role: "empresa", status: "blocked", profile: {} }
    ];
    saveUsers();
  }

  // Empresas: extraer de usuarios con rol empresa
  companiesData = usersData.filter(u => u.role === "empresa").map((u, idx) => ({
    id: idx + 1,
    name: u.name,
    email: u.email,
    phone: u.profile?.phone || "N/A",
    status: u.status === "active" ? "verified" : "pending"
  }));

  // Vacantes: recolectar de todas las empresas
  jobsData = [];
  companiesData.forEach(comp => {
    const key = `company_jobs_${comp.email}`;
    const storedJobs = localStorage.getItem(key);
    if (storedJobs) {
      try {
        const jobs = JSON.parse(storedJobs);
        jobsData.push(...jobs.map(j => ({ ...j, company: comp.name })));
      } catch(e) {}
    }
  });
  // Si no hay vacantes, agregar demo
  if (jobsData.length === 0) {
    jobsData = [
      { id: 1, title: "Desarrollador Full Stack", company: "TechCorp", type: "Tiempo completo", location: "Remoto", featured: true },
      { id: 2, title: "Diseñador UX/UI", company: "InnovateSV", type: "Freelance", location: "Santa Ana", featured: false },
      { id: 3, title: "Analista de Datos", company: "TechCorp", type: "Tiempo completo", location: "San Salvador", featured: true }
    ];
  }

  // Actualizar estadísticas iniciales
  updateStats();
}

function saveUsers() {
  // Guardar sin el campo id ni status (ese es interno de admin)
  const cleanUsers = usersData.map(({ id, status, ...rest }) => rest);
  localStorage.setItem("empleoya_users", JSON.stringify(cleanUsers));
}

function updateStats() {
  document.getElementById("totalUsers").innerText = usersData.length;
  document.getElementById("activeUsers").innerText = usersData.filter(u => u.status === "active").length;
  document.getElementById("blockedUsers").innerText = usersData.filter(u => u.status === "blocked").length;
  document.getElementById("totalCompanies").innerText = companiesData.length;
  document.getElementById("verifiedCompanies").innerText = companiesData.filter(c => c.status === "verified").length;
  document.getElementById("pendingCompanies").innerText = companiesData.filter(c => c.status === "pending").length;
  document.getElementById("totalJobs").innerText = jobsData.length;
  document.getElementById("activeJobs").innerText = jobsData.length;
  document.getElementById("featuredJobs").innerText = jobsData.filter(j => j.featured).length;
  document.getElementById("pendingReports").innerText = reportsData.length;
  document.getElementById("offensiveComments").innerText = reportsData.filter(r => r.type === "comment").length;
}

// ======================== RENDERIZADO DE TABLAS ========================
let currentPage = { users: 1, companies: 1, jobs: 1, reports: 1 };
const itemsPerPage = 5;

function renderUsersTable(page = 1, search = "") {
  let filtered = usersData.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const start = (page-1)*itemsPerPage;
  const paginated = filtered.slice(start, start+itemsPerPage);
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = paginated.map(user => `
    <tr>
      <td><strong>${user.name}</strong></td>
      <td>${user.email}</td>
      <td>${user.role === "admin" ? "Administrador" : (user.role === "empresa" ? "Empresa" : "Candidato")}</td>
      <td><span class="badge-status ${user.status}">${user.status === "active" ? "Activo" : (user.status === "blocked" ? "Bloqueado" : "Verificar")}</span></td>
      <td>
        <button class="btn-action edit" data-id="${user.id}" data-type="user"><i class="bi bi-pencil"></i> Editar</button>
        ${user.role !== "admin" ? `<button class="btn-action ${user.status === 'active' ? 'block' : 'delete'}" data-id="${user.id}" data-action="toggle-user">${user.status === 'active' ? 'Bloquear' : 'Desbloquear'}</button>` : ''}
      </td>
    </tr>
  `).join("");
  renderPagination("users", total, page);
  updateStats();
}

function renderCompaniesTable(page = 1, search = "") {
  let filtered = companiesData.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const start = (page-1)*itemsPerPage;
  const paginated = filtered.slice(start, start+itemsPerPage);
  const tbody = document.getElementById("companiesTable");
  tbody.innerHTML = paginated.map(comp => `
    <tr>
      <td><strong>${comp.name}</strong></td>
      <td>${comp.email}</td>
      <td>${comp.phone || "N/A"}</td>
      <td><span class="badge-status ${comp.status === 'verified' ? 'active' : 'pending'}">${comp.status === "verified" ? "Verificado" : "Pendiente"}</span></td>
      <td><button class="btn-action edit" data-id="${comp.id}" data-type="company"><i class="bi bi-pencil"></i> Editar</button></td>
    </tr>
  `).join("");
  renderPagination("companies", total, page);
}

function renderJobsTable(page = 1, search = "") {
  let filtered = jobsData.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) || 
    j.company.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const start = (page-1)*itemsPerPage;
  const paginated = filtered.slice(start, start+itemsPerPage);
  const tbody = document.getElementById("jobsTable");
  tbody.innerHTML = paginated.map(job => `
    <tr>
      <td><strong>${job.title}</strong></td>
      <td>${job.company}</td>
      <td>${job.type}</td>
      <td>${job.location}</td>
      <td>
        <button class="btn-action edit" data-id="${job.id}" data-type="job"><i class="bi bi-pencil"></i> Editar</button>
        <button class="btn-action delete" data-id="${job.id}" data-action="delete-job"><i class="bi bi-trash"></i> Eliminar</button>
      </td>
    </tr>
  `).join("");
  renderPagination("jobs", total, page);
}

function renderReports(page = 1) {
  const container = document.getElementById("reportsGrid");
  const start = (page-1)*itemsPerPage;
  const paginated = reportsData.slice(start, start+itemsPerPage);
  container.innerHTML = paginated.map(rep => `
    <div class="report-card">
      <div class="d-flex justify-content-between">
        <strong>${rep.type === "job" ? rep.title : "Comentario ofensivo"}</strong>
        <span class="badge-status pending">${rep.reason}</span>
      </div>
      <div class="text-muted small mt-1">${rep.type === "job" ? `Empresa: ${rep.company}` : `Usuario: ${rep.user}`}</div>
      <div class="mt-3 d-flex gap-2">
        <button class="btn-action delete" data-id="${rep.id}" data-action="delete-report"><i class="bi bi-trash"></i> Borrar contenido</button>
        <button class="btn-action edit" data-id="${rep.id}" data-action="ignore-report"><i class="bi bi-check-lg"></i> Ignorar</button>
      </div>
    </div>
  `).join("");
  renderPagination("reports", reportsData.length, page);
}

function renderPagination(section, total, current) {
  const totalPages = Math.ceil(total / itemsPerPage);
  const container = document.getElementById(`${section}Pagination`);
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ""; return; }
  let html = `<ul class="pagination">`;
  html += `<li class="page-item ${current === 1 ? 'disabled' : ''}"><a class="page-link" data-page="${current-1}" data-section="${section}">Anterior</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === current ? 'active' : ''}"><a class="page-link" data-page="${i}" data-section="${section}">${i}</a></li>`;
  }
  html += `<li class="page-item ${current === totalPages ? 'disabled' : ''}"><a class="page-link" data-page="${current+1}" data-section="${section}">Siguiente</a></li>`;
  html += `</ul>`;
  container.innerHTML = html;
  document.querySelectorAll(`#${section}Pagination .page-link`).forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const newPage = parseInt(link.getAttribute("data-page"));
      if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
        currentPage[section] = newPage;
        if (section === "users") renderUsersTable(newPage, document.getElementById("searchUsers").value);
        else if (section === "companies") renderCompaniesTable(newPage, document.getElementById("searchCompanies").value);
        else if (section === "jobs") renderJobsTable(newPage, document.getElementById("searchJobs").value);
        else if (section === "reports") renderReports(newPage);
      }
    });
  });
}

// ======================== TOAST Y CONFIRMACIÓN ========================
function showToast(message, type = "success") {
  const container = document.getElementById("liveToast");
  const bgClass = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : "bg-warning");
  const textClass = type === "warning" ? "text-dark" : "text-white";
  container.innerHTML = `<div class="toast align-items-center ${bgClass} ${textClass} border-0 show"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
  const toastEl = container.querySelector('.toast');
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();
  setTimeout(() => toastEl?.remove(), 3200);
}

async function confirmAction(message, confirmText = "Confirmar") {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar'
  });
  return result.isConfirmed;
}

// ======================== EDICIÓN ========================
let currentEditItem = null;
function openEditModal(type, id) {
  let item, fields = "";
  if (type === "user") item = usersData.find(u => u.id === id);
  else if (type === "company") item = companiesData.find(c => c.id === id);
  else if (type === "job") item = jobsData.find(j => j.id === id);
  if (!item) return;
  currentEditItem = { type, id, item };
  
  if (type === "user") {
    fields = `<div class="mb-3"><label>Nombre</label><input type="text" id="editName" class="form-control" value="${item.name}"></div>
              <div class="mb-3"><label>Email</label><input type="email" id="editEmail" class="form-control" value="${item.email}"></div>
              <div class="mb-3"><label>Rol</label><select id="editRole" class="form-select">
                <option ${item.role === "admin" ? "selected" : ""} value="admin">Administrador</option>
                <option ${item.role === "candidato" ? "selected" : ""} value="candidato">Candidato</option>
                <option ${item.role === "empresa" ? "selected" : ""} value="empresa">Empresa</option>
              </select></div>`;
  } else if (type === "company") {
    fields = `<div class="mb-3"><label>Nombre</label><input type="text" id="editName" class="form-control" value="${item.name}"></div>
              <div class="mb-3"><label>Email</label><input type="email" id="editEmail" class="form-control" value="${item.email}"></div>
              <div class="mb-3"><label>Teléfono</label><input type="text" id="editPhone" class="form-control" value="${item.phone || ""}"></div>`;
  } else if (type === "job") {
    fields = `<div class="mb-3"><label>Título</label><input type="text" id="editTitle" class="form-control" value="${item.title}"></div>
              <div class="mb-3"><label>Empresa</label><input type="text" id="editCompany" class="form-control" value="${item.company}"></div>
              <div class="mb-3"><label>Tipo</label><input type="text" id="editType" class="form-control" value="${item.type}"></div>
              <div class="mb-3"><label>Ubicación</label><input type="text" id="editLocation" class="form-control" value="${item.location}"></div>`;
  }
  document.getElementById("editModalBody").innerHTML = fields;
  new bootstrap.Modal(document.getElementById("editModal")).show();
}

document.getElementById("saveEditBtn").addEventListener("click", () => {
  if (!currentEditItem) return;
  const { type, id, item } = currentEditItem;
  if (type === "user") {
    item.name = document.getElementById("editName").value;
    item.email = document.getElementById("editEmail").value;
    item.role = document.getElementById("editRole").value;
  } else if (type === "company") {
    item.name = document.getElementById("editName").value;
    item.email = document.getElementById("editEmail").value;
    item.phone = document.getElementById("editPhone").value;
    // Actualizar también en usersData
    const user = usersData.find(u => u.email === item.email);
    if (user) {
      user.name = item.name;
      user.profile = user.profile || {};
      user.profile.phone = item.phone;
    }
  } else if (type === "job") {
    item.title = document.getElementById("editTitle").value;
    item.company = document.getElementById("editCompany").value;
    item.type = document.getElementById("editType").value;
    item.location = document.getElementById("editLocation").value;
    // Actualizar en el storage de la empresa correspondiente
    const comp = companiesData.find(c => c.name === item.company);
    if (comp) {
      const key = `company_jobs_${comp.email}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        let jobs = JSON.parse(stored);
        const idx = jobs.findIndex(j => j.id == id);
        if (idx !== -1) {
          jobs[idx] = { ...jobs[idx], title: item.title, type: item.type, location: item.location };
          localStorage.setItem(key, JSON.stringify(jobs));
        }
      }
    }
  }
  
  if (type === "user") {
    saveUsers();
    // Refrescar empresas porque pueden cambiar nombres
    companiesData = usersData.filter(u => u.role === "empresa").map((u, idx) => ({
      id: idx + 1,
      name: u.name,
      email: u.email,
      phone: u.profile?.phone || "N/A",
      status: u.status === "active" ? "verified" : "pending"
    }));
  }
  
  if (type === "user") renderUsersTable(currentPage.users, document.getElementById("searchUsers").value);
  if (type === "company") renderCompaniesTable(currentPage.companies, document.getElementById("searchCompanies").value);
  if (type === "job") renderJobsTable(currentPage.jobs, document.getElementById("searchJobs").value);
  
  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
  showToast("Elemento actualizado", "success");
});

// ======================== EVENTOS GLOBALES ========================
document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
  initNavigation();
  renderUsersTable(1, "");
  renderCompaniesTable(1, "");
  renderJobsTable(1, "");
  renderReports(1);
  renderMainChart('bar');
  renderDonutChart();
  renderStatsTable();

  document.getElementById("searchUsers").addEventListener("input", (e) => { currentPage.users = 1; renderUsersTable(1, e.target.value); });
  document.getElementById("searchCompanies").addEventListener("input", (e) => { currentPage.companies = 1; renderCompaniesTable(1, e.target.value); });
  document.getElementById("searchJobs").addEventListener("input", (e) => { currentPage.jobs = 1; renderJobsTable(1, e.target.value); });

  document.querySelectorAll(".btn-chart").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-chart").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMainChart(btn.getAttribute("data-chart"));
    });
  });

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = parseInt(btn.getAttribute("data-id"));
    
    if (action === "toggle-user") {
      const user = usersData.find(u => u.id === id);
      if (user && await confirmAction(`¿${user.status === "active" ? "bloquear" : "desbloquear"} al usuario ${user.name}?`)) {
        user.status = user.status === "active" ? "blocked" : "active";
        saveUsers();
        // Actualizar estado en companiesData
        companiesData = usersData.filter(u => u.role === "empresa").map((u, idx) => ({
          id: idx + 1,
          name: u.name,
          email: u.email,
          phone: u.profile?.phone || "N/A",
          status: u.status === "active" ? "verified" : "pending"
        }));
        renderUsersTable(currentPage.users, document.getElementById("searchUsers").value);
        showToast(`Usuario ${user.status === "active" ? "desbloqueado" : "bloqueado"}`, "success");
      }
    }
    if (action === "delete-job") {
      const job = jobsData.find(j => j.id === id);
      if (job && await confirmAction(`¿Eliminar la vacante "${job.title}" permanentemente?`)) {
        // Eliminar del storage de la empresa
        const comp = companiesData.find(c => c.name === job.company);
        if (comp) {
          const key = `company_jobs_${comp.email}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            let jobs = JSON.parse(stored);
            jobs = jobs.filter(j => j.id != id);
            localStorage.setItem(key, JSON.stringify(jobs));
          }
        }
        jobsData = jobsData.filter(j => j.id !== id);
        renderJobsTable(currentPage.jobs, document.getElementById("searchJobs").value);
        showToast("Vacante eliminada", "danger");
      }
    }
    if (action === "delete-report") {
      if (await confirmAction("¿Eliminar este contenido reportado?")) {
        reportsData = reportsData.filter(r => r.id !== id);
        renderReports(currentPage.reports);
        showToast("Contenido eliminado", "danger");
      }
    }
    if (action === "ignore-report") {
      reportsData = reportsData.filter(r => r.id !== id);
      renderReports(currentPage.reports);
      showToast("Reporte ignorado", "info");
    }
  });

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-action.edit");
    if (editBtn && !editBtn.hasAttribute("data-action")) {
      const type = editBtn.getAttribute("data-type");
      const id = parseInt(editBtn.getAttribute("data-id"));
      openEditModal(type, id);
    }
  });

  document.getElementById("btnLogout").addEventListener("click", () => {
    Swal.fire({
      title: 'Cerrar sesión',
      text: '¿Estás seguro de que quieres salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("empleoya_current_user");
        showToast("Cerrando sesión...", "info");
        setTimeout(() => window.location.href = "login.html", 1000);
      }
    });
  });
});

// ======================== GRÁFICAS ========================
let mainChart, donutChart;
const monthlyData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  usuarios: [65, 78, 92, 110, 135, 160],
  vacantes: [45, 52, 58, 65, 72, 80],
  postulaciones: [320, 380, 450, 520, 610, 720]
};
function renderMainChart(type = 'bar') {
  const ctx = document.getElementById('mainChart').getContext('2d');
  if (mainChart) mainChart.destroy();
  mainChart = new Chart(ctx, {
    type: type,
    data: { labels: monthlyData.labels, datasets: [
      { label: 'Usuarios', data: monthlyData.usuarios, backgroundColor: '#2563eb', borderRadius: 6 },
      { label: 'Vacantes', data: monthlyData.vacantes, backgroundColor: '#60a5fa', borderRadius: 6 },
      { label: 'Postulaciones', data: monthlyData.postulaciones, backgroundColor: '#93c5fd', borderRadius: 6 }
    ] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
  });
}
function renderDonutChart() {
  const ctx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Tecnología', 'Empresas', 'Candidatos', 'Diseño'], datasets: [{ data: [45, 30, 15, 10], backgroundColor: ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'], borderWidth: 0 }] },
    options: { cutout: '60%', plugins: { legend: { position: 'bottom' } } }
  });
}
function renderStatsTable() {
  const tbody = document.getElementById("statsTable");
  let html = "";
  for (let i = 0; i < monthlyData.labels.length; i++) {
    const growth = i === 0 ? "—" : `${Math.round(((monthlyData.usuarios[i] - monthlyData.usuarios[i-1]) / monthlyData.usuarios[i-1]) * 100)}%`;
    html += `<tr><td><strong>${monthlyData.labels[i]}</strong></td><td>${monthlyData.usuarios[i]}</td><td>${monthlyData.vacantes[i]}</td><td>${monthlyData.postulaciones[i]}</td><td class="${growth !== '—' && growth > 0 ? 'text-success' : 'text-danger'}">${growth}</td></tr>`;
  }
  tbody.innerHTML = html;
}

function initNavigation() {
  const menuItems = document.querySelectorAll(".nav-menu li");
  const sections = document.querySelectorAll(".section-card");
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const sectionId = item.getAttribute("data-section");
      menuItems.forEach(m => m.classList.remove("active"));
      item.classList.add("active");
      sections.forEach(sec => sec.style.display = "none");
      document.getElementById(`${sectionId}-section`).style.display = "block";
      if (sectionId === "users") renderUsersTable(currentPage.users, document.getElementById("searchUsers").value);
      if (sectionId === "companies") renderCompaniesTable(currentPage.companies, document.getElementById("searchCompanies").value);
      if (sectionId === "jobs") renderJobsTable(currentPage.jobs, document.getElementById("searchJobs").value);
      if (sectionId === "content") renderReports(currentPage.reports);
      if (sectionId === "stats") { renderMainChart('bar'); renderDonutChart(); renderStatsTable(); }
    });
  });
}