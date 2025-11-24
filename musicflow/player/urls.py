from django.urls import path
from . import views

app_name = 'player'

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('reset/', views.reset, name='reset'),
    path('reset-sent/', views.reset_sent, name='reset_sent'),
    path('reset-confirm/', views.reset_confirm, name='reset_confirm'),
    path('privacy/', views.privacy, name='privacy'),
    path('terms_condition/', views.terms_condition, name='terms_condition'),
    path('success/', views.success, name='success'),
    path('logout/', views.logout, name='logout'),

]
