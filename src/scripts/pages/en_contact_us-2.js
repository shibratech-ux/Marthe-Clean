import { firebaseConfig } from "../../config/firebase.config.js";

  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";



  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset errors
    document.querySelectorAll(".error-message").forEach(el => el.style.display = "none");
    document.querySelectorAll("input, textarea").forEach(el => el.classList.remove("error"));

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();

    let hasError = false;

    if (!name) {
      document.getElementById("error-name").style.display = "block";
      document.getElementById("name").classList.add("error");
      hasError = true;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      document.getElementById("error-email").style.display = "block";
      document.getElementById("email").classList.add("error");
      hasError = true;
    }
    if (!phone) {
      document.getElementById("error-phone").style.display = "block";
      document.getElementById("phone").classList.add("error");
      hasError = true;
    }
    if (!message) {
      document.getElementById("error-message").style.display = "block";
      document.getElementById("message").classList.add("error");
      hasError = true;
    }

    // Stop if there are validation errors
    if (hasError) return;

    // Show loading animation
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loader"></span>Sending...`;

    try {
      await addDoc(collection(db, "contact_messages"), {
        name,
        email,
        phone,
        message,
        createdAt: new Date()
      });

      alert("Message sent successfully!");
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Error sending message!");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Send message <i class="fas fa-angle-double-right"></i>`;
    }
  });

