document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset password page initialized');

    const resetForm = document.getElementById('resetForm');
    const emailInput = document.getElementById('resetUserId');

    // Auto-focus email input
    if (emailInput) {
        emailInput.focus();
    }

    // Client-side validation for email
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const value = this.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = value.length > 0 && emailRegex.test(value);

            // Provide visual feedback using Bootstrap classes
            if (this.classList.contains('is-invalid') && isValid) {
                this.classList.remove('is-invalid');
            } else if (!isValid && value.length > 0) {
                this.classList.add('is-invalid');
            }
        });
    }

    // Form submission validation
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            const value = emailInput ? emailInput.value.trim() : '';
            console.log('Reset form submitted with email:', value);

            if (!value) {
                e.preventDefault();
                if (emailInput) {
                    emailInput.classList.add('is-invalid');
                }
            }
        });
    }
});

