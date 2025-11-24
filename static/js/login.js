// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page initialized');

    const loginForm = document.getElementById('loginForm');
    const passwordField = document.getElementById('loginPassword');
    const usernameField = document.getElementById('username');
    const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

    // COMPLETELY FIXED: Password toggle with direct DOM manipulation
    const togglePassword = document.getElementById('togglePassword');

    if (togglePassword && passwordField) {
        console.log('Setting up password toggle for login');
        console.log('Toggle button found:', togglePassword);
        console.log('Password field found:', passwordField);

        // Clear any existing event listeners by cloning
        const newToggle = togglePassword.cloneNode(true);
        togglePassword.parentNode.replaceChild(newToggle, togglePassword);

        // Add fresh click listener
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Toggle button clicked!');
            console.log('Current password type:', passwordField.type);

            const icon = this.querySelector('i');

            // Toggle password visibility
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                this.setAttribute('aria-label', 'Hide password');
                console.log('Password now visible');
            } else {
                passwordField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.setAttribute('aria-label', 'Show password');
                console.log('Password now hidden');
            }
        });

        // Set initial state
        newToggle.setAttribute('aria-label', 'Show password');
        console.log('Password toggle setup complete');
    } else {
        console.error('Toggle button or password field not found!');
        console.log('togglePassword:', togglePassword);
        console.log('passwordField:', passwordField);
    }

    // FIXED: Handle form submission with AJAX to show proper success messages
    if (loginForm && submitBtn) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous validation errors
            usernameField.classList.remove('is-invalid');
            passwordField.classList.remove('is-invalid');

            // Basic client-side validation
            if (!usernameField.value.trim()) {
                usernameField.classList.add('is-invalid');
                return;
            }
            if (!passwordField.value) {
                passwordField.classList.add('is-invalid');
                return;
            }

            // Show loading state
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
            submitBtn.disabled = true;

            try {
                // Get form data
                const formData = new FormData(this);

                // Submit via AJAX
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // FIXED: Show success message immediately after login
                    if (window.Toast) {
                        window.Toast.success('Login successful! Redirecting...', 2000);
                    }

                    // This is add
                    localStorage.clear(); // Clear any client-side caches

                    // Redirect after showing success message
                    setTimeout(() => {
                        window.location.href = data.redirect_url || '/';
                    }, 2000);
                } else {
                    // Show error message
                    if (window.Toast) {
                        window.Toast.error(data.error || 'Invalid username or password', 4000);
                    }

                    // Mark fields as invalid
                    usernameField.classList.add('is-invalid');
                    passwordField.classList.add('is-invalid');

                    // Reset button
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                if (window.Toast) {
                    window.Toast.error('Login failed. Please check your connection and try again.', 4000);
                }

                // Reset button
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
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
    //console.log('=== Login Page Debug Info ===');
    console.log('Login form:', loginForm);
    console.log('Username field:', usernameField);
    console.log('Password field:', passwordField);
    console.log('Toggle button:', document.getElementById('togglePassword'));
    console.log('Submit button:', submitBtn);
    //console.log('============================');
});

