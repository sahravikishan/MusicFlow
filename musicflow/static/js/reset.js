// Reset Password Page JavaScript - Enhanced with User ID support
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset password page initialized');

    const resetForm = document.getElementById('resetForm');

    // Handle form submission
    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm(this)) {
            return;
        }

        const userId = document.getElementById('resetUserId').value.trim();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = MusicFlowUtils.showLoading(submitBtn, 'Generating QR Code...');

        try {
            // Simulate API call to validate user ID
            await MusicFlowUtils.simulateAPI({ userId }, 1500);

            // Store user ID for verification page
            localStorage.setItem('resetUserId', userId);
            localStorage.setItem('resetRequestTime', Date.now().toString());

            // Redirect directly to reset_verify page to show QR code
            window.location.href = './reset_verify.html';

        } catch (error) {
            console.error('Reset request failed:', error);
            MusicFlowUtils.hideLoading(submitBtn, originalText);

            // Show error message
            alert('Failed to process reset request. Please check your User ID/Email and try again.');
        }
    });

    // Auto-focus user ID input
    const userIdInput = document.getElementById('resetUserId');
    if (userIdInput) {
        userIdInput.focus();
    }

    // Enhanced validation for User ID or Email
    userIdInput.addEventListener('input', function() {
        const value = this.value.trim();
        let isValid = false;

        if (value.length > 0) {
            // Check if it's an email or user ID
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const userIdRegex = /^[a-zA-Z0-9_]{3,20}$/; // User ID: 3-20 alphanumeric characters

            isValid = emailRegex.test(value) || userIdRegex.test(value);
        }

        if (this.classList.contains('is-invalid') && isValid) {
            MusicFlowUtils.addValidation(this, true);
        } else if (!isValid && value.length > 0) {
            MusicFlowUtils.addValidation(this, false);
        }
    });
});

