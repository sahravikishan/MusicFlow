from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    genre = models.CharField(max_length=50, blank=True)
    instrument = models.CharField(max_length=50, blank=True)
    level = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    last_modified = models.DateTimeField(auto_now=True, blank=True)  # Updates on every save

    def __str__(self):
        return f'{self.user.username} Profile'


class Dashboard(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard')

    last_opened_page = models.CharField(max_length=200, blank=True)
    completed_lessons = models.JSONField(default=list, blank=True)   # list of lesson IDs/names
    notes = models.TextField(blank=True)
    selected_guitar_type = models.CharField(max_length=50, blank=True)
    page_theme = models.CharField(max_length=20, blank=True)  # light / dark etc.

    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Dashboard"

@receiver(post_save, sender=User)
def create_user_dashboard(sender, instance, created, **kwargs):
    if created:
        Dashboard.objects.create(user=instance)


# Signal to automatically create Profile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


