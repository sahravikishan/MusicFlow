from django.contrib import admin
from django.urls import path, include
from player import views  # for direct access to index view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),  # Added: Serves the root '/' path with player index view
    path('player/', include('player.urls', namespace='player')),

]

