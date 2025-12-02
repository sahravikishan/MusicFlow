// 🎸 Enhanced Guitar Script with Modern Features (MusicFlow)
// ----------------------------------------------------------
// Author: MusicFlow Dev Team
// Purpose: Handles layout, profile management, sidebar, settings, and interactivity
// ----------------------------------------------------------

let currentSection = 'home';
let sidebarCollapsed = true;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎶 Enhanced MusicFlow initialized!');
    initializeApp();
    setupEventListeners();
    setupButtonInteractions();
    setupFormValidation();
    loadUserData();
    loadSettings();
});

// ----------------------------------------------------------
// 🚀 Initialization
// ----------------------------------------------------------

function initializeApp() {
    showSection('home');
    updateVolumeDisplay();
    setupProfilePicture();
    initializeLayout();
    initializeDragAndDrop();
}

// Ensure correct layout state on load
function initializeLayout() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuToggle = document.getElementById('menuToggle');

    if (sidebar && mainContent) {
        const savedState = localStorage.getItem('sidebarState');
        const isCollapsed = savedState === 'collapsed' || sidebar.classList.contains('collapsed');

        // Sync global variable
        sidebarCollapsed = isCollapsed;

        // Sync menu toggle active state
        if (menuToggle) {
            if (isCollapsed) {
                menuToggle.classList.remove('active');
            } else {
                menuToggle.classList.add('active');
            }
        }

        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            mainContent.style.marginLeft = '300px';
            mainContent.style.width = 'calc(100% - 300px)';
        }
    }

    document.body.style.minHeight = '100vh';
    document.body.style.width = '100vw';
}

// ----------------------------------------------------------
// 🖱️ Drag and Drop for Guitar Cards
// ----------------------------------------------------------

function initializeDragAndDrop() {
    const guitarCards = document.querySelectorAll('.guitar-card');
    const guitarGrid = document.querySelector('.guitar-grid');
    let draggedCard = null;

    guitarCards.forEach(card => {
        card.draggable = true;

        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            setTimeout(() => {
                delete card.dataset.wasDragged;
            }, 100);
        });

        // Override onclick to prevent navigation if dragged
        card.addEventListener('click', (e) => {
            if (card.dataset.wasDragged === 'true') {
                e.preventDefault();
                return false;
            }
            // Add glow effect on click
            addGlowEffect(card, e);
        });
    });

    guitarGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(guitarGrid, e.clientX);
        const draggableElements = [...guitarGrid.querySelectorAll('.guitar-card:not(.dragging)')];

        draggableElements.forEach(el => {
            el.classList.remove('drag-over');
        });

        if (afterElement) {
            afterElement.classList.add('drag-over');
        }
    });

    guitarGrid.addEventListener('dragleave', (e) => {
        if (e.target.classList.contains('guitar-card')) {
            e.target.classList.remove('drag-over');
        }
    });

    guitarGrid.addEventListener('drop', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(guitarGrid, e.clientX);

        // Remove drag-over class from all
        document.querySelectorAll('.guitar-card').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (draggedCard && afterElement) {
            guitarGrid.insertBefore(draggedCard, afterElement);
        } else if (draggedCard) {
            guitarGrid.appendChild(draggedCard);
        }
    });
}

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.guitar-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ----------------------------------------------------------
// ✨ Glow Effect for Guitar Cards
// ----------------------------------------------------------

function addGlowEffect(card, event) {
    // Remove existing glow from all cards
    document.querySelectorAll('.guitar-card.glowing').forEach(c => {
        c.classList.remove('glowing');
    });

    // Add glow to clicked card
    card.classList.add('glowing');

    // Create ripple effect on card click (pass event if available)
    createRipple(card, event);

    // Remove glow after animation completes
    setTimeout(() => {
        card.classList.remove('glowing');
    }, 600);
}

// ----------------------------------------------------------
// 🌊 Ripple Effect Function
// ----------------------------------------------------------

function createRipple(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event ? (event.clientX - rect.left - size / 2) : (rect.width / 2 - size / 2);
    const y = event ? (event.clientY - rect.top - size / 2) : (rect.height / 2 - size / 2);

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        top: ${y}px;
        left: ${x}px;
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
    `;

    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// ----------------------------------------------------------
// ⚡ Enhanced Button Interactions
// ----------------------------------------------------------

function setupButtonInteractions() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline-primary, .btn-outline-secondary');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple on button click
            if (!button.classList.contains('btn-outline-secondary')) {
                createRipple(this, e);
            }

            // Add press feedback
            this.style.animation = 'buttonPress 0.2s ease-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 200);
        });
    });
}

// ----------------------------------------------------------
// ✅ Form Validation Feedback
// ----------------------------------------------------------

function setupFormValidation() {
    const formInputs = document.querySelectorAll('.form-control, .form-select, input[type="email"], input[type="text"], textarea');

    formInputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            this.classList.add('is-invalid');
            this.style.animation = 'shake 0.4s ease-in-out';

            setTimeout(() => {
                this.style.animation = '';
            }, 400);
        });

        input.addEventListener('change', function() {
            if (this.validity.valid) {
                this.classList.remove('is-invalid');
            }
        });

        input.addEventListener('input', function() {
            if (this.validity.valid) {
                this.classList.remove('is-invalid');
            }
        });
    });
}

// ----------------------------------------------------------
// 🗑️ Clear Profile Form Function
// ----------------------------------------------------------
function clearProfileForm() {
    // Target the profile form (adjust ID if your form is different, e.g., 'profileForm')
    const form = document.getElementById('profileForm') || document.querySelector('.profile-form');
    if (!form) {
        console.warn('Profile form not found - cannot clear');
        return;
    }

    // Reset all form inputs to empty/default
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select');
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
            input.value = '';
        } else if (input.tagName === 'TEXTAREA') {
            input.value = '';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;  // Reset to first option
        }
        // Remove validation classes
        input.classList.remove('is-invalid', 'is-valid');
    });

    // Reset profile picture preview to placeholder
    const fileInput = form.querySelector('input[type="file"]#profile_picture');
    if (fileInput) fileInput.value = '';  // Clear file selection
    updateAllAvatars('');  // Trigger placeholder (no URL)

    // Reset remove picture checkbox if present
    const removeCheckbox = form.querySelector('input[type="checkbox"][name="remove_picture"]');
    if (removeCheckbox) removeCheckbox.checked = false;

    // Optional: Reset bio or other defaults if needed (e.g., empty bio)
    const bioTextarea = form.querySelector('textarea[name="bio"]');
    if (bioTextarea) bioTextarea.value = '';

    // Show success notification
    showNotificationEnhanced('Profile form cleared successfully!', 'info');

    console.debug('Profile form cleared');
}

// ----------------------------------------------------------
// 🎯 Enhanced Notification System
// ----------------------------------------------------------

function showNotificationEnhanced(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${getNotificationColor(type)};
        color: white; padding: 1rem 1.5rem; border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9999; animation: slideInSuccess 0.4s ease-out;
        max-width: 350px; font-weight: 500; backdrop-filter: blur(10px);
    `;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="${icons[type] || icons.info}" style="animation: checkmarkDraw 0.6s ease-out;"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ----------------------------------------------------------
// ⚙️ Event Listeners
// ----------------------------------------------------------

function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    // Sidebar toggle button
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Sidebar navigation
    const menuItems = document.querySelectorAll('.sidebar-menu-item[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
            setActiveMenuItem(item);

            if (window.innerWidth <= 768) hideSidebar();
        });
    });

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);

    // Feature items: keyboard accessibility (Enter / Space to activate)
    const featureItems = document.querySelectorAll('.feature-item[role="button"]');
    featureItems.forEach(fi => {
        fi.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                fi.click();
            }
        });
    });

    // Feature item click handling: open data-link unless subcard clicked
    const featureLinkItems = document.querySelectorAll('.feature-item[data-link]');
    featureLinkItems.forEach(fi => {
        fi.addEventListener('click', (ev) => {
            // if user clicked a subcard anchor, let the anchor handle navigation
            if (ev.target.closest('.subcard')) return;

            // On narrow screens (mobile), toggle the overlay instead of navigating
            if (window.innerWidth <= 768) {
                ev.preventDefault();
                fi.classList.toggle('subcards-open');
                return;
            }

            const link = fi.getAttribute('data-link');
            if (link) window.open(link, '_blank');
        });
    });

    // Close any open subcards overlay when clicking outside (mobile behavior)
    document.addEventListener('click', (ev) => {
        if (window.innerWidth > 768) return; // desktop uses hover/focus
        const openItem = document.querySelector('.feature-item.subcards-open');
        if (!openItem) return;
        if (ev.target.closest('.feature-item.subcards-open')) return; // clicked inside — ignore
        openItem.classList.remove('subcards-open');
    });

    // Close overlays with Escape key for accessibility
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            document.querySelectorAll('.feature-item.subcards-open').forEach(fi => fi.classList.remove('subcards-open'));
        }
    });

    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) volumeSlider.addEventListener('input', handleVolumeChange);

    // Settings toggles
    setupSettingsToggles();

    // Window resize handler
    window.addEventListener('resize', handleWindowResize);
}

// ----------------------------------------------------------
// 🧭 Sidebar Controls
// ----------------------------------------------------------

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const menuToggle = document.getElementById('menuToggle');

    sidebarCollapsed = !sidebarCollapsed;
    mainContent.style.transition = 'all 0.3s ease';

    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
        if (menuToggle) menuToggle.classList.remove('active');
        localStorage.setItem('sidebarState', 'collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        mainContent.style.marginLeft = '300px';
        mainContent.style.width = 'calc(100% - 300px)';
        if (menuToggle) menuToggle.classList.add('active');
        localStorage.setItem('sidebarState', 'expanded');
    }
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const menuToggle = document.getElementById('menuToggle');

    sidebarCollapsed = true;
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
    if (menuToggle) menuToggle.classList.remove('active');
    localStorage.setItem('sidebarState', 'collapsed');
}

// ----------------------------------------------------------
// 📄 Section Navigation
// ----------------------------------------------------------

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) targetSection.classList.add('active');

    currentSection = sectionName;
    updatePageTitle(sectionName);
}

function setActiveMenuItem(activeItem) {
    document.querySelectorAll('.sidebar-menu-item[data-section]').forEach(item => {
        item.classList.remove('active');
    });
    if (activeItem) activeItem.classList.add('active');
}

function updatePageTitle(section) {
    const titles = {
        home: 'MusicFlow - Guitar Music Generator',
        profile: 'MusicFlow - Profile',
        settings: 'MusicFlow - Settings'
    };
    document.title = titles[section] || 'MusicFlow - Guitar Music Generator';
}

// ----------------------------------------------------------
// 👤 Profile Management - FIXED: Proper image handling
// ----------------------------------------------------------

function setupProfilePicture() {
    const fileInput = document.getElementById('profilePictureInput');
    const previewElement = document.getElementById('profilePicturePreview');

    if (!fileInput || !previewElement) {
        console.warn('Profile picture elements not found');
        return;
    }

    // Prevent double-initialization
    if (fileInput.dataset.initialized === '1') {
        console.debug('setupProfilePicture: already initialized, skipping');
        return;
    }
    fileInput.dataset.initialized = '1';
    console.debug('setupProfilePicture: initialized with auto-upload');

    const sidebarAvatar = document.getElementById('userAvatar');
    const navbarAvatar = document.getElementById('navbarAvatar');

    // FIXED: Auto-upload when file is selected
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        console.debug('profilePictureInput.change event', file);
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotificationEnhanced('Please select a valid image file', 'warning');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showNotificationEnhanced('Image size must be less than 5MB', 'warning');
            return;
        }

        // Show preview immediately with proper element handling
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;

            // Update preview - convert div to img if needed
            if (previewElement.tagName === 'DIV') {
                const imgElement = document.createElement('img');
                imgElement.id = 'profilePicturePreview';
                imgElement.className = 'profile-picture';
                imgElement.alt = 'Profile Picture';
                imgElement.style.display = 'block';
                imgElement.src = imageData;
                previewElement.parentNode.replaceChild(imgElement, previewElement);
            } else {
                previewElement.src = imageData;
                previewElement.style.display = 'block';
                previewElement.style.opacity = '1';
            }

            // Update sidebar and navbar avatars with preview
            if (sidebarAvatar) {
                sidebarAvatar.style.backgroundImage = `url(${imageData})`;
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
                sidebarAvatar.innerHTML = '';
            }
            if (navbarAvatar) {
                navbarAvatar.style.backgroundImage = `url(${imageData})`;
                navbarAvatar.style.backgroundSize = 'cover';
                navbarAvatar.style.backgroundPosition = 'center';
                navbarAvatar.innerHTML = '';
            }
        };
        reader.readAsDataURL(file);

        // FIXED: Immediately upload to server
        uploadProfilePictureImmediately(file);
    });

    // Click on preview container to upload
    const previewContainer = document.querySelector('.profile-picture-container');
    if (previewContainer) {
        previewContainer.addEventListener('click', function(e) {
            if (e.target.id === 'profilePicturePreview' || e.target.closest('#profilePicturePreview')) {
                fileInput.click();
            }
        });
    }
}

// FIXED: New function to immediately upload profile picture
function uploadProfilePictureImmediately(file) {
    const formData = new FormData();
    formData.append('profile_picture', file);

    // Add CSRF token
    formData.append('csrfmiddlewaretoken', window.djangoData.csrfToken);

    showNotificationEnhanced('Uploading profile picture...', 'info');

    fetch(window.djangoData.profileUpdateUrl, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': window.djangoData.csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotificationEnhanced('Profile picture uploaded successfully!', 'success');

            // Update with permanent server URL - but only if it's valid
            if (data.profile_picture_url) {
                updateAllAvatars(data.profile_picture_url);

                // Update djangoData for persistence
                if (window.djangoData && window.djangoData.profile) {
                    window.djangoData.profile.profilePictureUrl = data.profile_picture_url;
                }
            } else {
                // No URL returned, show placeholder
                showPlaceholder();
            }
        } else {
            showNotificationEnhanced(data.error || 'Upload failed', 'error');
            // Revert to placeholder on error
            showPlaceholder();
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotificationEnhanced('Failed to upload profile picture', 'error');
        // Revert to placeholder on error
        showPlaceholder();
    });
}

function removeProfilePicture() {
    const previewElement = document.getElementById('profilePicturePreview');
    const fileInput = document.getElementById('profilePictureInput');
    console.debug('removeProfilePicture called');

    // Clear file input
    if (fileInput) {
        fileInput.value = '';
    }

    // Show placeholder immediately
    showPlaceholder();

    // FIXED: Immediately send removal request to server
    const formData = new FormData();
    formData.append('remove_picture', 'true');
    formData.append('csrfmiddlewaretoken', window.djangoData.csrfToken);

    fetch(window.djangoData.profileUpdateUrl, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': window.djangoData.csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotificationEnhanced('Profile picture removed successfully!', 'success');

            // Update djangoData
            if (window.djangoData && window.djangoData.profile) {
                window.djangoData.profile.profilePictureUrl = null;
            }
        } else {
            showNotificationEnhanced(data.error || 'Failed to remove picture', 'error');
        }
    })
    .catch(error => {
        console.error('Remove error:', error);
        showNotificationEnhanced('Failed to remove profile picture', 'error');
    });
}

// Helper function to show placeholder
function showPlaceholder() {
    const previewElement = document.getElementById('profilePicturePreview');
    const sidebarAvatar = document.getElementById('userAvatar');
    const navbarAvatar = document.getElementById('navbarAvatar');

    // Replace with placeholder div
    if (previewElement) {
        if (previewElement.tagName === 'IMG') {
            const placeholder = document.createElement('div');
            placeholder.id = 'profilePicturePreview';
            placeholder.className = 'profile-picture profile-picture-placeholder';
            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 3rem;';
            placeholder.innerHTML = '<i class="fas fa-user"></i>';
            previewElement.parentNode.replaceChild(placeholder, previewElement);
        } else {
            previewElement.className = 'profile-picture profile-picture-placeholder';
            previewElement.style.cssText = 'display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 3rem;';
            previewElement.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    // Clear avatars
    if (sidebarAvatar) {
        sidebarAvatar.style.backgroundImage = '';
        sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    if (navbarAvatar) {
        navbarAvatar.style.backgroundImage = '';
        navbarAvatar.innerHTML = '<i class="fas fa-user"></i>';
    }
}

function handleProfileSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Validation
    const firstName = formData.get('first_name');
    const lastName = formData.get('last_name');
    const email = formData.get('email');
    const phone = formData.get('phone');

    if (!firstName || !firstName.trim()) {
        showNotificationEnhanced('First Name is required', 'warning');
        document.getElementById('firstName').focus();
        return;
    }
    if (!lastName || !lastName.trim()) {
        showNotificationEnhanced('Last Name is required', 'warning');
        document.getElementById('lastName').focus();
        return;
    }
    if (!email || !email.trim()) {
        showNotificationEnhanced('Email is required', 'warning');
        document.getElementById('email').focus();
        return;
    }
    if (!phone || !phone.trim()) {
        showNotificationEnhanced('Phone Number is required', 'warning');
        document.getElementById('phone').focus();
        return;
    }

    // Enhanced success message with visual feedback
    const submitBtn = form.querySelector('.btn-primary');
    let originalText = '';
    if (submitBtn) {
        originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Send to server
    fetch(window.djangoData.profileUpdateUrl, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': window.djangoData.csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotificationEnhanced('Profile saved successfully!', 'success');

            // Update local display
            const profileData = {
                firstName: firstName,
                lastName: lastName,
                email: email
            };
            updateUserDisplay(profileData);

            // Update profile picture if returned and valid
            if (data.profile_picture_url) {
                updateAllAvatars(data.profile_picture_url);

                // Update djangoData
                if (window.djangoData && window.djangoData.profile) {
                    window.djangoData.profile.profilePictureUrl = data.profile_picture_url;
                }
            }

            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Saved!';
                submitBtn.style.background = '#4caf50';
                submitBtn.style.color = 'white';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                }, 1500);
            }
        } else {
            showNotificationEnhanced(data.error || 'Error saving profile', 'error');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotificationEnhanced('An error occurred. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}


function loadUserData() {
    // Load from server data injected into window.djangoData
    if (window.djangoData && window.djangoData.profile) {
        const profile = window.djangoData.profile;

        // Populate form fields
        const fields = {
            'firstName': profile.firstName,
            'lastName': profile.lastName,
            'email': profile.email,
            'phone': profile.phone,
            'profession': profile.profession,
            'genre': profile.genre,
            'instrument': profile.instrument,
            'level': profile.level,
            'bio': profile.bio
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });

        // Update display
        updateUserDisplay(profile);

        // FIXED: Load profile picture from server - prioritize djangoData for consistency
        const previewElement = document.getElementById('profilePicturePreview');
        let profilePicUrl = null;

        // Priority 1: Use djangoData (most reliable source from server)
        if (profile.profilePictureUrl && profile.profilePictureUrl.trim() !== '') {
            profilePicUrl = profile.profilePictureUrl;
            console.debug('Profile picture loaded from djangoData:', profilePicUrl);
        }
        // Priority 2: Fall back to template img src if djangoData is empty
        else if (previewElement && previewElement.tagName === 'IMG' && previewElement.src && !previewElement.src.includes('placeholder')) {
            profilePicUrl = previewElement.src;
            console.debug('Profile picture loaded from template img src:', profilePicUrl);
        }

        // Apply the profile picture
        if (profilePicUrl) {
            updateAllAvatars(profilePicUrl);
            console.debug('Profile picture applied successfully');
        } else {
            console.debug('No profile picture found, using default placeholder');
            showPlaceholder();
        }
    }
}

function updateUserDisplay(profileData) {
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');
    const navbarUserName = document.getElementById('navbarUserName');

    if (userName) {
        userName.textContent = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Guest User';
    }
    if (userEmail) {
        userEmail.textContent = profileData.email || '';
    }
    if (navbarUserName) {
        navbarUserName.textContent = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Guest User';
    }
}
// ----------------------------------------------------------
// 🔄 Utility: Update All Avatars with Permanent URL - WITH 404 FALLBACK
// ----------------------------------------------------------
function updateAllAvatars(profilePictureUrl) {
    const previewElement = document.getElementById('profilePicturePreview');
    const sidebarAvatar = document.getElementById('userAvatar');
    const navbarAvatar = document.getElementById('navbarAvatar');

    // Helper to set placeholder on any avatar
    function setPlaceholder(element) {
        if (element) {
            element.style.backgroundImage = 'none';
            element.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    if (profilePictureUrl && profilePictureUrl.trim() !== '') {
        const fullUrl = profilePictureUrl.startsWith('http') ? profilePictureUrl : window.location.origin + profilePictureUrl;

        console.debug('Updating avatars with URL:', fullUrl);

        // Update preview element - convert to img if it's a div
        if (previewElement) {
            let imgElement;
            if (previewElement.tagName !== 'IMG') {
                imgElement = document.createElement('img');
                imgElement.id = 'profilePicturePreview';
                imgElement.className = 'profile-picture';
                imgElement.alt = 'Profile Picture';
                imgElement.style.display = 'block';
                previewElement.parentNode.replaceChild(imgElement, previewElement);
                imgElement = document.getElementById('profilePicturePreview');  // Re-get after replace
            } else {
                imgElement = previewElement;
                imgElement.style.display = 'block';
                imgElement.style.opacity = '1';
            }

            // Add onerror fallback for 404
            imgElement.onerror = function() {
                console.warn('Profile image failed to load (404), showing placeholder');
                this.style.display = 'none';
                showPlaceholder();  // Trigger full placeholder reset
            };
            imgElement.src = fullUrl;
        }

        // Update sidebar avatar (background-image with fallback)
        if (sidebarAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${fullUrl})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.innerHTML = '';

            // Simulate onerror for background (load test briefly, then fallback)
            const testImg = new Image();
            testImg.onload = () => { /* Loaded - do nothing */ };
            testImg.onerror = () => {
                console.warn('Sidebar profile image failed to load (404), showing placeholder');
                setPlaceholder(sidebarAvatar);
            };
            testImg.src = fullUrl;
        }

        // Update navbar avatar (same as sidebar)
        if (navbarAvatar) {
            navbarAvatar.style.backgroundImage = `url(${fullUrl})`;
            navbarAvatar.style.backgroundSize = 'cover';
            navbarAvatar.style.backgroundPosition = 'center';
            navbarAvatar.innerHTML = '';

            const testImg = new Image();
            testImg.onload = () => { /* Loaded - do nothing */ };
            testImg.onerror = () => {
                console.warn('Navbar profile image failed to load (404), showing placeholder');
                setPlaceholder(navbarAvatar);
            };
            testImg.src = fullUrl;
        }
    } else {
        // No picture: Explicitly show placeholder in all locations
        console.debug('No profile picture URL - showing placeholder');
        showPlaceholder();
    }

    console.debug('Avatar update initiated for URL:', profilePictureUrl || 'none');
}

// ----------------------------------------------------------
// 🖼️ Placeholder Helper (for no-photo or 404 cases) - BLUE HUMAN ICON
// ----------------------------------------------------------
function showPlaceholder() {
    const previewElement = document.getElementById('profilePicturePreview');
    const sidebarAvatar = document.getElementById('userAvatar');
    const navbarAvatar = document.getElementById('navbarAvatar');
    const humanIconHTML = '<i class="fas fa-user-circle" style="color: #667eea; font-size: 1.5em;"></i>';  // Blue human icon

    // Reset preview to hidden (no icon needed here, as it's a full preview area)
    if (previewElement) {
        previewElement.style.display = 'none';
    }

    // Reset sidebar and navbar to blue human placeholder
    if (sidebarAvatar) {
        sidebarAvatar.style.backgroundImage = 'none';
        sidebarAvatar.innerHTML = humanIconHTML;
        sidebarAvatar.style.color = '#667eea';  // Ensure icon color
    }
    if (navbarAvatar) {
        navbarAvatar.style.backgroundImage = 'none';
        navbarAvatar.innerHTML = humanIconHTML;
        navbarAvatar.style.color = '#667eea';  // Ensure icon color
    }

    console.debug('Blue human placeholder set');
}

// ----------------------------------------------------------
// 🔊 Volume and Settings
// ----------------------------------------------------------

function handleVolumeChange(e) {
    const volume = e.target.value;
    updateVolumeDisplay(volume);
    localStorage.setItem('musicflow_volume', volume);
}

function updateVolumeDisplay(volume) {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.querySelector('.volume-value');
    if (volumeSlider && volumeValue) {
        const currentVolume = volume || volumeSlider.value;
        volumeValue.textContent = `${currentVolume}%`;
    }
}

function setupSettingsToggles() {
    const toggles = ['lightMode', 'showNoteNames', 'soundNotifications', 'autoSave'];
    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.addEventListener('change', function(e) {
                handleSettingToggle(toggleId, this.checked);

                const label = this.nextElementSibling;
                if (label) {
                    label.style.animation = 'toggleFlip 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    setTimeout(() => {
                        label.style.animation = '';
                    }, 400);
                }

                const state = this.checked ? 'Enabled' : 'Disabled';
                showNotificationEnhanced(`${toggleId.replace(/([A-Z])/g, ' $1').trim()} ${state}`, 'info');
            });
        }
    });
}

function handleSettingToggle(settingName, isEnabled) {
    if (settingName === 'lightMode') {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        console.debug('handleSettingToggle: lightMode ->', isEnabled);

        if (isEnabled) {
            document.body.classList.remove('dark-mode');
            sidebar?.classList.remove('dark-mode');
            menuToggle?.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
            sidebar?.classList.add('dark-mode');
            menuToggle?.classList.add('dark-mode');
        }

        saveDashboard({
            page_theme: isEnabled ? 'light' : 'dark'
        });
    }
}

function saveSettings() {
    const lightMode = document.getElementById('lightMode')?.checked;

    const dashboardData = {
        page_theme: lightMode ? 'light' : 'dark',
    };

    saveDashboard(dashboardData, true);
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        const lightModeCheckbox = document.getElementById('lightMode');
        if (lightModeCheckbox) lightModeCheckbox.checked = false;

        handleSettingToggle('lightMode', false);

        showNotificationEnhanced('Settings reset to default', 'info');
    }
}

function loadSettings() {
    if (window.djangoData && window.djangoData.dashboard) {
        const dashboard = window.djangoData.dashboard;

        const lightModeCheckbox = document.getElementById('lightMode');
        const isLight = dashboard.theme === 'light';

        if (lightModeCheckbox) {
            lightModeCheckbox.checked = isLight;
        }

        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');

        if (isLight) {
            document.body.classList.remove('dark-mode');
            sidebar?.classList.remove('dark-mode');
            menuToggle?.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
            sidebar?.classList.add('dark-mode');
            menuToggle?.classList.add('dark-mode');
        }

        const savedVolume = localStorage.getItem('musicflow_volume');
        if (savedVolume) {
            const volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider) volumeSlider.value = savedVolume;
            updateVolumeDisplay(savedVolume);
        }
    }
}

// ----------------------------------------------------------
// 🧱 Window & Logout Handling
// ----------------------------------------------------------

function handleWindowResize() {
    if (window.innerWidth <= 768 && !sidebarCollapsed) hideSidebar();
}

function handleLogout() {
    // Handled by link href
}

// ----------------------------------------------------------
// 🔔 Notification System
// ----------------------------------------------------------

function showNotification(message, type = 'info') {
    showNotificationEnhanced(message, type);
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #4CAF50, #45a049)',
        error: 'linear-gradient(135deg, #f44336, #da190b)',
        warning: 'linear-gradient(135deg, #ff9800, #f57c00)',
        info: 'linear-gradient(135deg, #2196F3, #0b7dda)'
    };
    return colors[type] || colors.info;
}

// ----------------------------------------------------------
// 🎨 Inject Animations & Styles
// ----------------------------------------------------------

const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(style);


// ----------------------------------------------------------
// 💾 Server Sync
// ----------------------------------------------------------

function saveDashboard(data, showNotify = false) {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }

    fetch(window.djangoData.saveDashboardUrl, {
        method: "POST",
        headers: {
            "X-CSRFToken": window.djangoData.csrfToken,
            "X-Requested-With": "XMLHttpRequest"
        },
        body: formData
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            console.log("Dashboard saved:", res.message);
            if (showNotify) {
                showNotificationEnhanced('Settings saved successfully!', 'success');

                const saveBtn = document.querySelector('.settings-actions .btn-primary');
                if (saveBtn) {
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Saved!';
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText;
                    }, 2000);
                }
            }
        } else {
            console.error("Dashboard save failed:", res.message);
        }
    })
    .catch(err => console.error("Error saving dashboard:", err));
}


