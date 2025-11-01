// Success Page JavaScript - Enhanced with links to reset-verify
document.addEventListener('DOMContentLoaded', function() {
    console.log('Success page initialized');

    // Get success message from localStorage with fallback
    let successMessage = 'Operation completed successfully!';
    let redirectUrl = 'login.html';

    try {
        const storedMessage = localStorage.getItem('successMessage');
        const storedRedirectUrl = localStorage.getItem('redirectUrl');
        const timestamp = localStorage.getItem('successTimestamp');

        console.log('Retrieved from localStorage:', { storedMessage, storedRedirectUrl, timestamp });

        if (storedMessage) {
            successMessage = storedMessage;
        }

        if (storedRedirectUrl) {
            redirectUrl = storedRedirectUrl;
        }

        // Check if data is recent (within last 5 minutes)
        if (timestamp) {
            const now = Date.now();
            const storedTime = parseInt(timestamp);
            const timeDiff = now - storedTime;

            if (timeDiff > 300000) { // 5 minutes
                console.log('Success data is too old, using defaults');
                successMessage = 'Welcome to MusicFlow!';
                redirectUrl = 'login.html';
            }
        }

    } catch (error) {
        console.error('Error reading from localStorage:', error);
        successMessage = 'Welcome to MusicFlow!';
        redirectUrl = 'login.html';
    }

    // Update success message in the DOM
    const messageElement = document.getElementById('successMessage');
    if (messageElement) {
        messageElement.textContent = successMessage;
        console.log('Updated success message:', successMessage);
    } else {
        console.error('Success message element not found');
    }

    // Handle continue button
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function(e) {
            e.preventDefault();

            console.log('Continue button clicked, redirecting to:', redirectUrl);

            // Clear localStorage
            try {
                localStorage.removeItem('successMessage');
                localStorage.removeItem('redirectUrl');
                localStorage.removeItem('successTimestamp');
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }

            // Redirect with fallback
            try {
                // Check if redirectUrl contains reset-verify to handle properly
                if (redirectUrl.includes('reset-verify') || redirectUrl.includes('reset_verify')) {
                    window.location.href = './reset_verify.html';
                } else {
                    window.location.href = './' + redirectUrl.replace('./', '');
                }
            } catch (error) {
                console.error('Error redirecting:', error);
                window.location.href = './login.html';
            }
        });
    } else {
        console.error('Continue button not found');
    }

    // Auto-redirect after 8 seconds (increased for better UX)
    const autoRedirectTimer = setTimeout(() => {
        console.log('Auto-redirecting after timeout');
        if (continueBtn) {
            continueBtn.click();
        } else {
            // Fallback redirect
            try {
                localStorage.removeItem('successMessage');
                localStorage.removeItem('redirectUrl');
                localStorage.removeItem('successTimestamp');
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }

            // Check for reset-verify redirect
            if (redirectUrl.includes('reset-verify') || redirectUrl.includes('reset_verify')) {
                window.location.href = './reset_verify.html';
            } else {
                window.location.href = './login.html';
            }
        }
    }, 8000);

    // Clear timer if user interacts
    document.addEventListener('click', function() {
        clearTimeout(autoRedirectTimer);
    });

    // Fallback: If no success data found, show default message
    if (!localStorage.getItem('successMessage') && !localStorage.getItem('successTimestamp')) {
        console.log('No success data found, showing default message');
        if (messageElement) {
            messageElement.textContent = 'Welcome to MusicFlow! Your musical journey begins here.';
        }
    }

    // Add navigation links for different auth flows
    addQuickNavigationLinks();

    function addQuickNavigationLinks() {
        // Check if we're coming from a password reset flow
        const isPasswordReset = successMessage.toLowerCase().includes('password');

        // Add quick navigation section to success page
        const cardBody = document.querySelector('.card-body');
        if (cardBody && !document.getElementById('quickNavigation')) {
            const navigationHTML = `
                <div class="divider">
                    <span>quick actions</span>
                </div>
                <div id="quickNavigation" class="row">
                    <div class="col-12 text-center">
                        <div class="d-flex flex-wrap justify-content-center gap-2">
                            <a href="./login.html" class="btn btn-sm elegant-btn elegant-btn-primary">
                                <i class="fas fa-sign-in-alt me-1"></i>Login
                            </a>
                            <a href="./signup.html" class="btn btn-sm elegant-btn elegant-btn-success">
                                <i class="fas fa-user-plus me-1"></i>Signup
                            </a>
                            ${isPasswordReset ?
                                '<a href="./reset_verify.html" class="btn btn-sm elegant-btn elegant-btn-warning"><i class="fas fa-key me-1"></i>Reset Again</a>' :
                                '<a href="./reset.html" class="btn btn-sm elegant-btn elegant-btn-warning"><i class="fas fa-key me-1"></i>Reset Password</a>'
                            }
                        </div>
                    </div>
                </div>
            `;

            // Insert before the last element in card-body
            const lastElement = cardBody.lastElementChild;
            if (lastElement) {
                lastElement.insertAdjacentHTML('beforebegin', navigationHTML);
            }
        }
    }
});

// Handle page visibility change (for mobile browsers)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible');
        // Refresh success message if needed
        const messageElement = document.getElementById('successMessage');
        const storedMessage = localStorage.getItem('successMessage');

        if (messageElement && storedMessage) {
            messageElement.textContent = storedMessage;
        }
    }
});

