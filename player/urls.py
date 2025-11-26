from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

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
    # Guitar dashboard
    path('guitar/', views.guitar_index, name='guitar_index'),
    # Dedicated guitar type pages (no temps/duplicates)
    path('guitar/acoustic/', views.guitar_acoustic, name='guitar_acoustic'),
    path('guitar/electric/', views.guitar_electric, name='guitar_electric'),
    path('guitar/classical/', views.guitar_classical, name='guitar_classical'),
    path('guitar/bass/', views.guitar_bass, name='guitar_bass'),
    # New profile update URL
    path('profile/update/', views.profile_update, name='profile_update'),
    path('guitar/feature-info/', views.guitar_feature_info, name='guitar_feature_info'),
    path("save-dashboard/", views.save_dashboard, name="save_dashboard"),
]

