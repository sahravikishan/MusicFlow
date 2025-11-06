from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.db import transaction, IntegrityError
from .forms import LoginForm, SignupForm, PasswordResetForm, PasswordResetConfirmForm
from django.http import JsonResponse
import logging
import random
from django.core.cache import cache
from django.contrib.auth.hashers import make_password, check_password

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Cache-based rate limiting
RATE_LIMIT_SECONDS = 60
MAX_ATTEMPTS = 10
RESET_TIMEOUT_SECONDS = 120   # 2 minutes


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

def login(request):
    if request.method == 'POST':
        logger.debug(f'POST data: {request.POST}')
        if not check_rate_limit(request):
            messages.error(request, 'Too many login attempts. Please try again later.')
            logger.error('Rate limit exceeded')
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
                    request.session.set_expiry(settings.SESSION_COOKIE_AGE if remember_me else 0)
                    logger.info(f'User {username} logged in successfully, redirecting to success')
                    messages.success(request, 'Welcome back! You have signed in successfully.')
                    return redirect('player:success')
                else:
                    messages.error(request, 'Your account is disabled. Please contact support.')
                    logger.warning(f'Account disabled for user: {username}')
            else:
                messages.error(request, 'Invalid username/email or password.')
                logger.warning(f'Authentication failed for username_input: {username_input}')
        else:
            messages.error(request, 'Please correct the errors below.')
            logger.debug(f'Login form errors: {form.errors}')
        return render(request, 'player/login.html', {'form': form})
    else:
        form = LoginForm()
    return render(request, 'player/login.html', {'form': form})

def privacy(request):
    return render(request, 'player/privacy.html')

def terms_condition(request):
    return render(request, 'player/terms_condition.html')

def signup(request):
    if request.method == 'POST':
        logger.debug(f'POST data: {request.POST}')
        if not check_rate_limit(request):
            error_msg = 'Too many signup attempts. Please try again later.'
            logger.error(error_msg)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': error_msg})
            messages.error(request, error_msg)
            return render(request, 'player/signup.html')

        form = SignupForm(request.POST)
        logger.debug(f'Form valid: {form.is_valid()}')
        if form.is_valid():
            raw_terms = request.POST.get('accept_terms')
            raw_privacy = request.POST.get('accept_privacy')
            logger.debug(f'Raw accept_terms={raw_terms!r}, accept_privacy={raw_privacy!r}')

            if not (form.cleaned_data.get('accept_terms') and form.cleaned_data.get('accept_privacy')):
                error_msg = 'You must accept both Terms & Conditions and Privacy Policy.'
                logger.warning('Signup blocked: terms/privacy not accepted')
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
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
                logger.debug(f'User created: {user.username}')
                auth_login(request, user)
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': True, 'message': 'Account created successfully!'})
                messages.success(request, 'Account created successfully! Welcome!')
                return redirect('player:success')
            except Exception as e:
                error_msg = f'An error occurred during registration: {str(e)}'
                logger.error(error_msg)
                messages.error(request, error_msg)
                return render(request, 'player/signup.html', {'form': form})
        else:
            logger.debug(f'Signup form errors: {form.errors}')
            messages.error(request, 'Please correct the errors below.')
    else:
        form = SignupForm()
    return render(request, 'player/signup.html', {'form': form})

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
                # Generate 6-digit OTP
                otp = random.randint(100000, 999999)
                otp_str = str(otp)
                otp_hashed = make_password(otp_str)
                cache.set(f'reset_code_{user.pk}', otp_hashed, timeout=RESET_TIMEOUT_SECONDS)

                logger.info(f"Generated OTP: {otp_str} for {user.email}")

                # Send email with enhanced HTML design
                try:
                    logo_url = request.build_absolute_uri('/static/images/favicon.jpg')
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

                    print(f"[EMAIL DEBUG] Sending OTP {otp_str} to {user.email} using backend: {settings.EMAIL_BACKEND}")
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

                    # Store user in session for next steps
                    request.session['reset_user_id'] = user.pk
                    messages.success(request, 'Reset code sent! Check your email.')
                    return redirect('player:reset_sent')

                except Exception as e:
                    print(f"[EMAIL ERROR] Failed: {str(e)}")
                    logger.error(f"Email failed for {user.email}: {str(e)}")
                    messages.error(request, f'Email send failed: {str(e)}')
                    cache.delete(f'reset_code_{user.pk}')  # Clean up cache on failure

            except User.DoesNotExist:
                messages.error(request, 'No account found with this email. Please sign up.')
        else:
            logger.debug(f'Reset form errors: {form.errors}')
            messages.error(request, 'Please correct the errors below.')
    else:
        form = PasswordResetForm()

    return render(request, 'player/reset.html', {'form': form})



def reset_sent(request):
    # Simple page to show email sent message
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

    # SECURITY FIX: Block access if no valid code in cache (expired or invalid)
    hashed_otp = cache.get(code_key)
    if not hashed_otp:
        logger.warning(f"Expired/invalid code attempt for user {user.pk} - redirecting")
        messages.error(request, 'Verification code expired or invalid. Please request a new one.')
        cache.delete(code_key)  # Ensure cleanup
        del request.session['reset_user_id']  # Clear stale session
        return redirect('player:reset')

    if request.method == 'POST':
        form = PasswordResetConfirmForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            if check_password(code, hashed_otp):
                user.set_password(form.cleaned_data['password'])
                user.save()
                cache.delete(code_key)
                del request.session['reset_user_id']  # Clear session
                logger.info(f"Password reset successful for user {user.pk}")
                messages.success(request, 'Password reset successful! You can now log in.')
                return redirect('player:login')
            else:
                messages.error(request, 'Invalid code. Please request a new one.')
                cache.delete(code_key)  # Invalidate on wrong guess
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
    return render(request, 'player/success.html')


def logout(request):
    auth_logout(request)
    messages.success(request, 'Logged out successfully.')
    return redirect('player:login')

