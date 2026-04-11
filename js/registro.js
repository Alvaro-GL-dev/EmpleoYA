// ======================== GESTIÓN DE USUARIOS (LOCALSTORAGE) ========================
function getUsers() {
  const stored = localStorage.getItem("empleoya_users");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch(e) { return []; }
  }
  // Usuarios demo iniciales (para que login tenga datos)
  return [
    { email: "juan@empleoya.com", password: "123456", name: "Juan Pérez", role: "candidato", profile: { title: "Desarrollador Full Stack", phone: "(503) 7012-3456", avatar: "JP" } },
    { email: "techcorp@empleoya.com", password: "empresa123", name: "TechCorp Solutions", role: "empresa", profile: { website: "https://techcorp.com", description: "Empresa líder en tecnología" } }
  ];
}

function saveUsers(users) {
  localStorage.setItem("empleoya_users", JSON.stringify(users));
}

function addUser(email, password, name, role, extraProfile = {}) {
  const users = getUsers();
  const exists = users.find(u => u.email === email);
  if (exists) return false;
  
  let profile = {};
  if (role === "candidato") {
    profile = { title: "Profesional en búsqueda activa", phone: extraProfile.phone || "", avatar: name.charAt(0) };
  } else {
    profile = { website: "", description: "Empresa registrada en EmpleoYa", phone: extraProfile.phone || "" };
  }
  
  const newUser = {
    email, password, name, role,
    profile: { ...profile, ...extraProfile }
  };
  users.push(newUser);
  saveUsers(users);
  return true;
}

// ======================== VALIDACIÓN Y REGISTRO ========================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

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
  setTimeout(() => { if(toastEl) toastEl.remove(); }, 3800);
}

// Registrar candidato
document.getElementById("registerCandidatoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("candidatoNombre").value.trim();
  const email = document.getElementById("candidatoEmail").value.trim();
  const telefono = document.getElementById("candidatoTelefono").value.trim();
  const password = document.getElementById("candidatoPassword").value;
  const confirm = document.getElementById("candidatoConfirmPassword").value;
  const terms = document.getElementById("termsCandidato").checked;

  if (!nombre || !email || !password || !confirm) {
    showToast("Completa todos los campos obligatorios", "warning");
    return;
  }
  if (!validateEmail(email)) {
    showToast("Correo electrónico no válido", "danger");
    return;
  }
  if (password.length < 4) {
    showToast("La contraseña debe tener al menos 4 caracteres", "warning");
    return;
  }
  if (password !== confirm) {
    showToast("Las contraseñas no coinciden", "danger");
    return;
  }
  if (!terms) {
    showToast("Debes aceptar los términos y condiciones", "warning");
    return;
  }

  const success = addUser(email, password, nombre, "candidato", { phone: telefono });
  if (success) {
    showToast("¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } else {
    showToast("El correo ya está registrado. Intenta con otro o inicia sesión.", "danger");
  }
});

// Registrar empresa
document.getElementById("registerEmpresaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("empresaNombre").value.trim();
  const email = document.getElementById("empresaEmail").value.trim();
  const telefono = document.getElementById("empresaTelefono").value.trim();
  const password = document.getElementById("empresaPassword").value;
  const confirm = document.getElementById("empresaConfirmPassword").value;
  const terms = document.getElementById("termsEmpresa").checked;

  if (!nombre || !email || !password || !confirm) {
    showToast("Completa todos los campos obligatorios", "warning");
    return;
  }
  if (!validateEmail(email)) {
    showToast("Correo electrónico no válido", "danger");
    return;
  }
  if (password.length < 4) {
    showToast("La contraseña debe tener al menos 4 caracteres", "warning");
    return;
  }
  if (password !== confirm) {
    showToast("Las contraseñas no coinciden", "danger");
    return;
  }
  if (!terms) {
    showToast("Debes aceptar los términos y condiciones", "warning");
    return;
  }

  const success = addUser(email, password, nombre, "empresa", { phone: telefono });
  if (success) {
    showToast("Empresa registrada exitosamente. Redirigiendo al login...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } else {
    showToast("El correo ya está registrado. Usa otro o inicia sesión.", "danger");
  }
});

// ======================== SOCIAL REGISTRO SIMULADO ========================
function socialRegister(provider, role) {
  let demoEmail = "";
  let demoName = "";
  if (provider === "google") { demoEmail = "usuario@gmail.com"; demoName = "Usuario Google"; }
  else if (provider === "linkedin") { demoEmail = "linkedin@profesional.com"; demoName = "Carlos López"; }
  else { demoEmail = "facebook.user@example.com"; demoName = "Ana María"; }
  
  // Ajustar nombre según rol
  if (role === "empresa") {
    demoName = demoName + " Corp";
    demoEmail = demoEmail.replace("@", ".empresa@");
  }
  
  const users = getUsers();
  const exists = users.find(u => u.email === demoEmail);
  if (!exists) {
    addUser(demoEmail, "social123", demoName, role, { phone: "000-000-0000" });
    showToast(`Registro con ${provider} exitoso. Redirigiendo al login...`, "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } else {
    showToast(`Ya existe una cuenta con ${provider}. Por favor inicia sesión.`, "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}

document.getElementById("socialGoogleReg").addEventListener("click", () => {
  const activeTab = document.querySelector("#registerRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialRegister("google", role);
});
document.getElementById("socialLinkedinReg").addEventListener("click", () => {
  const activeTab = document.querySelector("#registerRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialRegister("linkedin", role);
});
document.getElementById("socialFacebookReg").addEventListener("click", () => {
  const activeTab = document.querySelector("#registerRoleTab .nav-link.active").getAttribute("data-bs-target");
  const role = activeTab === "#candidatoPanel" ? "candidato" : "empresa";
  socialRegister("facebook", role);
});

// ======================== ANIMACIÓN DE ICONOS AL CAMBIAR TAB ========================
function animateIconOnTabChange(role) {
  const iconCandidato = document.getElementById("iconCandidato");
  const iconEmpresa = document.getElementById("iconEmpresa");
  if (!iconCandidato || !iconEmpresa) return;
  
  if (role === "candidato") {
    iconCandidato.style.transform = "scale(1.05)";
    iconEmpresa.style.transform = "scale(0.95)";
    setTimeout(() => {
      iconCandidato.style.transform = "scale(1)";
      iconEmpresa.style.transform = "scale(1)";
    }, 300);
  } else {
    iconEmpresa.style.transform = "scale(1.05)";
    iconCandidato.style.transform = "scale(0.95)";
    setTimeout(() => {
      iconEmpresa.style.transform = "scale(1)";
      iconCandidato.style.transform = "scale(1)";
    }, 300);
  }
}

document.querySelectorAll('#registerRoleTab .nav-link').forEach(tab => {
  tab.addEventListener('shown.bs.tab', (event) => {
    const targetId = event.target.getAttribute("data-bs-target");
    const role = targetId === "#candidatoPanel" ? "candidato" : "empresa";
    animateIconOnTabChange(role);
  });
});

// ======================== NAVEGACIÓN Y UTILIDADES ========================
document.getElementById("goToLoginBtn")?.addEventListener("click", () => {
  window.location.href = "login.html";
});
document.getElementById("goToLoginLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "login.html";
});
document.getElementById("goToRegisterBtn")?.addEventListener("click", () => {
  // Ya estamos en registro, solo recargar o scroll
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById("uploadCVBtn")?.addEventListener("click", () => {
  showToast("Para cargar tu CV, primero debes iniciar sesión.", "warning");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});
document.getElementById("goToPublicJobs")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});

// Limpiar campos al cambiar de pestaña? Opcional: mantener lógica pero no necesario.
// Si ya hay sesión activa, redirigir al dashboard correspondiente
const currentUser = localStorage.getItem("empleoya_current_user");
if (currentUser && !window.location.pathname.includes("registro.html")) {
  try {
    const session = JSON.parse(currentUser);
    if (session.loggedIn) {
      if (session.role === "candidato") window.location.href = "candidato-dashboard.html";
      else window.location.href = "empresa.html";
    }
  } catch(e) {}
}