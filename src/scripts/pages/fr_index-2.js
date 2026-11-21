import { firebaseConfig } from "../../config/firebase.config.js";
import { initReviews } from "../reviews.js";



            (function() {
        // ⚠️ Remplace par ta vraie clé publique
        emailjs.init("JYLolQOm0IkNh7l8_");
    })();

      document.getElementById("formRequest").addEventListener("submit", function(event) {
        event.preventDefault();

        // Envoi avec EmailJS
        emailjs.sendForm("service_3839dpa", "template_o5qk2nm", this)
        .then(() => {
            document.getElementById("requestFeedback").innerHTML = 
            "<p style='color:green'>✅ Anfrage erfolgreich gesendet!</p>";
        }, (error) => {
            document.getElementById("requestFeedback").textContent = "Unable to send. Please try again later.";
        });
    });


        /**********************
         * Firebase Firestore *
         **********************/
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import {
            getFirestore, collection, addDoc, serverTimestamp,
            query, orderBy, limit, startAfter, getDocs, onSnapshot, where,
            getCountFromServer
        } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

        

        const isConfigured = Object.keys(firebaseConfig).length > 0;
        if (!isConfigured) {
            console.warn("⚠️ Configure firebaseConfig d’abord.");
        }

        const app = isConfigured ? initializeApp(firebaseConfig) : null;
        const db  = isConfigured ? getFirestore(app) : null;




        // Customer reviews: shared module (Google sign-in required to submit).
        try { initReviews(); } catch { console.warn("Reviews section failed to initialise."); }
        
        
        
        // Nouvelle collection pour ce formulaire
        const requestCol = db ? collection(db, "requests") : null;

        const requestForm = document.getElementById("formRequest");
        const requestBtn = document.getElementById("requestSubmit");
        const requestFeedback = document.getElementById("requestFeedback");

        const setRequestLoading = (state) => {
        requestBtn.disabled = state;
        requestBtn.textContent = state ? "Envoi…" : "Anfrage abschicken";
        };

        requestForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        requestFeedback.textContent = "";

        if (!db || !requestCol) return;

        const name = requestForm.name.value.trim();
        const email = requestForm.email.value.trim();
        const phone = requestForm.phone.value.trim();
        const address = requestForm.address.value.trim();
        const info = requestForm.info.value.trim();
        const apartments = Number(requestForm.apartments.value) || 0;

        // Validation simple
        if (!name || !email || !phone || !address || apartments < 1) {
            requestFeedback.style.color = "red";
            requestFeedback.textContent = "Veuillez remplir tous les champs correctement.";
            return;
        }

        setRequestLoading(true);

        try {
            await addDoc(requestCol, {
            name: name.length > 50 ? name.slice(0,50)+"…" : name,
            email,
            phone,
            address,
            info: info.length > 500 ? info.slice(0,500)+"…" : info,
            apartments,
            createdAt: serverTimestamp()
            });

            requestForm.reset();
            requestFeedback.style.color = "green";
            requestFeedback.textContent = "Votre demande a été envoyée avec succès !";
        } catch (err) {
            console.error(err);
            requestFeedback.style.color = "red";
            requestFeedback.textContent = "Erreur lors de l’envoi. Réessayez plus tard.";
        } finally {
            setRequestLoading(false);
        }
        });
        ;
    
