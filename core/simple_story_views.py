from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
import logging

from core.simple_story_models import SimpleStory, SimpleStoryLike, SimpleStoryComment
from core.simple_story_serializers import (
    SimpleStoryListSerializer, SimpleStoryCreateSerializer,
    SimpleStoryCommentSerializer, SimpleStoryCommentCreateSerializer
)


class StoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class IsTeacherPermission(permissions.BasePermission):
    """Custom permission to only allow teachers"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'teacher' and
            hasattr(request.user, 'teacher_profile')
        )


class IsTeacherOrAdminPermission(permissions.BasePermission):
    """Custom permission to allow teachers and admins"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (
                (request.user.user_type == 'teacher' and hasattr(request.user, 'teacher_profile')) or
                (request.user.user_type == 'admin' and hasattr(request.user, 'admin_profile'))
            )
        )


class SimpleStoryViewSet(viewsets.ModelViewSet):
    """Simple ViewSet for managing stories"""
    permission_classes = [IsAuthenticated]
    pagination_class = StoryPagination
    
    def get_queryset(self):
        queryset = SimpleStory.objects.filter(is_active=True).select_related('teacher__user').order_by('-created_at')
        
        # Filter for "My Stories" if mine=true parameter is provided
        if self.request.GET.get('mine') == 'true':
            if self.request.user.user_type == 'teacher':
                # For teachers, filter by their teacher profile
                queryset = queryset.filter(teacher__user=self.request.user)
            elif self.request.user.user_type == 'admin':
                # For admins, filter by stories they created (using their virtual teacher profile)
                queryset = queryset.filter(teacher__user=self.request.user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SimpleStoryCreateSerializer
        return SimpleStoryListSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsTeacherOrAdminPermission()]
        elif self.action == 'destroy':
            return [IsTeacherOrAdminPermission()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Create a new story"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        story = serializer.save()
        
        # Return the story using list serializer
        response_serializer = SimpleStoryListSerializer(story, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a story - teachers can delete their own stories, admins can delete any story"""
        story = self.get_object()
        
        # Admins can delete any story, teachers can only delete their own
        if request.user.user_type == 'admin':
            # Admins can delete any story
            pass
        elif request.user.user_type == 'teacher':
            # Teachers can only delete their own stories
            if story.teacher.user != request.user:
                return Response(
                    {'error': 'You can only delete your own stories'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete associated attachments (which will trigger file cleanup via signal)
        try:
            attachments = story.attachments.all()
            for attachment in attachments:
                # This will trigger the post_delete signal to clean up files
                attachment.delete()
        except Exception as e:
            logging.error(f"Error deleting attachments for story {story.id}: {str(e)}")
        
        # Soft delete - mark as inactive instead of actually deleting
        story.is_active = False
        story.save()
        
        return Response(
            {'message': 'Story deleted successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like or unlike a story"""
        story = get_object_or_404(SimpleStory, pk=pk, is_active=True)
        
        like, created = SimpleStoryLike.objects.get_or_create(
            story=story,
            user=request.user
        )
        
        if not created:
            like.delete()
            return Response({
                'message': 'Story unliked',
                'liked': False,
                'likes_count': story.likes.count()
            })
        else:
            return Response({
                'message': 'Story liked',
                'liked': True,
                'likes_count': story.likes.count()
            })
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a story"""
        story = get_object_or_404(SimpleStory, pk=pk, is_active=True)
        comments = story.comments.filter(is_deleted=False).order_by('-created_at')
        serializer = SimpleStoryCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a story"""
        story = get_object_or_404(SimpleStory, pk=pk, is_active=True)
        
        serializer = SimpleStoryCommentCreateSerializer(
            data=request.data,
            context={'request': request, 'story': story}
        )
        
        if serializer.is_valid():
            comment = serializer.save()
            response_serializer = SimpleStoryCommentSerializer(comment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='comments/(?P<comment_id>[^/.]+)/delete')
    def delete_comment(self, request, comment_id=None):
        """Delete a comment - admins can delete any comment, users can delete their own"""
        try:
            comment = SimpleStoryComment.objects.get(id=comment_id, is_deleted=False)
        except SimpleStoryComment.DoesNotExist:
            return Response(
                {'error': 'Comment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if request.user.user_type == 'admin' and hasattr(request.user, 'admin_profile'):
            # Admins can delete any comment
            pass
        elif comment.user == request.user:
            # Users can delete their own comments
            pass
        else:
            return Response(
                {'error': 'You can only delete your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Soft delete - mark as deleted instead of actually deleting
        comment.is_deleted = True
        comment.save()
        
        return Response(
            {'message': 'Comment deleted successfully'},
            status=status.HTTP_200_OK
        )