


// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page initialized');

    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');
    const usernameField = document.getElementById('username');
    const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

    // Handle password toggle
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const icon = this.querySelector('i');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
            console.log('Password visibility toggled');
        });
    } else {
        console.error('Toggle button or password field not found');
    }

    // Handle form submission with basic client-side validation
    if (loginForm && submitBtn) {
        loginForm.addEventListener('submit', function(e) {
            // Clear previous validation errors
            usernameField.classList.remove('is-invalid');
            passwordField.classList.remove('is-invalid');

            // Basic client-side validation
            if (!usernameField.value.trim()) {
                e.preventDefault();
                usernameField.classList.add('is-invalid');
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i><span>Sign In</span>';
                submitBtn.disabled = false;
                return;
            }
            if (!passwordField.value) {
                e.preventDefault();
                passwordField.classList.add('is-invalid');
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i><span>Sign In</span>';
                submitBtn.disabled = false;
                return;
            }

            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
            submitBtn.disabled = true;
        });
    } else {
        console.error('Login form or submit button not found');
    }

    // Reset button on page load (in case of error reload)
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i><span>Sign In</span>';
        submitBtn.disabled = false;
    }

    // Auto-focus username field
    if (usernameField) {
        usernameField.focus();
    }

    // Debug logs
    console.log('Username field:', usernameField);
    console.log('Password field:', passwordField);
    console.log('Toggle button:', togglePassword);
    console.log('Submit button:', submitBtn);
});

