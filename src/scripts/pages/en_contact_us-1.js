
  document.addEventListener("DOMContentLoaded", function() {
    const dropdownItems = document.querySelectorAll(".dropdown-item");
    const savedLang = localStorage.getItem("selectedLanguage");

    // Show correct menu based on stored language
    function updateMenu(lang) {
      document.querySelectorAll(".karx-main-menu").forEach(menu => {
        menu.style.display = "none";
      });
      const targetMenu = document.querySelector(`.karx-main-menu.${lang}`);
      if (targetMenu) {
        targetMenu.style.display = "block";
      } else {
        const fallback = document.querySelector(".karx-main-menu.en");
        if (fallback) fallback.style.display = "block";
      }
    }

    // Apply saved language or default to 'EN'
    updateMenu(savedLang || "en");

    // Store and update language selection
    dropdownItems.forEach(item => {
      item.addEventListener("click", function() {
        const lang = this.getAttribute("data-lang");
        localStorage.setItem("selectedLanguage", lang);
        updateMenu(lang);
      });
    });
  });

