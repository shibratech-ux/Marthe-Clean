
                            document.addEventListener("DOMContentLoaded", function () {
                                const dropdownItems = document.querySelectorAll(".dropdown-item");
                                const savedLang = localStorage.getItem("selectedLanguage");

                                function updateMenu(lang) {
                                    document.querySelectorAll(".karx-main-menu").forEach(menu => {
                                        menu.style.display = "none";
                                    });
                                    const target = document.querySelector(`.karx-main-menu.${lang}`);
                                    if (target) {
                                        target.style.display = "block";
                                    } else {
                                        const fallback = document.querySelector(".karx-main-menu.de");
                                        if (fallback) fallback.style.display = "block";
                                    }
                                }

                                updateMenu(savedLang || "en");

                                // Store and update language selection
                                dropdownItems.forEach(item => {
                                    item.addEventListener("click", function () {
                                        const lang = this.getAttribute("data-lang");
                                        localStorage.setItem("selectedLanguage", lang);
                                        updateMenu(lang);
                                    });
                                });
                            });
                        
