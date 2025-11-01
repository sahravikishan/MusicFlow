from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('reset/', views.reset, name='reset'),
    path('reset_verify/<uidb64>/<token>/', views.reset_verify, name='reset_verify'),
    path('success', views.success, name='success'),
    path('signup/success.html', views.success, name='signup_success'),
    path('logout', views.logout, name='logout'),
    path('signup/login.html', views.login, name='signup_login'),
    path('login/success.html', views.success, name="login_success"),
    path('login/login.html', views.login, name='login_login'),
    path('reset/reset_verify.html', views.reset, name='reset_reset_verify')

]
