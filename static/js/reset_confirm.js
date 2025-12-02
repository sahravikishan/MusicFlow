document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset confirm page initialized');

    const confirmForm = document.getElementById('resetConfirmForm');
    const newPasswordInput = document.getElementById('id_password');
    const confirmPasswordInput = document.getElementById('id_password_confirm');
    const strengthIndicator = document.getElementById('passwordStrength');
    const codeInputs = document.querySelectorAll('.code-input');
    const hiddenCodeField = document.getElementById('hiddenCodeField'); // Hidden for Django
    const codeErrors = document.getElementById('codeErrors');

    // Auto-focus first code input
    if (codeInputs.length > 0) {
        codeInputs[0].focus();
    }

    // Update hidden field with full code
    function updateHiddenCode() {
        const fullCode = Array.from(codeInputs).map(input => input.value).join('');
        hiddenCodeField.value = fullCode;

        // Visual validation
        if (codeErrors) {
            if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
                codeErrors.style.display = 'block';
            } else {
                codeErrors.style.display = 'none';
            }
        }
    }

    // New Logic: Simple one-digit, auto-forward, paste distribute
    codeInputs.forEach((input, index) => {
        // Input: Take first digit only, forward
        input.addEventListener('input', function(e) {
            // Strip to first digit
            let digit = e.target.value.replace(/\D/g, '').slice(0, 1);
            e.target.value = digit;

            // Visual
            e.target.classList.remove('is-invalid', 'is-valid');
            if (digit) e.target.classList.add('is-valid');

            updateHiddenCode();

            // Forward to next
            if (digit && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });

        // Backspace: Clear or move left
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace') {
                if (!this.value && index > 0) {
                    e.preventDefault();
                    codeInputs[index - 1].focus();
                } else {
                    this.value = '';
                    this.classList.remove('is-valid', 'is-invalid');
                    updateHiddenCode();
                }
            }
        });

        // Paste: Clear all, fill one per box
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            setTimeout(() => {
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 6);

                // Clear all
                codeInputs.forEach(inp => {
                    inp.value = '';
                    inp.classList.remove('is-invalid', 'is-valid');
                });

                // Fill one per box
                digits.split('').forEach((digit, i) => {
                    if (i < codeInputs.length) {
                        codeInputs[i].value = digit;
                        codeInputs[i].classList.add('is-valid');
                    }
                });

                updateHiddenCode();
                // Focus last
                codeInputs[5].focus();
                console.log('Pasted full code:', digits);
            }, 0);
        });
    });

    // Initial update
    updateHiddenCode();

    // Password strength indicator
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updateStrengthIndicator(strength, strengthIndicator);
            validatePasswordMatch();
        });
    }

    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });
    }

    // Password toggle functionality (robust version using wrapper)
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const passwordWrapper = this.closest('.password-wrapper');
                if (!passwordWrapper) return;

                const input = passwordWrapper.querySelector('input[type="password"], input[type="text"]');
                const icon = this.querySelector('i');

                if (input && icon) {
                    console.log('Toggling password visibility');
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                        this.setAttribute('title', 'Hide password');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                        this.setAttribute('title', 'Show password');
                    }
                    input.focus();
                } else {
                    console.error('Input or icon not found for toggle');
                }
            });
        });
    }

    setupPasswordToggles();

    // Form validation
    if (confirmForm) {
        confirmForm.addEventListener('submit', function(e) {
            updateHiddenCode(); // Final sync
            if (!validateForm()) {
                e.preventDefault();
                console.log('Form validation failed');
            } else {
                console.log('Form submitted');
            }
        });
    }

    // Validation functions
    function validateForm() {
        let isValid = true;
        const code = hiddenCodeField.value;
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        // Code validation
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            codeInputs.forEach(input => input.classList.add('is-invalid'));
            isValid = false;
        } else {
            codeInputs.forEach(input => {
                input.classList.remove('is-invalid');
                if (input.value) input.classList.add('is-valid');
            });
        }

        // Password validation
        if (newPassword.length < 6) {
            if (newPasswordInput) newPasswordInput.classList.add('is-invalid');
            isValid = false;
        } else {
            if (newPasswordInput) newPasswordInput.classList.remove('is-invalid');
        }

        if (newPassword !== confirmPassword) {
            if (confirmPasswordInput) confirmPasswordInput.classList.add('is-invalid');
            isValid = false;
        } else {
            if (confirmPasswordInput) confirmPasswordInput.classList.remove('is-invalid');
        }

        return isValid;
    }

    function validatePasswordMatch() {
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        if (confirmPassword && newPassword !== confirmPassword) {
            if (confirmPasswordInput) confirmPasswordInput.classList.add('is-invalid');
        } else if (confirmPassword && newPassword === confirmPassword) {
            if (confirmPasswordInput) confirmPasswordInput.classList.remove('is-invalid');
        }
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';
    }

    function updateStrengthIndicator(strength, indicator) {
        if (!indicator) return;
        const strengthText = {
            weak: 'Weak - Add more characters and variety',
            medium: 'Medium - Consider adding special characters',
            strong: 'Strong - Great password!'
        };
        indicator.innerHTML = `
            <div class="strength-bar strength-${strength}">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text strength-${strength}">${strengthText[strength]}</div>
        `;
    }
});

