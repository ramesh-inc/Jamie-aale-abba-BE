from django.urls import path, include
from core.template_views import (
    home_view, dashboard_view, teacher_dashboard, 
    parent_dashboard, admin_dashboard
)

app_name = 'core'

urlpatterns = [
    # Core app URLs - authentication is now handled by core.accounts app
    path('api/v1/newsfeed/', include('core.story_urls')),  # Original news feed / Stories API  
    path('api/v1/simple-newsfeed/', include('core.simple_story_urls')),  # New simple news feed API
    
    # Template views
    path('', home_view, name='home'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('teacher/dashboard/', teacher_dashboard, name='teacher_dashboard'),
    path('parent/dashboard/', parent_dashboard, name='parent_dashboard'),
    path('admin/dashboard/', admin_dashboard, name='admin_dashboard'),
]