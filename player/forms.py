from django import forms
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import re

class LoginForm(forms.Form):
    username = forms.CharField(
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

class SignupForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Username',
            'required': True
        })
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email Address',
            'required': True
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Password',
            'required': True,
            'autocomplete': 'new-password'
        })
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Confirm Password',
            'required': True,
            'autocomplete': 'new-password'
        })
    )
    accept_terms = forms.BooleanField(
        required=True,
        label='',
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
            'id': 'accept_terms'
        })
    )
    accept_privacy = forms.BooleanField(
        required=True,
        label='',
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
            'id': 'accept_privacy'
        })
    )

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError('A user with this username already exists.')
        return username

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError('A user with this email already exists.')
        return email

    def clean_accept_terms(self):
        val = self.cleaned_data.get('accept_terms')
        if not val:
            raise ValidationError('You must accept the Terms & Conditions.')
        return val

    def clean_accept_privacy(self):
        val = self.cleaned_data.get('accept_privacy')
        if not val:
            raise ValidationError('You must accept the Privacy Policy.')
        return val

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError('Passwords do not match.')

        accept_terms = cleaned_data.get('accept_terms')
        accept_privacy = cleaned_data.get('accept_privacy')

        if not accept_terms:
            self.add_error('accept_terms', 'You must accept the Terms & Conditions.')
        if not accept_privacy:
            self.add_error('accept_privacy', 'You must accept the Privacy Policy.')

        if self.errors:
            raise forms.ValidationError('Please correct the errors below.')

        return cleaned_data

class PasswordResetForm(forms.Form):
    email = forms.EmailField(
        label='Email',
        max_length=254,
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter your registered email',
            'id': 'resetUserId'
        })
    )

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if not User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('No account found with this email.')
        return email

class PasswordResetConfirmForm(forms.Form):
    code = forms.CharField(
        label='Verification Code',
        max_length=6,
        required=True,
        validators=[RegexValidator(r'^\d{6}$', 'Must be a 6-digit code.')],
        widget=forms.TextInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter code sent on your mail',
            'id': 'id_code',
            'autocomplete': 'off'
        })
    )
    password = forms.CharField(
        label='New Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Enter new password',
            'id': 'id_password',
            'minlength': '6',
            'autocomplete': 'new-password'
        })
    )
    password_confirm = forms.CharField(
        label='Confirm New Password',
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control elegant-input',
            'placeholder': 'Confirm new password',
            'id': 'id_password_confirm',
            'autocomplete': 'new-password'
        })
    )

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError('Passwords do not match.')

        return cleaned_data

