// ======================== GESTIÓN DE USUARIOS (LOCALSTORAGE) ========================
function getUsers() {
  const stored = localStorage.getItem("empleoya_users");
  let users = [];
  if (stored) {
    try { users = JSON.parse(stored); } catch(e) { users = []; }
  }
  
  // Asegurar que el administrador demo exista siempre
  const adminExists = users.some(u => u.email === "admin@empleoya.com");
  if (!adminExists) {
    users.push({
      email: "admin@empleoya.com",
      password: "admin123",
      name: "Administrador",
      role: "admin",
      profile: { avatar: "AD" }
    });
    saveUsers(users);
  }
  
  // Asegurar también el candidato y empresa demo para pruebas
  if (!users.some(u => u.email === "juan@empleoya.com")) {
    users.push({
      email: "juan@empleoya.com",
      password: "123456",
      name: "Juan Pérez",
      role: "candidato",
      profile: { title: "Desarrollador Full Stack", phone: "(503) 7012-3456", avatar: "JP" }
    });
  }
  if (!users.some(u => u.email === "techcorp@empleoya.com")) {
    users.push({
      email: "techcorp@empleoya.com",
      password: "empresa123",
      name: "TechCorp Solutions",
      role: "empresa",
      profile: { website: "https://techcorp.com", description: "Empresa líder en tecnología" }
    });
    saveUsers(users);
  }
  
  return users;
}

function saveUsers(users) {
  localStorage.setItem("empleoya_users", JSON.stringify(users));
}

function addUser(email, password, name, role) {
  const users = getUsers();
  const exists = users.find(u => u.email === email);
  if (exists) return false;
  const newUser = {
    email, password, name, role,
    profile: role === "candidato" ? { title: "Profesional en búsqueda activa", phone: "", avatar: name.charAt(0) } : (role === "admin" ? { avatar: name.charAt(0) } : { website: "", description: "" })
  };
  users.push(newUser);
  saveUsers(users);
  return true;
}

function authenticate(email, password, requestedRole) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return null;

  // Admin puede entrar por cualquier pestaña
  if (user.role === "admin") {
    const session = {
      id: user.email,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      loggedIn: true
    };
    localStorage.setItem("empleoya_current_user", JSON.stringify(session));
    return session;
  }

  // Otros roles deben coincidir con la pestaña seleccionada
  if (user.role !== requestedRole) return null;

  const session = {
    id: user.email,
    email: user.email,
    name: user.name,
    role: user.role,
    profile: user.profile,
    loggedIn: true
  };
  localStorage.setItem("empleoya_current_user", JSON.stringify(session));
  return session;
}

// function redirectToDashboard(role) {
//   if (role === "candidato") window.location.href = "candidato-dashboard.html";
//   else if (role === "empresa") window.location.href = "empresa.html";
//   else if (role === "admin") window.location.href = "admin.html";
// }

// Reemplaza esta función en tu js/login.js
function redirectToDashboard(role) {
  // Ahora todos van al perfil unificado
  window.location.href = "perfil.html";
}

// ======================== ANIMACIÓN DE ICONOS ========================
function animateIconOnTabChange(role) {
  const iconCandidato = document.getElementById("iconCandidato");
  const iconEmpresa = document.getElementById("iconEmpresa");
  if (!iconCandidato || !iconEmpresa) return;
  if (role === "candidato") {
    iconCandidato.style.transform = "scale(1.05)";
    iconEmpresa.style.transform = "scale(0.95)";
  } else {
    iconEmpresa.style.transform = "scale(1.05)";
    iconCandidato.style.transform = "scale(0.95)";
  }
  setTimeout(() => {
    iconCandidato.style.transform = "scale(1)";
    iconEmpresa.style.transform = "scale(1)";
  }, 300);
}

// ======================== LOGIN HANDLERS ========================
document.getElementById("loginCandidatoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("candidatoEmail").value;
  const password = document.getElementById("candidatoPassword").value;
  const user = authenticate(email, password, "candidato");
  if (user) {
    showToast(`¡Bienvenido ${user.name}! Redirigiendo...`, "success");
    setTimeout(() => redirectToDashboard(user.role), 1000);
  } else {
    showToast("Credenciales incorrectas o el rol no coincide.", "danger");
  }
});

document.getElementById("loginEmpresaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("empresaEmail").value;
  const password = document.getElementById("empresaPassword").value;
  const user = authenticate(email, password, "empresa");
  if (user) {
    showToast(`Acceso concedido a ${user.name}. Redirigiendo...`, "success");
    setTimeout(() => redirectToDashboard(user.role), 1000);
  } else {
    showToast("Credenciales incorrectas o el rol no coincide.", "danger");
  }
});

// ======================== REGISTRO (modal) ========================
const registerModal = new bootstrap.Modal(document.getElementById("registerModal"));
document.getElementById("openRegisterModal").addEventListener("click", (e) => {
  e.preventDefault();
  registerModal.show();
});
document.getElementById("navRegisterBtn").addEventListener("click", () => registerModal.show());

document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const role = document.getElementById("registerRole").value;
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  if (!name || !email || !password) {
    showToast("Completa todos los campos", "warning");
    return;
  }
  if (password.length < 4) {
    showToast("La contraseña debe tener al menos 4 caracteres", "warning");
    return;
  }
  // No permitir registro de admin desde el formulario público
  if (role === "admin") {
    showToast("No puedes registrarte como administrador.", "danger");
    return;
  }
  const success = addUser(email, password, name, role);
  if (success) {
    showToast("¡Registro exitoso! Ahora puedes iniciar sesión.", "success");
    registerModal.hide();
    document.getElementById("registerForm").reset();
    if (role === "candidato") {
      document.getElementById("candidatoEmail").value = email;
      document.getElementById("candidato-tab").click();
    } else {
      document.getElementById("empresaEmail").value = email;
      document.getElementById("empresa-tab").click();
    }
  } else {
    showToast("El correo ya está registrado.", "danger");
  }
});

// ======================== SOCIAL LOGIN SIMULADO ========================
function socialLogin(provider, role) {
  let demoEmail = "";
  let demoName = "";
  if (provider === "google") { demoEmail = "usuario@gmail.com"; demoName = "Usuario Google"; }
  else if (provider === "linkedin") { demoEmail = "linkedin@profesional.com"; demoName = "Carlos López"; }
  else { demoEmail = "facebook.user@example.com"; demoName = "Ana María"; }
  
  const users = getUsers();
  const exists = users.find(u => u.email === demoEmail);
  if (!exists) {
    addUser(demoEmail, "social123", demoName, role);
  }
  const user = authenticate(demoEmail, "social123", role);
  if (user) {
    showToast(`Acceso con ${provider} exitoso. Redirigiendo...`, "success");
    setTimeout(() => redirectToDashboard(user.role), 1000);
  } else {
    showToast("Error con login social", "danger");
  }
}

document.getElementById("socialGoogle").addEventListener("click", () => {
  const activeTab = document.querySelector("#loginRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialLogin("google", role);
});
document.getElementById("socialLinkedin").addEventListener("click", () => {
  const activeTab = document.querySelector("#loginRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialLogin("linkedin", role);
});
document.getElementById("socialFacebook").addEventListener("click", () => {
  const activeTab = document.querySelector("#loginRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialLogin("facebook", role);
});

// ======================== TOAST ========================
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("liveToast");
  const bgClass = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : "bg-warning");
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
document.querySelectorAll('#loginRoleTab .nav-link').forEach(tab => {
  tab.addEventListener('shown.bs.tab', (event) => {
    const targetId = event.target.getAttribute("data-bs-target");
    const role = targetId === "#candidatoPanel" ? "candidato" : "empresa";
    animateIconOnTabChange(role);
  });
});

// Redirigir si ya hay sesión activa
const current = localStorage.getItem("empleoya_current_user");
if (current && window.location.pathname.includes("login.html")) {
  try {
    const session = JSON.parse(current);
    if (session.loggedIn) {
      redirectToDashboard(session.role);
    }
  } catch (e) {}
}

document.getElementById("goToPublicJobs").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});