
        (function () {
            const hoursSelect = document.getElementById("hours");
            const serviceSelect = document.getElementById("serviceType");
            const apartmentsInput = document.getElementById("apartments");
            const finalPriceDisplay = document.getElementById("finalPriceDisplay");
            const finalPriceHidden = document.getElementById("finalPriceValue");
            const serviceDetailsContainer = document.getElementById("serviceLandingDetails");
            const serviceDetailsText = document.getElementById("serviceLandingDescription");
            const serviceDetailsPrice = document.getElementById("serviceLandingPrice");

            // Base prices per service type
            const PRICES = {
                "Normalreinigung": 40,
                "Spezialreinigung": 45,
                "Umzugsreinigung": 45
            };

            const getHourlyPrice = () => {
                if (!serviceSelect) return 0;
                const service = serviceSelect.value;
                return PRICES[service] || 0; // Default to 0 if no service selected
            };

            const calculateTotalPrice = (hoursCount) => {
                const hourlyPrice = getHourlyPrice();
                const hoursValue = Number(hoursCount);

                if (!Number.isFinite(hoursValue) || hoursValue <= 0) return 0;
                return hoursValue * hourlyPrice;
            };

            const formatCurrency = (value) => {
                if (!value) return "0";
                try {
                    return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(value);
                } catch (err) {
                    return value.toString();
                }
            };

            const applyServiceContextFromQuery = () => {
                const params = new URLSearchParams(window.location.search);
                const requestedService = params.get("service");
                if (!requestedService) return;

                const serviceCopy = {
                    "Normalreinigung": {
                        text: "Unsere Normalreinigung umfasst alle Räume Ihres Haushalts – von Schlaf- und Wohnzimmern bis hin zu Küche und Badezimmer.",
                        price: "40 CHF pro Stunde"
                    },
                    "Spezialreinigung": {
                        text: "Sie wünschen eine besonders gründliche Reinigung Ihrer Haushaltsgeräte und Einrichtungen, wie Backofen, Kühlschrank oder Fenster? Dann ist unsere Spezialreinigung genau das Richtige für Sie.",
                        price: ""
                    },
                    "Umzugsreinigung": {
                        text: "Bei einem Umzug übernehmen wir für Sie die sorgfältige Endreinigung vor der Wohnungs- oder Hausübergabe.",
                        price: ""
                    }
                };

                const content = serviceCopy[requestedService];
                if (!content) return;

                if (serviceDetailsContainer && serviceDetailsText) {
                    serviceDetailsContainer.style.display = "block";
                    serviceDetailsText.textContent = content.text;
                    if (serviceDetailsPrice) {
                        if (content.price) {
                            serviceDetailsPrice.textContent = content.price;
                            serviceDetailsPrice.style.display = "block";
                        } else {
                            serviceDetailsPrice.textContent = "";
                            serviceDetailsPrice.style.display = "none";
                        }
                    }
                }

                if (serviceSelect) {
                    serviceSelect.value = requestedService;
                    const changeEvent = new Event("change", { bubbles: true });
                    serviceSelect.dispatchEvent(changeEvent);
                    if (typeof window !== "undefined" && window.jQuery) {
                        const $select = window.jQuery(serviceSelect);
                        if (typeof $select.trigger === "function") {
                            $select.trigger("change");
                        }
                    }
                }
            };

            const updatePriceUI = () => {
                const total = calculateTotalPrice(hoursSelect ? hoursSelect.value : 0);
                if (finalPriceDisplay) {
                    finalPriceDisplay.value = total ? `CHF ${formatCurrency(total)}` : "CHF 0";
                }
                if (finalPriceHidden) {
                    finalPriceHidden.value = total;
                }
                return total;
            };

            if (hoursSelect) {
                $(hoursSelect).on("change", updatePriceUI);
                $(hoursSelect).on("input", updatePriceUI);
            }

            if (serviceSelect) {
                $(serviceSelect).on("change", updatePriceUI);
            }

            if (apartmentsInput) {
                $(apartmentsInput).on("change", updatePriceUI);
                $(apartmentsInput).on("input", updatePriceUI);
            }

            applyServiceContextFromQuery();
            updatePriceUI();

            window.marthaQuote = {
                calculatePrice: calculateTotalPrice,
                updatePriceUI
            };
        })();
    
