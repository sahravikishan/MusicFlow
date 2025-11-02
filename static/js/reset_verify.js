document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset verify page initialized');

    const passwordForm = document.getElementById('passwordForm');
    const codeInput = document.getElementById('id_code');
    const newPasswordInput = document.getElementById('id_password');
    const confirmPasswordInput = document.getElementById('id_password_confirm');
    const strengthIndicator = document.getElementById('passwordStrength');
    const proceedButton = document.getElementById('proceedToCode');
    const qrContainer = document.querySelector('.qr-container img');  // Detect QR phase

    // Auto-focus: code if OTP phase, else nothing
    if (codeInput && !qrContainer) {
        codeInput.focus();
    }

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

    // Password toggle functionality
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const input = button.previousElementSibling;
                const icon = button.querySelector('i');
                if (input && icon) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                    input.focus();
                }
            });
        });
    }

    setupPasswordToggles();

    // Form validation
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            } else {
                console.log('Form submitted with code:', codeInput.value);
            }
        });
    }

    // "I've Scanned" button (refresh)
    if (proceedButton) {
        proceedButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.reload();
        });
    }

    // Validation functions
    function validateForm() {
        let isValid = true;
        const code = codeInput ? codeInput.value.trim() : '';
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            if (codeInput) codeInput.classList.add('is-invalid');
            isValid = false;
        } else {
            if (codeInput) codeInput.classList.remove('is-invalid');
        }

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

    // Countdown timer - only for QR phase
    if (qrContainer) {  // QR visible
        let timeLeft = 120;
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            const submitButton = passwordForm ? passwordForm.querySelector('button[type="submit"]') : null;
            const timer = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    if (submitButton) submitButton.disabled = true;
                    alert('QR expired! Generate a new one.');
                    window.location.href = '{% url "player:resend_reset_code" %}';
                }
                timeLeft--;
            }, 1000);
        }
    }
});

