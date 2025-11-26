from django.contrib import admin
from django.urls import path, include
from player import views  # for direct access to index view
from django.conf import settings  # Add this for DEBUG/static
from django.conf.urls.static import static  # Add this for media/static serving

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),  # Added: Serves the root '/' path with player index view
    path('player/', include('player.urls', namespace='player')),
]

# CRITICAL: Serve static & media files in development ONLY (DEBUG=True)
# This MUST be at the END, after all includes – order matters for /media/ to work!
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

