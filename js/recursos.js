// Filtros y busqueda para recursos.html
(function () {
  function normalizeText(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function mapTabToCategory(tabLabel) {
    const label = normalizeText(tabLabel);
    if (label === "todos") return "todos";
    if (label.includes("curso")) return "cursos";
    if (label.includes("guia")) return "guias";
    if (label.includes("consejo")) return "consejos";
    if (label.includes("plantilla")) return "plantillas cv";
    return "todos";
  }

  function mapCardToCategory(cardCol) {
    const badgeText = normalizeText(cardCol.querySelector(".badge-type")?.textContent);
    const titleText = normalizeText(cardCol.querySelector("h6")?.textContent);

    if (badgeText.includes("guia")) return "guias";
    if (badgeText.includes("consejo")) return "consejos";
    if (badgeText.includes("cv") || titleText.includes("plantilla")) return "plantillas cv";
    if (badgeText.includes("curso")) return "cursos";
    return "todos";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".tabs-wrap .nav-tabs .nav-link"));
    const cards = Array.from(document.querySelectorAll(".section-main .col-lg-9 .row.g-3 > .col-md-4"));
    const searchInput = document.querySelector(".search-box input");
    const searchBtn = document.querySelector(".search-box .btn-search");

    if (!tabs.length || !cards.length || !searchInput) return;

    const cardGrid = cards[0].parentElement;
    const emptyState = document.createElement("div");
    emptyState.className = "col-12";
    emptyState.style.display = "none";
    emptyState.innerHTML =
      '<div class="text-center py-5 text-muted"><i class="bi bi-search me-1"></i>No encontramos recursos con esos filtros.</div>';
    cardGrid.appendChild(emptyState);

    cards.forEach((card) => {
      const category = mapCardToCategory(card);
      const searchable = normalizeText(card.textContent);
      card.dataset.category = category;
      card.dataset.searchable = searchable;
    });

    let activeCategory = mapTabToCategory(tabs.find((t) => t.classList.contains("active"))?.textContent || "Todos");

    function applyFilters() {
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
    }

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
  });
})();
