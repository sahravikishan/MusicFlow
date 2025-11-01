// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page initialized');

    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');
    const usernameField = document.getElementById('username');

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

    // Handle form submission with basic validation
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Basic client-side validation
            if (!usernameField.value) {
                usernameField.classList.add('is-invalid');
                return;
            }
            if (!passwordField.value) {
                passwordField.classList.add('is-invalid');
                return;
            }

            const formData = {
                username: usernameField.value,
                password: passwordField.value,
                rememberMe: document.getElementById('rememberMe').checked
            };

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : 'Sign In';
            if (submitBtn) {
                submitBtn.innerHTML = 'Signing In...';
                submitBtn.disabled = true;
            }

            try {
                // Simulate API call (replace with actual API call)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Success - redirect to success page
                const successMessage = 'Welcome back! You have signed in successfully.';
                localStorage.setItem('successMessage', successMessage);
                window.location.href = './success.html';

            } catch (error) {
                console.error('Login failed:', error);
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                alert('Login failed. Please check your credentials and try again.');
            }
        });
    }

    // Auto-focus username field
    if (usernameField) {
        usernameField.focus();
    }

    // Debug logs
    console.log('Username field:', usernameField);
    console.log('Password field:', passwordField);
    console.log('Toggle button:', togglePassword);
});

