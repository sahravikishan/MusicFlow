from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .forms import LoginForm, SignupForm, PasswordResetForm, PasswordResetConfirmForm
from .models import PasswordResetCode
from django.http import HttpResponseRedirect
import time
import random
import string
import qrcode
from io import BytesIO
import base64
from django.utils import timezone
import datetime

LOGIN_ATTEMPTS = {}
RATE_LIMIT_SECONDS = 60
MAX_ATTEMPTS = 10


def check_rate_limit(request):
    ip = request.META.get('REMOTE_ADDR')
    current_time = time.time()
    if ip in LOGIN_ATTEMPTS:
        attempts, last_attempt = LOGIN_ATTEMPTS[ip]
        if current_time - last_attempt < RATE_LIMIT_SECONDS and attempts >= MAX_ATTEMPTS:
            return False
        if current_time - last_attempt >= RATE_LIMIT_SECONDS:
            LOGIN_ATTEMPTS[ip] = [0, current_time]
    else:
        LOGIN_ATTEMPTS[ip] = [0, current_time]
    LOGIN_ATTEMPTS[ip][0] += 1
    return True


def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


def generate_qr_code(code):
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return qr_image


def index(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'player/index.html')


def login(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        if not check_rate_limit(request):
            messages.error(request, 'Too many login attempts. Please try again later.')
            return render(request, 'player/login.html')

        form = LoginForm(request.POST)
        if form.is_valid():
            login_input = form.cleaned_data['login_input']
            password = form.cleaned_data['password']
            remember_me = form.cleaned_data['remember_me']

            try:
                user_obj = User.objects.get(email=login_input)
                username = user_obj.username
            except User.DoesNotExist:
                username = login_input

            user = authenticate(request, username=username, password=password)
            if user is not None:
                if user.is_active:
                    auth_login(request, user)
                    request.session.set_expiry(settings.SESSION_COOKIE_AGE if remember_me else 0)
                    next_url = request.POST.get('next') or request.GET.get('next', 'index')
                    if not next_url or '//' in next_url or ' ' in next_url:
                        next_url = 'index'
                    return redirect(next_url)
                else:
                    messages.error(request, 'Your account is disabled. Please contact support.')
            else:
                messages.error(request, 'Invalid username/email or password.')
        else:
            messages.error(request, 'Please correct the errors below.')

        return render(request, 'player/login.html', {'form': form})
    else:
        form = LoginForm()
    return render(request, 'player/login.html', {'form': form})


def signup(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        if not check_rate_limit(request):
            messages.error(request, 'Too many signup attempts. Please try again later.')
            return render(request, 'player/signup.html')

        form = SignupForm(request.POST)
        if form.is_valid():
            try:
                user = User.objects.create_user(
                    username=form.cleaned_data['username'],
                    email=form.cleaned_data['email'],
                    password=form.cleaned_data['password']
                )
                user.save()
                auth_login(request, user)
                messages.success(request, 'Account created successfully! Welcome!')
                return redirect('index')
            except Exception as e:
                messages.error(request, f'An error occurred during registration: {str(e)}')
        return render(request, 'player/signup.html', {'form': form})
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
                verification_code = generate_verification_code()
                PasswordResetCode.objects.create(user=user, code=verification_code)
                qr_image = generate_qr_code(verification_code)
                send_mail(
                    subject='MusicFlow Password Reset Code',
                    message=f'Your 6-digit verification code is: {verification_code}\nThis code is valid for 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                messages.success(request, 'A 6-digit verification code has been sent to your email.')
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                return render(request, 'player/reset.html', {
                    'form': form,
                    'qr_image': qr_image,
                    'show_qr': True,
                    'uidb64': uid
                })
            except User.DoesNotExist:
                messages.error(request, 'No account found with this email.')
            except Exception as e:
                messages.error(request, f'Failed to send email: {str(e)}')
        return render(request, 'player/reset.html', {'form': form})
    else:
        form = PasswordResetForm()
    return render(request, 'player/reset.html', {'form': form})


def reset_verify(request, uidb64):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
        messages.error(request, 'Invalid reset link.')
        return redirect('reset')

    if request.method == 'POST':
        form = PasswordResetConfirmForm(request.POST)
        if form.is_valid():
            try:
                reset_code = PasswordResetCode.objects.get(user=user, code=form.cleaned_data['code'])
                if reset_code.is_valid():
                    user.set_password(form.cleaned_data['password'])
                    user.save()
                    reset_code.delete()
                    messages.success(request, 'Password reset successfully. You can now log in.')
                    return redirect('login')
                else:
                    messages.error(request, 'Verification code has expired.')
                    reset_code.delete()
                    return redirect('reset')
            except PasswordResetCode.DoesNotExist:
                messages.error(request, 'Invalid verification code.')
                return render(request, 'player/reset_verify.html', {'form': form, 'uidb64': uidb64})
        return render(request, 'player/reset_verify.html', {'form': form, 'uidb64': uidb64})
    else:
        form = PasswordResetConfirmForm()
    return render(request, 'player/reset_verify.html', {'form': form, 'uidb64': uidb64})


def success(request):
    return render(request, 'player/success.html')


def logout(request):
    auth_logout(request)
    messages.success(request, 'Logged out successfully.')
    return redirect('login')

