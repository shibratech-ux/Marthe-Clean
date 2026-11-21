
        const form = document.getElementById('referenceForm');
        const inputField = document.getElementById('referenceInput');
        const dialog = document.getElementById('dialog');
        const aktenzeichen = document.getElementById('aktenzeichen');
        const closeDialog = document.getElementById('closeDialog');
        const overlay = document.getElementById('overlay');

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const inputValue = inputField.value.trim();

            if (inputValue === "") {
                inputField.focus();
                inputField.style.borderColor = 'red';
            } else {
                inputField.style.borderColor = '';
                aktenzeichen.textContent = "🆔 Aktenzeichen : " + inputValue;

                overlay.style.display = 'block';
                dialog.style.display = 'block';
                dialog.style.transform = 'translate(-50%, -60%)';
                setTimeout(() => {
                    overlay.style.opacity = 1;
                    dialog.style.opacity = 1;
                    dialog.style.transform = 'translate(-50%, -50%)';
                }, 10);
            }
        });

        // Fermer le dialogue avec transition verticale
        closeDialog.addEventListener('click', () => {
            dialog.style.opacity = 0;
            dialog.style.transform = 'translate(-50%, -60%)';
            overlay.style.opacity = 0;

            setTimeout(() => {
                dialog.style.display = 'none';
                overlay.style.display = 'none';
                inputField.value = "";
                document.getElementById('transactionNumber').value = ""; // vide le champ transaction
            }, 400);
        });
        
