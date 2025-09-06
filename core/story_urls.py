from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.story_views import (
    StoryViewSet, StoryCommentViewSet, TeacherStoriesViewSet, TeacherClassesViewSet
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'stories', StoryViewSet, basename='story')
router.register(r'comments', StoryCommentViewSet, basename='storycomment')
router.register(r'teacher/stories', TeacherStoriesViewSet, basename='teacher-stories')
router.register(r'teacher/classes', TeacherClassesViewSet, basename='teacher-classes')

urlpatterns = [
    # Include all the router URLs
    path('', include(router.urls)),
]

# Available endpoints:
# GET /stories/ - List all stories the user can view
# POST /stories/ - Create a new story (teachers only)
# GET /stories/{id}/ - Get detailed view of a specific story
# PUT /stories/{id}/ - Update a story (owner only)
# PATCH /stories/{id}/ - Partially update a story (owner only)
# DELETE /stories/{id}/ - Delete a story (owner only)
# POST /stories/{id}/like/ - Like/unlike a story
# GET /stories/{id}/comments/ - Get comments for a story
# POST /stories/{id}/add_comment/ - Add a comment to a story

# GET /comments/ - List all comments the user can view
# GET /comments/{id}/ - Get a specific comment
# PUT /comments/{id}/ - Update a comment (author only)
# PATCH /comments/{id}/ - Partially update a comment (author only)
# DELETE /comments/{id}/ - Delete a comment (author only)

# GET /teacher/stories/ - Get teacher's own stories
# GET /teacher/classes/ - Get teacher's assigned classes