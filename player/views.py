from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.db import transaction, IntegrityError
from .forms import LoginForm, SignupForm, PasswordResetForm, PasswordResetConfirmForm
from .models import Profile, Dashboard
import logging
import random
import os
from django.core.cache import cache
from django.contrib.auth.hashers import make_password, check_password
from django.core.files.storage import default_storage
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import csrf_exempt

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Cache-based rate limiting
RATE_LIMIT_SECONDS = 60
MAX_ATTEMPTS = 10
RESET_TIMEOUT_SECONDS = 120  # 2 minutes


def check_rate_limit(request):
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    cache_key = f'rate_limit_{ip}'
    attempts = cache.get(cache_key, 0)
    if attempts >= MAX_ATTEMPTS:
        return False
    cache.set(cache_key, attempts + 1, timeout=RATE_LIMIT_SECONDS)
    return True


def index(request):
    return render(request, 'player/index.html')


def _get_safe_profile_picture_url(profile):
    """
    Helper function to get profile picture URL only if file actually exists
    """
    if not profile.profile_picture:
        return None

    try:
        # Check if file actually exists
        if default_storage.exists(profile.profile_picture.name):
            return profile.profile_picture.url
        else:
            # File doesn't exist, clear the database reference
            logger.warning(f"Profile picture file missing: {profile.profile_picture.name}")
            profile.profile_picture = None
            profile.save()
            return None
    except Exception as e:
        logger.error(f"Error checking profile picture: {e}")
        return None


def _refresh_profile_session(request, user):
    """
    Helper: ensure session contains profile_picture_url so templates have a reliable source.
    """
    try:
        profile, _ = Profile.objects.get_or_create(user=user)
        request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
    except Exception as e:
        logger.debug(f"_refresh_profile_session error: {e}")
        request.session['profile_picture_url'] = None


def guitar_index(request):
    if not request.user.is_authenticated:
        request.session['last_page'] = request.get_full_path()
        login_url = reverse('player:login')
        next_url = request.get_full_path()
        return redirect(f"{login_url}?next={next_url}")

    profile, _ = Profile.objects.get_or_create(user=request.user)
    dashboard, _ = Dashboard.objects.get_or_create(user=request.user)

    # Keep session in sync with profile picture (ensures persistence after login)
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)

    return render(request, 'player/guitar_index.html', {
        'profile': profile,
        'dashboard': dashboard,
        'user': request.user,
        'profile_picture_url': request.session.get('profile_picture_url'),
    })


@login_required
def guitar_feature_info(request):
    """
    View for the guitar feature info page.
    """
    request.session['last_page'] = request.get_full_path()
    profile, created = Profile.objects.get_or_create(user=request.user)

    # Refresh session image
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)

    return render(request, 'player/guitar_feature_info.html', {
        'profile': profile,
        'user': request.user,
        'profile_picture_url': request.session.get('profile_picture_url'),
    })


@login_required
def profile_update(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)
    # Use META for broader compatibility
    is_ajax = request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'

    if request.method == 'POST':
        try:
            # Update User fields
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            new_email = request.POST.get('email', user.email)

            if new_email != user.email:
                if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                    error_msg = 'Email already in use.'
                    if is_ajax:
                        return JsonResponse({'success': False, 'error': error_msg})
                    messages.error(request, error_msg)
                    return redirect('player:guitar_index')
                user.email = new_email
            user.save()

            # Update Profile fields
            profile.first_name = user.first_name
            profile.last_name = user.last_name
            profile.phone = request.POST.get('phone', profile.phone)
            profile.profession = request.POST.get('profession', profile.profession)
            profile.genre = request.POST.get('genre', profile.genre)
            profile.instrument = request.POST.get('instrument', profile.instrument)
            profile.level = request.POST.get('level', profile.level)
            profile.bio = request.POST.get('bio', profile.bio)

            # Handle remove + upload correctly
            remove_pic = request.POST.get("remove_picture") == "true"

            # If user uploaded new image → ALWAYS use it (ignore remove flag)
            if "profile_picture" in request.FILES:
                new_pic = request.FILES["profile_picture"]
                if new_pic:
                    logger.info(
                        f"*** UPLOAD RECEIVED: Filename={new_pic.name}, Size={new_pic.size} bytes, Content-Type={new_pic.content_type} ***")

                    # delete old file physically (if exists)
                    if profile.profile_picture:
                        try:
                            if default_storage.exists(profile.profile_picture.name):
                                default_storage.delete(profile.profile_picture.name)
                        except Exception as e:
                            logger.debug(f"Could not delete old profile picture: {e}")

                    # Save new file
                    profile.profile_picture = new_pic
                    logger.info(f"*** ASSIGNING FILE: Will save to {profile.profile_picture.name} ***")
                    remove_pic = False  # cancel delete if new pic uploaded

            # If user clicked remove (and did not upload new one)
            if remove_pic:
                if profile.profile_picture:
                    try:
                        if default_storage.exists(profile.profile_picture.name):
                            default_storage.delete(profile.profile_picture.name)
                    except Exception as e:
                        logger.debug(f"Could not delete removed picture: {e}")
                profile.profile_picture = None

            profile.save()

            # Verify file was actually saved and get safe URL
            safe_url = _get_safe_profile_picture_url(profile)

            logger.info(f"*** SAVE COMPLETE: Safe URL: {safe_url} ***")

            # Refresh session so subsequent page loads display the saved picture
            request.session['profile_picture_url'] = safe_url

            logger.info(f"Profile updated for {user.username}: Bio='{profile.bio}', Level='{profile.level}'")

            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': 'Profile updated successfully!',
                    'image_url': safe_url,
                    'profile_picture_url': safe_url,
                    'profile': {
                        'firstName': profile.first_name,
                        'lastName': profile.last_name,
                    }
                })

            messages.success(request, 'Profile updated successfully!')
            return redirect('player:guitar_index')

        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            if is_ajax:
                return JsonResponse({'success': False, 'error': str(e)})
            messages.error(request, 'An error occurred while updating profile. Please try again.')
            return redirect('player:guitar_index')

    return redirect('player:guitar_index')


@login_required
def guitar_acoustic(request):
    request.session['last_page'] = request.get_full_path()
    profile, created = Profile.objects.get_or_create(user=request.user)
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
    return render(request, 'player/guitar_acoustic.html', {'profile': profile, 'user': request.user,
                                                           'profile_picture_url': request.session.get(
                                                               'profile_picture_url')})


@login_required
def guitar_electric(request):
    request.session['last_page'] = request.get_full_path()
    profile, created = Profile.objects.get_or_create(user=request.user)
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
    return render(request, 'player/guitar_electric.html', {'profile': profile, 'user': request.user,
                                                           'profile_picture_url': request.session.get(
                                                               'profile_picture_url')})


@login_required
def guitar_classical(request):
    request.session['last_page'] = request.get_full_path()
    profile, created = Profile.objects.get_or_create(user=request.user)
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
    return render(request, 'player/guitar_classical.html', {'profile': profile, 'user': request.user,
                                                            'profile_picture_url': request.session.get(
                                                                'profile_picture_url')})


@login_required
def guitar_bass(request):
    request.session['last_page'] = request.get_full_path()
    profile, created = Profile.objects.get_or_create(user=request.user)
    request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
    return render(request, 'player/guitar_bass.html', {'profile': profile, 'user': request.user,
                                                       'profile_picture_url': request.session.get(
                                                           'profile_picture_url')})


def login(request):
    # Check if it's an AJAX request
    is_ajax = request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'

    if request.method == 'POST':
        logger.debug(f'POST data: {request.POST}')
        if not check_rate_limit(request):
            error_msg = 'Too many login attempts. Please try again later.'
            logger.error('Rate limit exceeded')
            if is_ajax:
                return JsonResponse({'success': False, 'error': error_msg})
            messages.error(request, error_msg)
            return render(request, 'player/login.html')

        form = LoginForm(request.POST)
        if form.is_valid():
            username_input = form.cleaned_data['username']
            password = form.cleaned_data['password']
            remember_me = form.cleaned_data['remember_me']
            logger.debug(f'Login attempt with username_input: {username_input}, remember_me: {remember_me}')

            try:
                user_obj = User.objects.get(email=username_input)
                username = user_obj.username
                logger.debug(f'Found user by email: {username}')
            except User.DoesNotExist:
                username = username_input
                logger.debug(f'Using direct username: {username}')

            user = authenticate(request, username=username, password=password)
            if user is not None:
                if user.is_active:
                    auth_login(request, user)

                    # Refresh profile session immediately so UI has correct image
                    try:
                        profile, _ = Profile.objects.get_or_create(user=user)
                        request.session['profile_picture_url'] = _get_safe_profile_picture_url(profile)
                    except Exception as e:
                        logger.debug(f"Error setting session profile_picture_url on login: {e}")
                        request.session['profile_picture_url'] = None

                    # Set session expiry based on remember_me
                    if remember_me:
                        request.session.set_expiry(settings.SESSION_COOKIE_AGE)
                    else:
                        request.session.set_expiry(0)  # Browser session only

                    logger.info(f'User {username} logged in successfully, redirecting to dashboard')

                    # Handle redirect to last page or next param
                    next_url = request.POST.get('next', request.GET.get('next'))
                    if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts=settings.ALLOWED_HOSTS):
                        redirect_url = next_url
                    elif 'last_page' in request.session:
                        last_url = request.session.pop('last_page')
                        if any(bad_path in last_url.lower() for bad_path in ['logout', 'login', 'signup', 'reset']):
                            logger.warning(f'Ignoring invalid last_page: {last_url} to prevent redirect loop')
                            redirect_url = reverse('player:guitar_index')
                        elif url_has_allowed_host_and_scheme(last_url, allowed_hosts=settings.ALLOWED_HOSTS):
                            redirect_url = last_url
                        else:
                            redirect_url = reverse('player:guitar_index')
                    else:
                        redirect_url = reverse('player:guitar_index')

                    if is_ajax:
                        return JsonResponse({
                            'success': True,
                            'message': 'Welcome back! You have signed in successfully.',
                            'redirect_url': redirect_url
                        })

                    messages.success(request, 'Welcome back! You have signed in successfully.')
                    return redirect(redirect_url)
                else:
                    error_msg = 'Your account is disabled. Please contact support.'
                    logger.warning(f'Account disabled for user: {username}')
                    if is_ajax:
                        return JsonResponse({'success': False, 'error': error_msg})
                    messages.error(request, error_msg)
            else:
                error_msg = 'Invalid username/email or password.'
                logger.warning(f'Authentication failed for username_input: {username_input}')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg})
                messages.error(request, error_msg)
        else:
            error_msg = 'Please correct the errors below.'
            logger.debug(f'Login form errors: {form.errors}')
            if is_ajax:
                return JsonResponse({'success': False, 'error': error_msg, 'form_errors': form.errors.as_json()})
            messages.error(request, error_msg)

        return render(request, 'player/login.html', {'form': form})
    else:
        form = LoginForm()
    return render(request, 'player/login.html', {'form': form})


def signup(request):
    if request.method == 'GET':
        form = SignupForm()
        return render(request, 'player/signup.html', {'form': form})
    else:
        form = SignupForm(request.POST)
        # ADD THIS LINE: Define is_ajax here to detect AJAX requests
        is_ajax = request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'

        if form.is_valid():
            raw_terms = request.POST.get('accept_terms')
            raw_privacy = request.POST.get('accept_privacy')
            logger.debug(f'Raw accept_terms={raw_terms!r}, accept_privacy={raw_privacy!r}')

            if not (form.cleaned_data.get('accept_terms') and form.cleaned_data.get('accept_privacy')):
                error_msg = 'You must accept both Terms & Conditions and Privacy Policy.'
                logger.warning('Signup blocked: terms/privacy not accepted')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg, 'form_errors': form.errors.as_json()})
                messages.error(request, error_msg)
                return render(request, 'player/signup.html', {'form': form})

            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        username=form.cleaned_data['username'],
                        email=form.cleaned_data['email'],
                        password=form.cleaned_data['password']
                    )
                    user.save()
                    # Profile is automatically created by signal
                logger.debug(f'User created: {user.username}')

                # Fix: Specify backend for manual login after creation
                auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

                # ensure session has profile info after signup
                try:
                    _refresh_profile_session(request, user)
                except Exception:
                    pass

                if is_ajax:
                    return JsonResponse({'success': True, 'message': 'Account created successfully!'})

                messages.success(request, 'Account created successfully! Welcome!')
                return redirect('player:guitar_index')
            except IntegrityError as e:
                error_msg = 'Username or email already exists. Please try a different one.'
                logger.error(f'IntegrityError during signup: {str(e)}')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg})
                messages.error(request, error_msg)
                return render(request, 'player/signup.html', {'form': form})
            except Exception as e:
                error_msg = f'An error occurred during registration: {str(e)}'
                logger.error(error_msg)
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg})
                messages.error(request, error_msg)
                return render(request, 'player/signup.html', {'form': form})
        else:
            # Return form errors as JSON for AJAX requests
            logger.debug(f'Signup form errors: {form.errors}')
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'form_errors': form.errors.as_json()
                })
            messages.error(request, 'Please correct the errors below.')
            return render(request, 'player/signup.html', {'form': form})


def privacy(request):
    return render(request, 'player/privacy.html')


def terms_condition(request):
    return render(request, 'player/terms_condition.html')


def reset(request):
    if request.method == 'POST':
        if not check_rate_limit(request):
            messages.error(request, 'Too many reset attempts. Please try again later.')
            return render(request, 'player/reset.html')

        form = PasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            try:
                user = User.objects.get(email=email)
                otp = random.randint(100000, 999999)
                otp_str = str(otp)
                otp_hashed = make_password(otp_str)
                cache.set(f'reset_code_{user.pk}', otp_hashed, timeout=RESET_TIMEOUT_SECONDS)

                logger.info(f"Generated OTP: {otp_str} for {user.email}")

                try:
                    logo_url = request.build_absolute_uri('/images/OTP.jpg')
                    html_message = f"""
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                        <img src="{logo_url}" alt="MusicFlow Logo" style="width: 100px; height: 100px; border-radius: 10px;">
                        <h2 style="color: #333;">MusicFlow Password Reset</h2>
                        <p style="font-size: 16px;">Your reset code is:</p>
                        <p style="font-size: 22px; font-weight: bold; color: #007BFF;">{otp_str}</p>
                        <p style="color: #555;">Valid for 2 minutes only.</p>
                        <hr style="margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">This is an automated message from MusicFlow. Please do not reply.</p>
                    </div>
                    """

                    print(
                        f"[EMAIL DEBUG] Sending OTP {otp_str} to {user.email} using backend: {settings.EMAIL_BACKEND}")
                    sent_count = send_mail(
                        subject="🎵 Your MusicFlow Reset Code",
                        message=f"Your code is for reset password : {otp_str}\nValid for 2 minutes only.",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                        html_message=html_message,
                    )

                    print(f"[EMAIL DEBUG] Sent {sent_count} emails successfully!")
                    logger.info(f"OTP sent successfully to {user.email}")

                    request.session['reset_user_id'] = user.pk
                    messages.success(request, 'Reset code sent! Check your email.')
                    return redirect('player:reset_sent')

                except Exception as e:
                    print(f"[EMAIL ERROR] Failed: {str(e)}")
                    logger.error(f"Email failed for {user.email}: {str(e)}")
                    messages.error(request, f'Email send failed: {str(e)}')
                    cache.delete(f'reset_code_{user.pk}')

            except User.DoesNotExist:
                messages.error(request, 'No account found with this email. Please sign up.')
        else:
            logger.debug(f'Reset form errors: {form.errors}')
            messages.error(request, 'Please correct the errors below.')
    else:
        form = PasswordResetForm()

    return render(request, 'player/reset.html', {'form': form})


def reset_sent(request):
    user_pk = request.session.get('reset_user_id')
    if not user_pk:
        messages.error(request, 'Session expired. Please start over.')
        return redirect('player:reset')
    return render(request, 'player/reset_sent.html')


def reset_confirm(request):
    user_pk = request.session.get('reset_user_id')
    if not user_pk:
        messages.error(request, 'Session expired. Please start over.')
        return redirect('player:reset')

    user = get_object_or_404(User, pk=user_pk)
    code_key = f'reset_code_{user.pk}'

    hashed_otp = cache.get(code_key)
    if not hashed_otp:
        logger.warning(f"Expired/invalid code attempt for user {user.pk} - redirecting")
        messages.error(request, 'Verification code expired or invalid. Please request a new one.')
        cache.delete(code_key)
        if 'reset_user_id' in request.session:
            del request.session['reset_user_id']
        return redirect('player:reset')

    if request.method == 'POST':
        form = PasswordResetConfirmForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            if check_password(code, hashed_otp):
                user.set_password(form.cleaned_data['password'])
                user.save()
                cache.delete(code_key)
                if 'reset_user_id' in request.session:
                    del request.session['reset_user_id']
                logger.info(f"Password reset successful for user {user.pk}")
                messages.success(request, 'Password reset successful! You can now log in.')
                return redirect('player:login')
            else:
                messages.error(request, 'Invalid code. Please request a new one.')
                cache.delete(code_key)
                logger.warning(f"Invalid code attempt for user {user.pk}")
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = PasswordResetConfirmForm()

    return render(request, 'player/reset_confirm.html', {
        'form': form,
        'user_display': user.username,
    })


def success(request):
    if request.user.is_authenticated:
        return redirect('player:guitar_index')
    return render(request, 'player/success.html')


def logout(request):
    """
    Clean logout that clears session and redirects to login with a success message.
    """
    username = request.user.username if request.user.is_authenticated else 'Anonymous'
    logger.info(f'User {username} logging out')

    auth_logout(request)

    # Ensure profile_picture_url removed so stale data isn't left in session
    try:
        if 'profile_picture_url' in request.session:
            del request.session['profile_picture_url']
    except Exception:
        pass

    request.session.flush()
    messages.success(request, 'You have been logged out successfully.')
    return redirect('player:login')


@login_required
@csrf_exempt
def save_dashboard(request):
    if request.method == "POST":
        dashboard, _ = Dashboard.objects.get_or_create(user=request.user)

        dashboard.last_opened_page = request.POST.get("last_opened_page", dashboard.last_opened_page)

        completed = request.POST.get("completed_lessons")
        if completed:
            dashboard.completed_lessons = completed.split(",")

        dashboard.notes = request.POST.get("notes", dashboard.notes)
        dashboard.selected_guitar_type = request.POST.get("selected_guitar_type", dashboard.selected_guitar_type)
        dashboard.page_theme = request.POST.get("page_theme", dashboard.page_theme)

        dashboard.save()
        return JsonResponse({"success": True, "message": "Dashboard saved successfully!"})

    return JsonResponse({"success": False, "message": "Invalid request"})

