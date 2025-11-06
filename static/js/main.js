// Main JavaScript utilities for MusicFlow Auth
console.log('MusicFlow Auth System Loaded');

// Utility functions
const Utils = {
    // Email validation
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Password strength validation
    validatePassword: (password) => {
        return password.length >= 6;
    },

    // Show loading state
    showLoading: (button, text = 'Loading...') => {
        const originalText = button.innerHTML;
        button.innerHTML = `<span class="loading"></span> ${text}`;
        button.disabled = true;
        return originalText;
    },

    // Hide loading state
    hideLoading: (button, originalText) => {
        button.innerHTML = originalText;
        button.disabled = false;
    },

    // Add validation classes
    addValidation: (input, isValid) => {
        input.classList.remove('is-invalid', 'is-valid');
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');
    },

    // Clear validation
    clearValidation: (form) => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    },

    // Toggle password visibility - COMPLETELY FIXED VERSION
    togglePassword: (passwordField, toggleButton) => {
        if (!passwordField || !toggleButton) {
            console.error('Password field or toggle button not found');
            return;
        }

        const icon = toggleButton.querySelector('i');

        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            toggleButton.setAttribute('title', 'Hide password');
            console.log('Password shown');
        } else {
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            toggleButton.setAttribute('title', 'Show password');
            console.log('Password hidden');
        }
    },

    // Simulate API call
    simulateAPI: (data, delay = 2000) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('API Call:', data);
                resolve({ success: true, data });
            }, delay);
        });
    },

    // Redirect with success message - FIXED VERSION
    redirectToSuccess: (message, redirectUrl = './login.html') => {
        localStorage.setItem('successMessage', message);
        localStorage.setItem('redirectUrl', redirectUrl);

        // Use relative path for better browser compatibility
        window.location.href = './success.html';
    },

    // Get URL parameters
    getUrlParameter: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};

// Real-time validation setup
const setupRealTimeValidation = () => {
    const inputs = document.querySelectorAll('input');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                validateInput(this);
            }
        });
    });
};

// Validate individual input
const validateInput = (input) => {
    let isValid = true;

    if (input.hasAttribute('required') && !input.value.trim()) {
        isValid = false;
    } else if (input.type === 'email' && input.value.trim()) {
        isValid = Utils.validateEmail(input.value);
    } else if (input.type === 'password' && input.hasAttribute('minlength')) {
        isValid = input.value.length >= parseInt(input.getAttribute('minlength'));
    }

    Utils.addValidation(input, isValid);
    return isValid;
};

// Validate entire form
const validateForm = (form) => {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');

    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
};

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up password toggles');

    setupRealTimeValidation();

    // Setup password toggles - ROBUST VERSION
    const setupPasswordToggle = (toggleId, passwordId) => {
        const toggle = document.getElementById(toggleId);
        const passwordField = document.getElementById(passwordId);

        if (toggle && passwordField) {
            console.log(`Setting up toggle for ${passwordId}`);

            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                console.log(`Toggle clicked for ${passwordId}`);
                Utils.togglePassword(passwordField, this);
            });

            // Set initial title
            toggle.setAttribute('title', 'Show password');
        } else {
            console.log(`Toggle or password field not found: ${toggleId}, ${passwordId}`);
        }
    };

    // Setup all password toggles
    setupPasswordToggle('togglePassword', 'loginPassword');
    setupPasswordToggle('toggleSignupPassword', 'signupPassword');

    // Generic setup for all password toggles - COMMENTED OUT FOR reset_confirm PAGE TO AVOID CONFLICTS
    /*
    const passwordToggles = document.querySelectorAll('.password-toggle');
    console.log(`Found ${passwordToggles.length} password toggles`);

    passwordToggles.forEach((toggle, index) => {
        console.log(`Setting up toggle ${index + 1}`);

        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Find the password field in the same wrapper
            const passwordWrapper = this.closest('.password-wrapper');
            if (passwordWrapper) {
                const passwordField = passwordWrapper.querySelector('input[type="password"], input[type="text"]');

                if (passwordField) {
                    console.log(`Generic toggle clicked for field: ${passwordField.id}`);
                    Utils.togglePassword(passwordField, this);
                } else {
                    console.error('Password field not found in wrapper');
                }
            } else {
                console.error('Password wrapper not found');
            }
        });

        // Set initial title
        toggle.setAttribute('title', 'Show password');
    });
    */

    // Condition it to skip if on reset_confirm page (optional fallback)
    if (!window.location.pathname.includes('reset_confirm')) {
        // Uncomment and use the generic code above if needed for other pages
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit active form
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const form = e.target.closest('form');
            if (form) {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        }

        // Escape key to clear form
        if (e.key === 'Escape') {
            const form = document.querySelector('form');
            if (form) {
                Utils.clearValidation(form);
            }
        }
    });
});

// Export utilities for use in other scripts
window.MusicFlowUtils = Utils;
window.validateForm = validateForm;
window.setupRealTimeValidation = setupRealTimeValidation;

