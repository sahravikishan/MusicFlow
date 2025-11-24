// Main JavaScript utilities for MusicFlow Auth
console.log('MusicFlow Auth System Loaded');

// ============================================
// TOAST NOTIFICATION SYSTEM - INTEGRATED
// ============================================

const ToastNotification = {
    container: null,
    shownMessages: new Set(), // Track shown messages to prevent duplicates

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        // Prevent duplicate messages
        const messageKey = `${type}:${message}`;
        if (this.shownMessages.has(messageKey)) {
            console.log('Duplicate message prevented:', message);
            return null;
        }
        this.shownMessages.add(messageKey);

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">${message}</div>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast, messageKey);
        });

        // Auto remove after duration
        setTimeout(() => {
            this.remove(toast, messageKey);
        }, duration);

        return toast;
    },

    remove(toast, messageKey) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            // Remove from shown messages after removal
            if (messageKey) {
                this.shownMessages.delete(messageKey);
            }
        }, 400);
    },

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
};

// Make Toast globally available
window.Toast = ToastNotification;

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

        // Use .type property instead of getAttribute for better browser compatibility
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            toggleButton.setAttribute('aria-label', 'Hide password');
            console.log('Password shown for:', passwordField.id);
        } else {
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            toggleButton.setAttribute('aria-label', 'Show password');
            console.log('Password hidden for:', passwordField.id);
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

// ============================================
// INITIALIZATION
// ============================================

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing MusicFlow Auth');

    // Convert Django messages to toast notifications - FIXED VERSION WITH DUPLICATE PREVENTION
    const djangoAlerts = document.querySelectorAll('.alert');

    djangoAlerts.forEach(alert => {
        const message = alert.textContent.trim();
        let type = 'info';

        if (alert.classList.contains('alert-success')) {
            type = 'success';
        } else if (alert.classList.contains('alert-danger') || alert.classList.contains('alert-error')) {
            type = 'error';
        } else if (alert.classList.contains('alert-warning')) {
            type = 'warning';
        }

        // Show toast only if there's a message and it's not empty
        if (message && message.length > 0) {
            Toast.show(message, type, 4000);
        }

        // Hide the original alert
        alert.style.display = 'none';
    });

    // Setup real-time validation
    setupRealTimeValidation();

    // Setup password toggles - ROBUST VERSION WITH DIRECT TYPE CHANGE
    const setupPasswordToggle = (toggleId, passwordId) => {
        const toggle = document.getElementById(toggleId);
        const passwordField = document.getElementById(passwordId);

        if (toggle && passwordField) {
            console.log(`Setting up toggle for ${passwordId}`);

            // Remove any existing listeners to prevent duplicates
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            newToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                console.log(`Toggle clicked for ${passwordId}`);
                const icon = this.querySelector('i');

                // Direct type property change for better compatibility
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                    this.setAttribute('aria-label', 'Hide password');
                    console.log(`${passwordId} is now visible (type: ${passwordField.type})`);
                } else {
                    passwordField.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                    this.setAttribute('aria-label', 'Show password');
                    console.log(`${passwordId} is now hidden (type: ${passwordField.type})`);
                }
            });

            // Set initial aria-label
            newToggle.setAttribute('aria-label', 'Show password');
        } else {
            console.log(`Toggle or password field not found: ${toggleId}, ${passwordId}`);
        }
    };

    // Setup all password toggles
    setupPasswordToggle('togglePassword', 'loginPassword');
    setupPasswordToggle('toggleSignupPassword', 'signupPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirm_password');

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

