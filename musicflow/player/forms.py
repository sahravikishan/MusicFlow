from django import forms
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.contrib.auth.password_validation import validate_password
import re


class LoginForm(forms.Form):
    login_input = forms.CharField(
        label='Username or Email',
        max_length=254,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter your username or email',
            'required': 'required'
        })
    )
    password = forms.CharField(
        label='Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter your password',
            'required': 'required'
        })
    )
    remember_me = forms.BooleanField(
        label='Remember me',
        required=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    def clean_login_input(self):
        login_input = self.cleaned_data['login_input'].strip()
        return login_input


class SignupForm(forms.Form):
    username = forms.CharField(
        label='Username',
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Choose a username'
        })
    )
    email = forms.EmailField(
        label='Email',
        max_length=254,
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter your email address'
        })
    )
    password = forms.CharField(
        label='Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter a strong password'
        })
    )
    password_confirm = forms.CharField(
        label='Confirm Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Confirm your password'
        })
    )
    terms_accepted = forms.BooleanField(
        label='I accept the Terms and Conditions',
        required=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        error_messages={'required': 'You must accept the terms and conditions to register.'}
    )

    def clean_username(self):
        username = self.cleaned_data['username'].strip()
        if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
            raise forms.ValidationError(
                'Username must be 3–30 characters and contain only letters, numbers, or underscores.'
            )
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError('Username already taken.')
        return username

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Email already registered.')
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError('Passwords do not match.')

        if password:
            try:
                validate_password(password)
            except forms.ValidationError as e:
                self.add_error('password', e)

        return cleaned_data


class PasswordResetForm(forms.Form):
    email = forms.EmailField(
        label='Email',
        max_length=254,
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter your registered email'
        })
    )


class PasswordResetConfirmForm(forms.Form):
    code = forms.CharField(
        label='Verification Code',
        max_length=6,
        min_length=6,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter 6-digit code'
        })
    )
    password = forms.CharField(
        label='New Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter new password'
        })
    )
    password_confirm = forms.CharField(
        label='Confirm New Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Confirm new password'
        })
    )

    def clean_code(self):
        code = self.cleaned_data['code']
        if not code.isdigit() or len(code) != 6:
            raise forms.ValidationError('Code must be a 6-digit number.')
        return code

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError('Passwords do not match.')

        if password:
            try:
                validate_password(password)
            except forms.ValidationError as e:
                self.add_error('password', e)

        return cleaned_data

