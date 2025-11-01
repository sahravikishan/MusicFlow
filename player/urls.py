from django.urls import path
from . import views

app_name = 'player'

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('reset/', views.reset, name='reset'),
    path('privacy/', views.privacy, name='privacy'),
    path('terms_condition/', views.terms_condition, name='terms_condition'),
    path('reset/verify/', views.reset_verify, name='reset_verify'),
    path('success/', views.success, name='success'),
    path('logout/', views.logout, name='logout'),
    path('reset_trigger/<token>/', views.reset_trigger, name='reset_trigger'),  # Added
    path('resend_reset_code/', views.resend_reset_code, name='resend_reset_code'), # Added

]

