// Reset Verify Page JavaScript - Enhanced with email-based code delivery
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset verify page initialized');

    // Get user ID from localStorage
    const resetUserId = localStorage.getItem('resetUserId') || 'Unknown User';
    const resetRequestTime = localStorage.getItem('resetRequestTime');

    // Check if user came from reset page
    if (!resetUserId || resetUserId === 'Unknown User') {
        alert('Invalid access. Please start from the password reset page.');
        window.location.href = './reset.html';
        return;
    }

    // Display user ID
    const userDisplayElement = document.getElementById('userDisplay');
    if (userDisplayElement) {
        userDisplayElement.textContent = resetUserId;
    }

    // QR Code and Timer variables
    let qrExpiryTimer;
    let countdownTimer;
    let qrCodeExpired = false;
    let verificationCode = '';
    let qrExpiryTime;
    let emailSent = false;

    // Step navigation elements
    const qrStep = document.getElementById('qrStep');
    const codeStep = document.getElementById('codeStep');
    const passwordStep = document.getElementById('passwordStep');

    // Button elements
    const proceedToCodeBtn = document.getElementById('proceedToCode');
    const backToQRBtn = document.getElementById('backToQR');
    const generateNewCodeBtn = document.getElementById('generateNewCode');

    // Form elements
    const codeForm = document.getElementById('codeForm');
    const passwordForm = document.getElementById('passwordForm');
    const codeInputs = document.querySelectorAll('.code-input');

    // Initialize QR code generation
    generateQRCodeWithExpiry();

    // Step 1: Proceed to code verification
    proceedToCodeBtn.addEventListener('click', function() {
        if (qrCodeExpired) {
            alert('QR code has expired. Please generate a new one.');
            return;
        }
        showStep(codeStep, qrStep);
        // Focus first code input
        document.getElementById('digit1').focus();
    });

    // Back to QR step
    backToQRBtn.addEventListener('click', function() {
        showStep(qrStep, codeStep);
        clearCodeInputs();
    });

    // Generate new QR code
    generateNewCodeBtn.addEventListener('click', function() {
        generateQRCodeWithExpiry();
    });

    // Code input handling
    setupCodeInputs();

    // Step 2: Verify code form
    codeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (qrCodeExpired) {
            showCodeError('QR code has expired. Please generate a new one.');
            return;
        }

        const enteredCode = getEnteredCode();
        if (enteredCode.length !== 6) {
            showCodeError('Please enter the complete 6-digit code.');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = MusicFlowUtils.showLoading(submitBtn, 'Verifying...');

        try {
            // Simulate code verification
            await MusicFlowUtils.simulateAPI({
                code: enteredCode,
                userId: resetUserId,
                expectedCode: verificationCode
            }, 2000);

            // Verify against stored code
            if (enteredCode === verificationCode) {
                console.log('Code verified successfully');

                // Clear timers
                clearTimeout(qrExpiryTimer);
                clearTimeout(countdownTimer);

                // Show success animation
                showCodeSuccess();

                // Proceed to password step after brief delay
                setTimeout(() => {
                    showStep(passwordStep, codeStep);
                    document.getElementById('newPassword').focus();
                }, 1000);
            } else {
                throw new Error('Invalid code');
            }

        } catch (error) {
            console.error('Code verification failed:', error);
            MusicFlowUtils.hideLoading(submitBtn, originalText);
            showCodeError('Invalid verification code. Please try again.');
        }
    });

    // Step 3: New password form
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateNewPassword()) {
            return;
        }

        const newPassword = document.getElementById('newPassword').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = MusicFlowUtils.showLoading(submitBtn, 'Resetting Password...');

        try {
            // Simulate password update
            await MusicFlowUtils.simulateAPI({
                userId: resetUserId,
                newPassword: newPassword,
                verificationCode: verificationCode
            }, 2500);

            // Success - redirect to success page with enhanced message
            const successMessage = `🎉 Password Reset Successful!\n\nYour password has been successfully updated for account: ${resetUserId}\n\nYou can now sign in with your new password. A confirmation email has been sent to your registered email address.\n\nFor security:\n• Keep your new password secure\n• Don't share it with anyone\n• Consider enabling two-factor authentication`;

            localStorage.setItem('successMessage', successMessage);
            localStorage.setItem('redirectUrl', 'login.html');
            localStorage.setItem('successTimestamp', Date.now().toString());

            // Clear reset data
            localStorage.removeItem('resetUserId');
            localStorage.removeItem('resetRequestTime');

            window.location.replace('./success.html');

        } catch (error) {
            console.error('Password reset failed:', error);
            MusicFlowUtils.hideLoading(submitBtn, originalText);
            alert('Failed to reset password. Please try again.');
        }
    });

    // Password strength indicator
    setupPasswordStrength();

    // Helper functions
    function generateQRCodeWithExpiry() {
        const canvas = document.getElementById('qrCode');
        const qrWrapper = canvas.closest('.qr-code-wrapper');

        if (canvas) {
            // Clear any existing timers
            clearTimeout(qrExpiryTimer);
            clearTimeout(countdownTimer);
            qrCodeExpired = false;
            emailSent = false;

            // Remove expired class
            qrWrapper.classList.remove('expired');

            // Show loading state
            canvas.style.display = 'none';
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'qr-loading';
            loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            qrWrapper.appendChild(loadingDiv);

            // Generate a random 6-digit code
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Set expiry time (2 minutes from now)
            qrExpiryTime = Date.now() + 120000; // 2 minutes

            console.log('🔑 VERIFICATION CODE GENERATED:', verificationCode, '(will be sent via email when QR is scanned)');

            // Update UI to show QR scan instructions
            updateQRInstructions();

            // Create QR code data with trigger URL for email sending
            const qrData = {
                type: 'password_reset_trigger',
                userId: resetUserId,
                sessionId: Date.now().toString(),
                action: 'send_verification_code',
                expires: qrExpiryTime
            };

            const qrText = JSON.stringify(qrData);

            // Generate QR code after brief delay
            setTimeout(() => {
                QRCode.toCanvas(canvas, qrText, {
                    width: 200,
                    height: 200,
                    color: {
                        dark: '#1e3a5f',
                        light: '#fffef7'
                    },
                    margin: 2,
                    errorCorrectionLevel: 'M'
                }, function (error) {
                    // Remove loading state
                    loadingDiv.remove();

                    if (error) {
                        console.error('QR Code generation failed:', error);
                        canvas.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'qr-error';
                        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Failed to generate QR code</p>';
                        qrWrapper.appendChild(errorDiv);
                    } else {
                        console.log('QR Code generated successfully');
                        canvas.style.display = 'block';
                        startExpiryTimer();
                        startCountdown();

                        // Simulate QR code scan after 3 seconds for demo
                        setTimeout(() => {
                            simulateQRScan();
                        }, 3000);
                    }
                });
            }, 1000);
        }
    }

    // Update QR instructions
    function updateQRInstructions() {
        const qrInfo = document.querySelector('.qr-info');
        if (qrInfo) {
            qrInfo.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                Reset code for User: <strong>${resetUserId}</strong><br>
                <div class="email-status mt-2 p-2" style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                    <div id="emailStatus">
                        <i class="fas fa-qrcode me-2"></i>
                        <strong>Scan QR code to receive verification code via email</strong><br>
                        <small style="color: #856404;">The 6-digit code will be sent to your registered email address</small>
                    </div>
                </div>
            `;
        }
    }

    // Simulate QR code scan and email sending
    function simulateQRScan() {
        if (emailSent || qrCodeExpired) return;

        console.log('📱 QR Code scanned! Sending verification code via email...');

        // Update status to show email sending
        const emailStatus = document.getElementById('emailStatus');
        if (emailStatus) {
            emailStatus.innerHTML = `
                <i class="fas fa-spinner fa-spin me-2"></i>
                <strong>Sending verification code to your email...</strong><br>
                <small style="color: #856404;">Please wait while we send the code</small>
            `;
        }

        // Simulate email sending delay
        setTimeout(() => {
            if (!qrCodeExpired) {
                emailSent = true;

                // Simulate sending email with verification code
                sendVerificationEmail(resetUserId, verificationCode);

                // Update status to show email sent
                if (emailStatus) {
                    emailStatus.innerHTML = `
                        <i class="fas fa-check-circle me-2" style="color: #28a745;"></i>
                        <strong style="color: #28a745;">Verification code sent to your email!</strong><br>
                        <small style="color: #856404;">Check your inbox and enter the 6-digit code below</small><br>
                        <div class="mt-2 p-2" style="background: #d4edda; border-radius: 6px; font-family: monospace;">
                            <strong>📧 Demo: Code ${verificationCode} sent to ${resetUserId}@example.com</strong>
                        </div>
                    `;
                }

                console.log('✅ Email sent successfully with code:', verificationCode);
            }
        }, 2000);
    }

    // Simulate email sending
    function sendVerificationEmail(userId, code) {
        // In a real application, this would make an API call to send an actual email
        console.log(`📧 EMAIL SENT TO: ${userId}@example.com`);
        console.log(`📧 EMAIL SUBJECT: MusicFlow Password Reset Verification`);
        console.log(`📧 EMAIL BODY: Your verification code is: ${code}`);
        console.log(`📧 EMAIL EXPIRES: ${new Date(qrExpiryTime).toLocaleString()}`);

        // For demo purposes, we'll also show a browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('MusicFlow Password Reset', {
                body: `Your verification code is: ${code}`,
                icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
            });
        }
    }

    function startExpiryTimer() {
        // Set 2-minute expiry timer
        qrExpiryTimer = setTimeout(() => {
            qrCodeExpired = true;

            // Update UI to show expired state
            const qrWrapper = document.querySelector('.qr-code-wrapper');
            const qrInstruction = document.querySelector('.qr-instruction');
            const emailStatus = document.getElementById('emailStatus');

            if (qrWrapper) {
                qrWrapper.classList.add('expired');
            }

            if (qrInstruction) {
                qrInstruction.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-exclamation-triangle me-2"></i>QR code expired. Please generate a new one.</span>';
            }

            if (emailStatus) {
                emailStatus.innerHTML = `
                    <i class="fas fa-times-circle me-2" style="color: #dc3545;"></i>
                    <strong style="color: #dc3545;">QR code expired</strong><br>
                    <small style="color: #856404;">Please generate a new QR code to receive a fresh verification code</small>
                `;
            }

            // Update countdown
            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                countdownElement.textContent = 'EXPIRED';
                countdownElement.parentElement.classList.add('danger');
            }

            console.log('❌ QR code expired');
        }, 120000); // 2 minutes
    }

    function startCountdown() {
        countdownTimer = setInterval(() => {
            const now = Date.now();
            const timeLeft = qrExpiryTime - now;

            if (timeLeft <= 0 || qrCodeExpired) {
                clearInterval(countdownTimer);
                return;
            }

            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);

            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                const timerElement = countdownElement.parentElement;
                timerElement.classList.remove('warning', 'danger');

                if (timeLeft <= 30000) { // Last 30 seconds
                    timerElement.classList.add('danger');
                } else if (timeLeft <= 60000) { // Last minute
                    timerElement.classList.add('warning');
                }
            }
        }, 1000);
    }

    function showStep(showElement, hideElement) {
        hideElement.classList.add('fade-out');

        setTimeout(() => {
            hideElement.classList.add('d-none');
            hideElement.classList.remove('fade-out');

            showElement.classList.remove('d-none');
            showElement.classList.add('fade-in');

            setTimeout(() => {
                showElement.classList.remove('fade-in');
            }, 500);
        }, 300);
    }

    function setupCodeInputs() {
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                // Only allow numbers
                this.value = this.value.replace(/[^0-9]/g, '');

                // Move to next input
                if (this.value.length === 1 && index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }

                // Auto-submit when all fields are filled
                if (getEnteredCode().length === 6) {
                    setTimeout(() => {
                        codeForm.dispatchEvent(new Event('submit'));
                    }, 500);
                }
            });

            input.addEventListener('keydown', function(e) {
                // Handle backspace
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');

                if (pastedData.length === 6) {
                    for (let i = 0; i < 6; i++) {
                        codeInputs[i].value = pastedData[i] || '';
                    }
                    setTimeout(() => {
                        codeForm.dispatchEvent(new Event('submit'));
                    }, 500);
                }
            });
        });
    }

    function getEnteredCode() {
        return Array.from(codeInputs).map(input => input.value).join('');
    }

    function clearCodeInputs() {
        codeInputs.forEach(input => {
            input.value = '';
            input.classList.remove('is-valid', 'is-invalid');
        });
    }

    function showCodeError(message) {
        const feedback = document.querySelector('#codeStep .invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }

        codeInputs.forEach(input => {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
        });
    }

    function showCodeSuccess() {
        codeInputs.forEach(input => {
            input.classList.add('is-valid');
            input.classList.remove('is-invalid');
        });
    }

    function setupPasswordStrength() {
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmNewPassword');
        const strengthIndicator = document.getElementById('passwordStrength');

        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updateStrengthIndicator(strength, strengthIndicator);
        });

        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });

        newPasswordInput.addEventListener('input', validatePasswordMatch);
    }

    function calculatePasswordStrength(password) {
        let score = 0;

        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 3) return 'weak';
        if (score < 5) return 'medium';
        return 'strong';
    }

    function updateStrengthIndicator(strength, indicator) {
        const strengthText = {
            weak: 'Weak - Add more characters and variety',
            medium: 'Medium - Consider adding special characters',
            strong: 'Strong - Great password!'
        };

        indicator.innerHTML = `
            <div class="strength-bar strength-${strength}">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text strength-${strength}">${strengthText[strength]}</div>
        `;
    }

    function validateNewPassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        let isValid = true;

        if (newPassword.length < 6) {
            MusicFlowUtils.addValidation(document.getElementById('newPassword'), false);
            isValid = false;
        } else {
            MusicFlowUtils.addValidation(document.getElementById('newPassword'), true);
        }

        if (newPassword !== confirmPassword) {
            MusicFlowUtils.addValidation(document.getElementById('confirmNewPassword'), false);
            isValid = false;
        } else if (confirmPassword) {
            MusicFlowUtils.addValidation(document.getElementById('confirmNewPassword'), true);
        }

        return isValid;
    }

    function validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (confirmPassword && newPassword !== confirmPassword) {
            MusicFlowUtils.addValidation(document.getElementById('confirmNewPassword'), false);
        } else if (confirmPassword && newPassword === confirmPassword) {
            MusicFlowUtils.addValidation(document.getElementById('confirmNewPassword'), true);
        }
    }

    // Check for expired session on page load
    if (resetRequestTime) {
        const requestTime = parseInt(resetRequestTime);
        const now = Date.now();
        const timeSinceRequest = now - requestTime;

        // If more than 10 minutes have passed since reset request
        if (timeSinceRequest > 600000) {
            alert('Reset session expired. Please start over.');
            localStorage.removeItem('resetUserId');
            localStorage.removeItem('resetRequestTime');
            window.location.href = './reset.html';
        }
    }

    // Request notification permission for demo
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

