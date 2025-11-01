from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.urls import reverse
from django.db import transaction
from .forms import LoginForm, SignupForm, PasswordResetForm, PasswordResetConfirmForm
from django.http import JsonResponse
import logging
import random
import qrcode
from io import BytesIO
import base64
from django.core.cache import cache
import uuid
import socket

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Cache-based rate limiting
RATE_LIMIT_SECONDS = 60
MAX_ATTEMPTS = 10
QR_TIMEOUT_SECONDS = 120   # 2 minutes
OTP_TIMEOUT_SECONDS = 120  # 2 minutes
OTP_ATTEMPTS_LIMIT = 5


def check_rate_limit(request):
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    cache_key = f'rate_limit_{ip}'
    attempts = cache.get(cache_key, 0)
    if attempts >= MAX_ATTEMPTS:
        return False
    cache.set(cache_key, attempts + 1, timeout=RATE_LIMIT_SECONDS)
    return True


def get_reset_url(request, path):
    # Automatically detect your LAN IP
    ip = socket.gethostbyname(socket.gethostname())
    return f"http://{ip}:8000{path}"



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
                logger.error(error_msg, exc_info=True)
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': error_msg, 'form_errors': form.errors.as_json()})
                messages.error(request, error_msg)
                return render(request, 'player/signup.html', {'form': form})
        else:
            logger.debug(f'Signup form errors: {form.errors}')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Please correct the errors below.',
                                     'form_errors': form.errors.as_json()})
            messages.error(request, 'Please correct the errors below.')
            return render(request, 'player/signup.html', {'form': form})
    else:
        form = SignupForm()
    return render(request, 'player/signup.html', {'form': form})


def reset(request):
    """User enters email → get QR (valid 2 mins)."""
    if request.method == 'POST':
        if not check_rate_limit(request):
            messages.error(request, 'Too many attempts. Please try again later.')
            return render(request, 'player/reset.html', {'form': PasswordResetForm()})

        form = PasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email'].strip().lower()
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                messages.error(request, 'No account found with that email.')
                return render(request, 'player/reset.html', {'form': form})

            # Create a one-time QR token valid for 2 minutes
            token = str(uuid.uuid4())
            cache.set(f'reset_token_{token}', user.pk, timeout=QR_TIMEOUT_SECONDS)

            # Build URL for scanning
            trigger_path = reverse('player:reset_trigger', kwargs={'token': token})
            trigger_url = get_reset_url(request, trigger_path)

            # Generate QR code
            qr = qrcode.QRCode(version=1, box_size=6, border=4)
            qr.add_data(trigger_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            qr_base64 = base64.b64encode(buffer.getvalue()).decode()

            # Send email with QR
            email_obj = EmailMultiAlternatives(
                subject='Scan to Reset Password',
                body='Scan the QR code to get your reset code.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email_obj.attach_alternative(f"""
                <p>Scan this QR code to get your 6-digit verification code:</p>
                <center><img src="data:image/png;base64,{qr_base64}" width="200"></center>
                <p><small>QR valid for 2 minutes.</small></p>
            """, "text/html")
            email_obj.send()

            # Store in session
            request.session['reset_user_id'] = user.pk
            request.session['reset_token'] = token
            request.session['qr_base64'] = qr_base64
            request.session.modified = True

            messages.success(request, 'QR code sent! Scan it within 2 minutes.')
            return redirect('player:reset_verify')

    form = PasswordResetForm()
    return render(request, 'player/reset.html', {'form': form})


def reset_verify(request):
    """Page where user enters OTP + new password."""
    user_pk = request.session.get('reset_user_id')
    token = request.session.get('reset_token')
    qr_base64 = request.session.get('qr_base64')

    if not user_pk or not token or not qr_base64:
        messages.error(request, 'Session expired. Please restart reset process.')
        return redirect('player:reset')

    user = User.objects.get(pk=user_pk)
    code_key = f'reset_code_{user.pk}'
    otp_exists = cache.get(code_key) is not None

    show_qr = not otp_exists

    if request.method == 'POST':
        form = PasswordResetConfirmForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            hashed_otp = cache.get(code_key)

            if hashed_otp and check_password(code, hashed_otp):
                user.set_password(form.cleaned_data['password'])
                user.save()
                cache.delete(code_key)
                for k in ['reset_user_id', 'reset_token', 'qr_base64']:
                    request.session.pop(k, None)
                messages.success(request, 'Password reset successful! You can now log in.')
                return redirect('player:login')
            else:
                messages.error(request, 'Invalid or expired code. Please try again.')
        else:
            messages.error(request, 'Please correct the errors below.')

    else:
        form = PasswordResetConfirmForm()

    return render(request, 'player/reset_verify.html', {
        'form': form,
        'qr_base64': qr_base64 if show_qr else None,
        'user_display': user.username,
        'show_qr': show_qr,
        'code_ready': otp_exists,
    })



def reset_trigger(request, token):
    """Called when QR is scanned — sends a 6-digit OTP to user’s email."""
    user_pk = cache.get(f'reset_token_{token}')
    if not user_pk:
        return render(request, 'player/error.html', {'message': 'QR expired or invalid. Please generate a new one.'})

    user = User.objects.get(pk=user_pk)
    otp = f"{random.randint(100000, 999999)}"
    otp_hashed = make_password(otp)
    cache.set(f'reset_code_{user.pk}', otp_hashed, timeout=OTP_TIMEOUT_SECONDS)

    # Send OTP mail
    mail = EmailMultiAlternatives(
        subject="Your MusicFlow Reset Code",
        body=f"Your code is: {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )
    mail.attach_alternative(f"""
        <p>Your 6-digit code:</p>
        <h2><b>{otp}</b></h2>
        <p><small>Valid for 2 minutes only.</small></p>
    """, "text/html")
    mail.send()

    cache.delete(f'reset_token_{token}')
    return render(request, 'player/check_email.html', {'message': 'Please check your mail. A code has been sent!'})

def resend_reset_code(request):
    """Allows re-sending QR."""
    user_pk = request.session.get('reset_user_id')
    if not user_pk:
        messages.error(request, 'Session expired. Please restart.')
        return redirect('player:reset')

    user = User.objects.get(pk=user_pk)
    token = str(uuid.uuid4())
    cache.set(f'reset_token_{token}', user.pk, timeout=QR_TIMEOUT_SECONDS)
    trigger_path = reverse('player:reset_trigger', kwargs={'token': token})
    trigger_url = get_reset_url(request, trigger_path)

    qr = qrcode.QRCode(version=1, box_size=6, border=4)
    qr.add_data(trigger_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    email = EmailMultiAlternatives(
        subject='Scan to Reset Password (New QR)',
        body='Scan this QR to get your new reset code.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(
        f"<p>Scan this QR to receive a new code:</p>"
        f"<center><img src='data:image/png;base64,{qr_base64}' width='200'></center>"
        f"<p><small>Valid for 2 minutes.</small></p>",
        "text/html"
    )
    email.send()

    request.session['reset_token'] = token
    request.session['qr_base64'] = qr_base64
    request.session.modified = True

    messages.success(request, 'New QR sent! Check your mail.')
    return redirect('player:reset_verify')


def success(request):
    return render(request, 'player/success.html')

def logout(request):
    auth_logout(request)
    messages.success(request, 'Logged out successfully.')
    return redirect('player:login')

