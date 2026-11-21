
    const transactionForm = document.getElementById('transactionForm');
    const submitButton = document.getElementById('submitButton');

    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Empêche le rechargement de la page

        // Change le texte du bouton pour afficher le chargement
        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ Envoi...';

        // Simuler un envoi (ex: Firebase, API, etc.)
        setTimeout(() => {
            // Ici, tu pourrais appeler ta fonction pour envoyer à Firestore
            alert('Transaction envoyée !');

            // Réinitialiser le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirmer';

            // Optionnel : réinitialiser le formulaire
            form.reset();
        }, 2000); // 2 secondes pour simuler le chargement
    });


            
