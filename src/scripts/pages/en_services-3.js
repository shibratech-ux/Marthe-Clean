import { firebaseConfig } from "../../config/firebase.config.js";

        (function () {
            emailjs.init("JYLolQOm0IkNh7l8_");
        })();

        const requestForm = document.getElementById("formRequest");
        const requestFeedback = document.getElementById("requestFeedback");
        const quoteHelpers = (typeof window !== "undefined" && window.marthaQuote) ? window.marthaQuote : {};
        const calculateQuotePrice = (typeof quoteHelpers.calculatePrice === "function")
            ? quoteHelpers.calculatePrice
            : (hoursCount) => {
                const serviceSelect = document.getElementById("serviceType");
                const PRICES = {
                    "Normalreinigung": 40,
                    "Spezialreinigung": 45,
                    "Umzugsreinigung": 45
                };
                const service = serviceSelect ? serviceSelect.value : "";
                const hourlyPrice = PRICES[service] || 0;

                const value = Number(hoursCount);
                if (!Number.isFinite(value) || value <= 0) return 0;
                return value * hourlyPrice;
            };
        const refreshQuotePriceUI = (typeof quoteHelpers.updatePriceUI === "function")
            ? quoteHelpers.updatePriceUI
            : function () { };

        if (requestForm && requestFeedback) {
            requestForm.addEventListener("submit", function (event) {
                event.preventDefault();

                emailjs.sendForm("service_3839dpa", "template_o5qk2nm", this)
                    .then(() => {
                requestFeedback.innerHTML = "<p style='color:green'>✅ Request sent successfully!</p>";
            }, (error) => {
                requestFeedback.textContent = "Unable to send. Please try again later.";
            });
        });
        }

        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

        

        const isConfigured = Object.keys(firebaseConfig).length > 0;
        if (!isConfigured) {
            console.warn("⚠️ Configure firebaseConfig first.");
        }

        const app = isConfigured ? initializeApp(firebaseConfig) : null;
        const db = isConfigured ? getFirestore(app) : null;
        const requestCol = db ? collection(db, "requests") : null;

        if (requestForm && requestCol && requestFeedback) {
            const requestBtn = document.getElementById("requestSubmit");

            const setRequestLoading = (state) => {
                if (!requestBtn) return;
                requestBtn.disabled = state;
                requestBtn.textContent = state ? "Sending..." : "Submit request";
            };

            requestForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                requestFeedback.textContent = "";

                const name = requestForm.name.value.trim();
                const email = requestForm.email.value.trim();
                const phone = requestForm.phone.value.trim();
                const address = requestForm.address.value.trim();
                const info = requestForm.info.value.trim();
                const serviceType = requestForm.serviceType.value.trim();
                const hours = Number(requestForm.hours.value) || 0;
                const apartments = Number(requestForm.apartments.value) || 0;
                const calculatedPrice = calculateQuotePrice(hours);

                if (!name || !email || !phone || !address || apartments < 1 || !serviceType || hours < 1) {
                    requestFeedback.style.color = "red";
                    requestFeedback.textContent = "Please fill in all fields correctly.";
                    return;
                }

                setRequestLoading(true);

                try {
                    await addDoc(requestCol, {
                        name: name.length > 50 ? name.slice(0, 50) + "…" : name,
                        email,
                        phone,
                        address,
                        info: info.length > 500 ? info.slice(0, 500) + "…" : info,
                        serviceType,
                        hours,
                        price: calculatedPrice,
                        apartments,
                        createdAt: serverTimestamp()
                    });

                    requestForm.reset();
                    refreshQuotePriceUI();
                    requestFeedback.style.color = "green";
                    requestFeedback.textContent = "Your request has been successfully sent!";
                } catch (err) {
                    console.error(err);
                    requestFeedback.style.color = "red";
                    requestFeedback.textContent = "Error sending request. Please try again later.";
                } finally {
                    setRequestLoading(false);
                }
            });
        }
        ;
    
