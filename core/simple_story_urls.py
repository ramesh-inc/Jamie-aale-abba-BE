from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.simple_story_views import SimpleStoryViewSet

router = DefaultRouter()
router.register(r'stories', SimpleStoryViewSet, basename='simple-stories')

urlpatterns = router.urls