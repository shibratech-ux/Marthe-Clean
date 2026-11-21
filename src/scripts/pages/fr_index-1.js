
  document.addEventListener("DOMContentLoaded", function() {
    const dropdownItems = document.querySelectorAll(".dropdown-item");
    const savedLang = localStorage.getItem("selectedLanguage");

    // Show correct menu based on stored language
    function updateMenu(lang) {
      document.querySelectorAll(".karx-main-menu").forEach(menu => {
        menu.style.display = "none";
      });
      const target = document.querySelector(`.karx-main-menu.${lang}`);
      if (target) {
        target.style.display = "block";
      } else {
        const fallback = document.querySelector(".karx-main-menu.fr");
        if (fallback) fallback.style.display = "block";
      }
    }

    // Page language wins: a saved choice from another page must not override it.
    const pageLang = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
    updateMenu(pageLang || savedLang || "fr");

    // Store and update language selection
    dropdownItems.forEach(item => {
      item.addEventListener("click", function() {
        const lang = this.getAttribute("data-lang");
        localStorage.setItem("selectedLanguage", lang);
        updateMenu(lang);
      });
    });
  });

