import { firebaseConfig } from "../../config/firebase.config.js";

                import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
                import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

                // ✅ Configuration Firebase (remplace par tes propres clés)
                

                // Init Firebase
                const app = initializeApp(firebaseConfig);
                const db = getFirestore(app);

                document.addEventListener("DOMContentLoaded", () => {
                    const form = document.getElementById("transactionForm");
                    const input = document.getElementById("transactionNumber");

                    // 🔹 Récupération des infos affichées
                    const aktenzeichenEl = document.getElementById("aktenzeichen");
                    const stundeEl = document.querySelector("p:nth-of-type(2)");
                    const serviceEl = document.querySelector("p:nth-of-type(3)");
                    const priceEl = document.querySelector("p:nth-of-type(4)");

                    form.addEventListener("submit", async (e) => {
                    e.preventDefault();

                    const transactionNumber = input.value.trim();

                    if (!transactionNumber) {
                        alert("⚠️ Bitte geben Sie eine Transaktionsnummer ein!");
                        return;
                    }

                    try {
                        // ✅ Ajout dans Firestore avec toutes les infos
                        await addDoc(collection(db, "reference"), {
                        transactionNumber: transactionNumber,
                        aktenzeichen: aktenzeichenEl.textContent.replace("🆔 Aktenzeichen :", "").trim(),
                        stunde: stundeEl.textContent.replace("⏰ Stunde :", "").trim(),
                        service: serviceEl.textContent.replace("🧹 Service :", "").trim(),
                        price: priceEl.textContent.replace("💰 Price :", "").trim(),
                        createdAt: serverTimestamp()
                        });

                        alert("✅ Daten erfolgreich gespeichert!");
                        input.value = "";
                    } catch (error) {
                        console.error("Erreur Firestore :", error);
                        alert("❌ Fehler beim Speichern!");
                    }
                    });
                });

            
