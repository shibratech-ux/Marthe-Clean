
        (function () {
            const hoursSelect = document.getElementById("detailHours");
            const priceDisplay = document.getElementById("detailPriceDisplay");
            const priceHidden = document.getElementById("detailPriceValue");
            const PRICE_PER_HOUR = 45;

            const formatCurrency = (value) => {
                if (!value) return "0";
                try {
                    return new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 }).format(value);
                } catch (err) {
                    return value.toString();
                }
            };

            const derivePriceFromHours = (hoursValue) => {
                if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
                    return 0;
                }
                if (hoursSelect) {
                    const option = Array.from(hoursSelect.options || []).find(
                        (opt) => Number(opt.value) === Number(hoursValue)
                    );
                    if (option) {
                        const rawPrice = option.getAttribute("data-price");
                        if (rawPrice && Number.isFinite(Number(rawPrice))) {
                            return Number(rawPrice);
                        }
                    }
                }
                return hoursValue * PRICE_PER_HOUR;
            };

            const getSelectedHours = () => Number(hoursSelect ? hoursSelect.value : 0);

            const calculateTotal = (forcedHours) => {
                const hoursValue = Number.isFinite(forcedHours) ? Number(forcedHours) : getSelectedHours();
                return derivePriceFromHours(hoursValue);
            };

            const updatePriceUI = () => {
                const selectedHours = getSelectedHours();
                const total = calculateTotal(selectedHours);
            const hoursLabel = selectedHours === 1 ? "heure" : "heures";
                if (priceDisplay) {
                    priceDisplay.value = total
                        ? `CHF ${formatCurrency(total)}${selectedHours ? ` – ${selectedHours} ${hoursLabel}` : ""}`
                        : "CHF 0";
                }
                if (priceHidden) {
                    priceHidden.value = total;
                }
                return total;
            };

            if (hoursSelect) {
                ["change", "input"].forEach((evt) => {
                    hoursSelect.addEventListener(evt, updatePriceUI);
                });
            }

            window.moveServiceQuoteFr = {
                updatePriceUI,
                calculatePrice: calculateTotal
            };

            updatePriceUI();
        })();
    
