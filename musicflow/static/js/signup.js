// Signup Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Signup page initialized');

    const signupForm = document.getElementById('signupForm');
    const togglePassword = document.getElementById('toggleSignupPassword');
    const passwordField = document.getElementById('signupPassword');
    const confirmPasswordField = document.getElementById('confirmPassword');

    // Handle form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm(this) || !validatePasswordMatch()) {
            return;
        }

        const formData = {
            name: document.getElementById('signupName').value,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value,
            agreeTerms: document.getElementById('agreeTerms').checked
        };

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = MusicFlowUtils.showLoading(submitBtn, 'Creating Account...');

        try {
            // Simulate API call
            await MusicFlowUtils.simulateAPI(formData, 2500);

            // Success - redirect to success page with proper URL
            const successMessage = `Welcome to MusicFlow, ${formData.name}! Your account has been created successfully.`;
            const redirectUrl = './login.html'; // Use relative path

            localStorage.setItem('successMessage', successMessage);
            localStorage.setItem('redirectUrl', redirectUrl);

            // Redirect to success page in same directory
            window.location.href = './success.html';

        } catch (error) {
            console.error('Signup failed:', error);
            MusicFlowUtils.hideLoading(submitBtn, originalText);

            // Show error message
            alert('Account creation failed. Please try again.');
        }
    });

    // Additional password toggle setup (backup implementation)
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Signup toggle button clicked');
            MusicFlowUtils.togglePassword(passwordField, this);
        });
    }

    // Password confirmation validation
    function validatePasswordMatch() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (confirmPassword && password !== confirmPassword) {
            MusicFlowUtils.addValidation(confirmPasswordField, false);
            return false;
        } else if (confirmPassword && password === confirmPassword) {
            MusicFlowUtils.addValidation(confirmPasswordField, true);
            return true;
        }
        return true;
    }

    // Real-time password confirmation
    confirmPasswordField.addEventListener('input', validatePasswordMatch);
    passwordField.addEventListener('input', validatePasswordMatch);

    // Terms validation
    const agreeTerms = document.getElementById('agreeTerms');
    agreeTerms.addEventListener('change', function() {
        if (this.checked) {
            this.classList.remove('is-invalid');
        }
    });

    // Auto-focus first input
    const firstInput = document.getElementById('signupName');
    if (firstInput) {
        firstInput.focus();
    }

    // Debug: Log elements found
    console.log('Signup password field found:', passwordField);
    console.log('Signup toggle button found:', togglePassword);
});

