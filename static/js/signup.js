// Signup Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Signup page initialized');

    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return; // nothing to do

    const togglePassword = document.getElementById('toggleSignupPassword');
    const passwordField = document.getElementById('signupPassword');
    const confirmPasswordField = document.getElementById('confirm_password');
    const termsCheckbox = document.getElementById('accept_terms');
    const privacyCheckbox = document.getElementById('accept_privacy');

    // Get CSRF token
    function getCsrfToken() {
        const token = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (!token) {
            console.error('CSRF token not found in form');
            alert('CSRF token missing. Please refresh the page.');
            return '';
        }
        return token.value;
    }

    // Simple loading function
    function showLoading(button, text) {
        const originalText = button.querySelector('span').textContent;
        button.querySelector('span').textContent = text;
        button.querySelector('i').classList.remove('fa-user-plus');
        button.querySelector('i').classList.add('fa-spinner', 'fa-spin');
        button.disabled = true;
        return originalText;
    }

    function hideLoading(button, originalText) {
        button.querySelector('span').textContent = originalText;
        button.querySelector('i').classList.remove('fa-spinner', 'fa-spin');
        button.querySelector('i').classList.add('fa-user-plus');
        button.disabled = false;
    }

    // Simple validation class toggle
    function addValidation(field, isValid) {
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }
    }

    // Password toggle function
    function togglePasswordVisibility(field, button) {
        const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
        field.setAttribute('type', type);
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    // Password confirmation validation
    function validatePasswordMatch() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (confirmPassword && password !== confirmPassword) {
            addValidation(confirmPasswordField, false);
            return false;
        } else if (confirmPassword) {
            addValidation(confirmPasswordField, true);
        }
        return true;
    }

    // Function to display errors
    function displayErrors(errors, formErrors = {}) {
        let errorContainer = document.getElementById('form-errors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'form-errors';
            errorContainer.className = 'alert alert-danger';
            signupForm.prepend(errorContainer);
        }
        errorContainer.innerHTML = errors.join('<br>');

        // Mark specific fields as invalid
        Object.keys(formErrors).forEach(fieldName => {
            let field;
            if (fieldName === 'email') {
                field = document.getElementById('signupEmail');
            } else {
                field = document.querySelector(`[name="${fieldName}"]`);
            }
            if (field) {
                addValidation(field, false);
            }
        });
    }

    // Function to clear all validation states
    function clearAllValidation() {
        const fields = signupForm.querySelectorAll('.form-control, .form-check-input');
        fields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });
        const errorContainer = document.getElementById('form-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
    }

    // Handle form submission - Real AJAX to Django
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllValidation();

        // Validate checkboxes if they exist (client-side UX)
        if ((termsCheckbox && !termsCheckbox.checked) || (privacyCheckbox && !privacyCheckbox.checked)) {
            displayErrors(['You must accept both Terms & Conditions and Privacy Policy.']);
            if (termsCheckbox) addValidation(termsCheckbox, false);
            if (privacyCheckbox) addValidation(privacyCheckbox, false);
            return;
        }

        // Collect form data
        const formData = new FormData(this);

        // Explicitly ensure checkbox values are included when checked
        if (termsCheckbox) {
            if (termsCheckbox.checked) {
                formData.set('accept_terms', 'on');
            } else {
                formData.delete('accept_terms');
            }
        }
        if (privacyCheckbox) {
            if (privacyCheckbox.checked) {
                formData.set('accept_privacy', 'on');
            } else {
                formData.delete('accept_privacy');
            }
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn, 'Creating Account...');
        try {
            const response = await fetch('/signup/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/';
            } else {
                let errorMessages = [];
                let formErrors = {};
                if (data.form_errors) {
                    const errors = JSON.parse(data.form_errors);
                    formErrors = errors;
                    Object.values(errors).forEach(fieldErrors => {
                        fieldErrors.forEach(err => {
                            errorMessages.push(err.message);
                        });
                    });
                } else if (data.error) {
                    errorMessages.push(data.error);
                } else {
                    errorMessages.push('An unknown error occurred.');
                }
                displayErrors(errorMessages, formErrors);
            }
        } catch (error) {
            console.error('Signup failed:', error);
            displayErrors(['Account creation failed. Please try again.']);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });

    // Password toggle
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePasswordVisibility(passwordField, this);
        });
    }

    // Real-time password confirmation (guarded)
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
        passwordField.addEventListener('input', validatePasswordMatch);
    }

    // Checkbox validation listeners (guarded)
    [termsCheckbox, privacyCheckbox].forEach(checkbox => {
        if (!checkbox) return;
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                this.classList.remove('is-invalid');
            }
        });
    });

    // Auto-focus first input (guarded)
    const firstInput = document.getElementById('username');
    if (firstInput) {
        firstInput.focus();
    }
});
