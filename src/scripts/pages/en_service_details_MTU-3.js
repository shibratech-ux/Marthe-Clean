import { firebaseConfig } from "../../config/firebase.config.js";

        (function () {
            emailjs.init("JYLolQOm0IkNh7l8_");
        })();

        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

        const detailForm = document.getElementById("serviceDetailForm");
        const detailFeedback = document.getElementById("serviceDetailFeedback");
        const quoteHelpers = (typeof window !== "undefined" && window.standardServiceQuoteEn) ? window.standardServiceQuoteEn : {};
        const calculateQuotePrice = (typeof quoteHelpers.calculatePrice === "function")
            ? quoteHelpers.calculatePrice
            : () => {
                const hoursField = document.getElementById("detailHours");
                const value = Number(hoursField ? hoursField.value : 0);
                if (!Number.isFinite(value) || value <= 0) return 0;
                return value * 40;
            };
        const refreshQuoteUI = (typeof quoteHelpers.updatePriceUI === "function")
            ? quoteHelpers.updatePriceUI
            : function () { };

        

        let requestCol = null;
        try {
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            requestCol = collection(db, "requests");
        } catch (err) {
            console.warn("Firebase could not be initialized.", err);
        }

        if (detailForm && detailFeedback) {
            const submitBtn = document.getElementById("serviceDetailSubmit");

            const setLoading = (state) => {
                if (!submitBtn) return;
                submitBtn.disabled = state;
                submitBtn.textContent = state ? "Sending..." : "Submit request";
                if (!state) {
                    submitBtn.innerHTML = 'Submit request <i class="fas fa-long-arrow-right"></i>';
                }
            };

            detailForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                detailFeedback.textContent = "";
                detailFeedback.style.color = "";

                const formData = new FormData(detailForm);
                const payload = {
                    name: (formData.get("name") || "").toString().trim(),
                    email: (formData.get("email") || "").toString().trim(),
                    phone: (formData.get("phone") || "").toString().trim(),
                    address: (formData.get("address") || "").toString().trim(),
                    info: (formData.get("info") || "").toString().trim(),
                    serviceType: (formData.get("serviceType") || "Normalreinigung").toString().trim(),
                    hours: Number(formData.get("hours")) || 0,
                    apartments: Number(formData.get("apartments")) || 0,
                    price: calculateQuotePrice()
                };

                if (!payload.name || !payload.email || !payload.phone || !payload.address || payload.hours < 1 || !payload.serviceType) {
                    detailFeedback.style.color = "red";
                    detailFeedback.textContent = "Please complete all required fields.";
                    return;
                }

                setLoading(true);

                try {
                    const operations = [
                        emailjs.sendForm("service_3839dpa", "template_o5qk2nm", detailForm)
                    ];

                    if (requestCol) {
                        operations.push(addDoc(requestCol, {
                            name: payload.name,
                            email: payload.email,
                            phone: payload.phone,
                            address: payload.address,
                            info: payload.info,
                            serviceType: payload.serviceType,
                            hours: payload.hours,
                            price: payload.price,
                            apartments: payload.apartments,
                            createdAt: serverTimestamp()
                        }));
                    }

                    await Promise.all(operations);

                    detailForm.reset();
                    const serviceField = document.getElementById("detailServiceType");
                    if (serviceField) serviceField.value = "Normalreinigung";

                    refreshQuoteUI();

                    detailFeedback.style.color = "green";
                    detailFeedback.textContent = "Your request has been sent.";
                } catch (err) {
                    console.error(err);
                    detailFeedback.style.color = "red";
                    detailFeedback.textContent = "An error occurred. Please try again.";
                } finally {
                    setLoading(false);
                }
            });
        }
    
