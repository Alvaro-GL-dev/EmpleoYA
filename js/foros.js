// Filtros y busqueda para foros.html
(function () {
  function normalizeText(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function mapLabelToCategory(label) {
    const text = normalizeText(label);
    if (text === "todos") return "todos";
    if (text.includes("entrevista")) return "entrevistas";
    if (text === "cv") return "cv";
    if (text.includes("programacion")) return "programacion";
    if (text.includes("salario")) return "salarios";
    if (text.includes("consejo")) return "consejos";
    if (text.includes("experiencia")) return "experiencia laboral";
    return "todos";
  }

  function mapThreadToCategory(thread) {
    const badge = thread.querySelector(".badge-cat");
    if (!badge) return "todos";

    const classes = Array.from(badge.classList);
    if (classes.includes("bc-entrevistas")) return "entrevistas";
    if (classes.includes("bc-cv")) return "cv";
    if (classes.includes("bc-programacion")) return "programacion";
    if (classes.includes("bc-salarios")) return "salarios";
    if (classes.includes("bc-consejos")) return "consejos";
    if (classes.includes("bc-exp")) return "experiencia laboral";

    return mapLabelToCategory(badge.textContent);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".tabs-row .nav-pills .nav-link"));
    const sidebarCategories = Array.from(document.querySelectorAll(".cat-list a"));
    const searchInput = document.querySelector(".search-wrap input");
    const threads = Array.from(document.querySelectorAll(".main-wrap .col-lg-8 .thread-card"));

    if (!tabs.length || !searchInput || !threads.length) return;

    const threadsCol = threads[0].parentElement;
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-5 text-muted";
    emptyState.style.display = "none";
    emptyState.innerHTML = '<i class="bi bi-search me-1"></i>No encontramos publicaciones con ese filtro.';
    threadsCol.appendChild(emptyState);

    threads.forEach((thread) => {
      const category = mapThreadToCategory(thread);
      const searchable = normalizeText(thread.textContent);
      thread.dataset.category = category;
      thread.dataset.searchable = searchable;
    });

    let activeCategory = mapLabelToCategory(tabs.find((tab) => tab.classList.contains("active"))?.textContent || "Todos");

    function syncSidebarActive() {
      sidebarCategories.forEach((link) => {
        const linkCategory = mapLabelToCategory(link.textContent);
        link.classList.toggle("active", linkCategory === activeCategory);
      });
    }

    function syncTabsActive() {
      const matchingTab = tabs.find((tab) => mapLabelToCategory(tab.textContent) === activeCategory);
      tabs.forEach((tab) => tab.classList.remove("active"));
      if (matchingTab) matchingTab.classList.add("active");
      else {
        const allTab = tabs.find((tab) => mapLabelToCategory(tab.textContent) === "todos");
        if (allTab) allTab.classList.add("active");
      }
    }

    function applyFilters() {
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
    }

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
  });
})();
