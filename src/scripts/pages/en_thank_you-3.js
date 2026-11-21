
    const transactionForm = document.getElementById('transactionForm');
    const submitButton = document.getElementById('submitButton');

    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page reload

        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ Sending...';

        setTimeout(() => {
            alert('Transaction submitted!');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirm';
            transactionForm.reset();
        }, 2000); // 2 seconds for simulated loading
    });


            
