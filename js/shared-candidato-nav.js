// Shared navbar behavior for candidate resource/forum pages.
// Keeps session navigation consistent outside the dashboard.
(function () {
  function parseCurrentUser() {
    const raw = localStorage.getItem("empleoya_current_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem("empleoya_current_user");
      return null;
    }
  }

  function normalizeLabel(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getNavUrls(role) {
    if (role === "candidato") {
      return {
        home: "candidato-dashboard.html?tab=buscar",
        buscar: "candidato-dashboard.html?tab=buscar",
        solicitudes: "candidato-dashboard.html?tab=solicitudes",
        recursos: "candidato-dashboard.html?tab=recursos",
        foros: "candidato-dashboard.html?tab=foros",
        perfil: "perfil.html",
        cargarCv: "perfil.html"
      };
    }

    if (role === "empresa") {
      return {
        home: "empresa.html",
        buscar: "index.html",
        solicitudes: "empresa.html",
        recursos: "recursos.html",
        foros: "foros.html",
        perfil: "perfil.html",
        cargarCv: "perfil.html"
      };
    }

    if (role === "admin") {
      return {
        home: "perfil.html",
        buscar: "index.html",
        solicitudes: "perfil.html",
        recursos: "recursos.html",
        foros: "foros.html",
        perfil: "perfil.html",
        cargarCv: "perfil.html"
      };
    }

    return {
      home: "index.html",
      buscar: "index.html",
      solicitudes: "login.html",
      recursos: "recursos.html",
      foros: "foros.html",
      perfil: "login.html",
      cargarCv: "login.html"
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const currentUser = parseCurrentUser();
    const urls = getNavUrls(currentUser?.role);

    const brand = document.querySelector(".navbar .navbar-brand");
    if (brand) brand.setAttribute("href", urls.home);

    const links = document.querySelectorAll(".navbar .navbar-nav .nav-link");
    links.forEach((link) => {
      const label = normalizeLabel(link.textContent);
      if (label.includes("buscar")) link.setAttribute("href", urls.buscar);
      else if (label.includes("solicitudes")) link.setAttribute("href", urls.solicitudes);
      else if (label.includes("recursos")) link.setAttribute("href", urls.recursos);
      else if (label.includes("foros")) link.setAttribute("href", urls.foros);
      else if (label.includes("perfil")) link.setAttribute("href", urls.perfil);
    });

    const uploadCvBtn = document.querySelector(".navbar .btn-nav-primary");
    if (uploadCvBtn) uploadCvBtn.setAttribute("href", urls.cargarCv);

    const logoutBtn = document.querySelector(".navbar .btn-nav-outline");
    if (logoutBtn) {
      logoutBtn.setAttribute("href", "#");
      logoutBtn.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("empleoya_current_user");
        window.location.href = "index.html";
      });
    }
  });
})();
