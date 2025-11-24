from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'level', 'instrument', 'last_modified')
    search_fields = ('user__username', 'user__email', 'first_name', 'last_name')
    list_filter = ('level', 'instrument', 'genre')
    readonly_fields = ('last_modified',)

