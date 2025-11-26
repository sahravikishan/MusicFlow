// Signup Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Signup page initialized');

    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    const toggleSignupPassword = document.getElementById('toggleSignupPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordField = document.getElementById('signupPassword');
    const confirmPasswordField = document.getElementById('confirm_password');
    const termsCheckbox = document.getElementById('accept_terms');
    const privacyCheckbox = document.getElementById('accept_privacy');

    // FIXED: Prioritize COOKIE (fresh) over hidden input (may be cached)
    function getCsrfToken() {
        // Parse cookie first
        let token = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];

        if (!token) {
            // Fallback to hidden input
            const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
            token = input?.value || '';
        }

        if (!token) {
            console.error('❌ No CSRF token!');
            if (window.Toast) window.Toast.error('🔒 Security error. Refresh page.');
            return '';
        }

        console.log('✅ CSRF Token loaded');  // Debug
        return token;
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

    // Password toggle function - COMPLETELY FIXED VERSION
    function setupPasswordToggle(toggleButton, passwordInput) {
        if (!toggleButton || !passwordInput) {
            console.error('Toggle button or password field not found');
            return;
        }

        // Remove any existing listeners
        const newToggle = toggleButton.cloneNode(true);
        toggleButton.parentNode.replaceChild(newToggle, toggleButton);

        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const icon = this.querySelector('i');

            // Use direct type property for better compatibility
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                this.setAttribute('aria-label', 'Hide password');
                console.log(`Password visible for ${passwordInput.id} (type: ${passwordInput.type})`);
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.setAttribute('aria-label', 'Show password');
                console.log(`Password hidden for ${passwordInput.id} (type: ${passwordInput.type})`);
            }
        });

        // Set initial aria-label
        newToggle.setAttribute('aria-label', 'Show password');

        // Return the new toggle for reference update
        return newToggle;
    }

    // Setup both password toggles and update references
    const newToggleSignup = setupPasswordToggle(toggleSignupPassword, passwordField);
    const newToggleConfirm = setupPasswordToggle(toggleConfirmPassword, confirmPasswordField);

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

    // Field name mapping for better error messages
    const fieldNameMap = {
        'username': 'Username',
        'email': 'Email Address',
        'password': 'Password',
        'confirm_password': 'Confirm Password',
        'accept_terms': 'Terms & Conditions',
        'accept_privacy': 'Privacy Policy'
    };

    // Function to display errors using Toast - FIXED VERSION TO SHOW ALL ERRORS PER FIELD
    function displayErrors(errors, formErrors = {}) {
        // Show each error as a toast notification with field name
        errors.forEach((error, index) => {
            if (window.Toast) {
                // Add delay to show multiple toasts sequentially
                setTimeout(() => {
                    window.Toast.error(error, 5000);
                }, index * 100);
            }
        });

        // Mark specific fields as invalid and show ALL field-specific feedback
        Object.keys(formErrors).forEach(fieldName => {
            let field;
            const displayName = fieldNameMap[fieldName] || fieldName;

            if (fieldName === 'email') {
                field = document.getElementById('signupEmail');
            } else if (fieldName === 'username') {
                field = document.getElementById('username');
            } else if (fieldName === 'password') {
                field = document.getElementById('signupPassword');
            } else if (fieldName === 'confirm_password') {
                field = document.getElementById('confirm_password');
            } else {
                field = document.querySelector(`[name="${fieldName}"]`);
            }

            if (field) {
                addValidation(field, false);

                // Get or create invalid feedback element
                let feedback = field.parentElement.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    field.parentElement.appendChild(feedback);
                }

                // FIXED: Collect ALL error messages for this field (err is OBJECT {message: str} from Django as_json())
                const fieldErrors = formErrors[fieldName];
                let allErrorMessages = [];

                if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                    // Collect all error messages for this field (use err.message)
                    fieldErrors.forEach(errObj => {
                        allErrorMessages.push(errObj.message || `${displayName} is invalid`);
                    });
                } else {
                    allErrorMessages.push(`${displayName} is invalid`);
                }

                // Display ALL errors separated by line breaks
                feedback.innerHTML = allErrorMessages.join('<br>');
                feedback.style.display = 'block';
            }
        });
    }

    // Function to clear all validation states
    function clearAllValidation() {
        const fields = signupForm.querySelectorAll('.form-control, .form-check-input');
        fields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });

        // Clear all invalid feedback messages
        const feedbacks = signupForm.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(feedback => {
            feedback.style.display = 'none';
            feedback.innerHTML = '';
        });
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
            // Use this.action to respect the current URL/form action instead of hardcoded path
            // Add X-CSRFToken header to prevent 403 errors
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCsrfToken()
                }
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If server returns HTML (error page), log it and throw error to trigger catch block
                const text = await response.text();
                console.error("Server returned non-JSON response:", text);
                throw new Error(`Server error (${response.status}): The server encountered an internal error.`);
            }

            if (data.success) {
                // Show success toast
                if (window.Toast) {
                    window.Toast.success('Account created successfully! Redirecting...', 2000);
                }
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                let errorMessages = [];
                let formErrors = {};

                if (data.form_errors) {
                    const errors = JSON.parse(data.form_errors);
                    formErrors = errors;

                    // Build detailed error messages with field names - SHOW ALL ERRORS
                    Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
                        const displayName = fieldNameMap[fieldName] || fieldName;
                        fieldErrors.forEach(errObj => {
                            // FIXED: Don't show "__all__" errors in toast; use errObj.message (object from Django as_json())
                            if (fieldName !== '__all__') {
                                errorMessages.push(`${displayName}: ${errObj.message}`);
                            }
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
            // Show the actual error message if available, otherwise show generic message
            displayErrors([error.message || 'Account creation failed. Please check your connection and try again.']);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });

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

