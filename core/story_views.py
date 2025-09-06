from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from core.models import Story, StoryLike, StoryComment, Teacher, Class
from core.story_serializers import (
    StoryListSerializer, StoryDetailSerializer, StoryCreateSerializer,
    StoryUpdateSerializer, CommentCreateSerializer, CommentUpdateSerializer,
    StoryCommentSerializer, SimpleStoryResponseSerializer
)


class IsTeacherPermission(permissions.BasePermission):
    """
    Custom permission to only allow teachers to create and modify stories.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'teacher' and
            hasattr(request.user, 'teacher_profile')
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow teachers to edit their own stories.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the story
        return obj.teacher.user == request.user


class StoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing stories (news feed posts).
    
    - List: Get all stories the user has permission to view
    - Create: Teachers can create new stories
    - Retrieve: Get detailed view of a specific story
    - Update: Teachers can update their own stories
    - Destroy: Teachers can delete their own stories
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'teacher':
            # Teachers can see all stories from their assigned classes or their own stories
            teacher = user.teacher_profile
            assigned_class_ids = teacher.class_assignments.filter(
                is_active=True,
                class_obj__is_active=True
            ).values_list('class_obj__id', flat=True)
            
            return Story.objects.filter(
                Q(target_classes__in=assigned_class_ids) | 
                Q(teacher=teacher) |
                Q(target_classes=None),  # Stories with no specific target classes
                is_active=True
            ).distinct().order_by('-created_at')
            
        elif user.user_type == 'parent':
            # Parents can see stories from their children's classes
            # This would require additional logic to get parent's children and their classes
            # For now, return empty queryset - implement based on your parent-child relationship
            return Story.objects.none()
            
        else:
            # Admins can see all stories
            return Story.objects.filter(is_active=True).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StoryCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StoryUpdateSerializer
        elif self.action == 'retrieve':
            return StoryDetailSerializer
        else:
            return StoryListSerializer
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'create':
            permission_classes = [IsTeacherPermission]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsTeacherPermission, IsOwnerOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """
        Create a new story and return it with simple serialization to avoid RelatedManager issues.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        story = serializer.save()
        
        # Use simple response serializer to completely avoid RelatedManager issues
        response_serializer = SimpleStoryResponseSerializer(story)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_update(self, serializer):
        """
        Update a story (only if user is the owner).
        """
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Soft delete a story by setting is_active to False.
        """
        instance.is_active = False
        instance.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like or unlike a story.
        """
        story = get_object_or_404(Story, pk=pk, is_active=True)
        user = request.user
        
        # Check if user has permission to view this story
        if not self.get_queryset().filter(pk=pk).exists():
            return Response(
                {'error': 'You do not have permission to like this story.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        like, created = StoryLike.objects.get_or_create(
            story=story,
            user=user
        )
        
        if not created:
            # Unlike if already liked
            like.delete()
            return Response({
                'message': 'Story unliked successfully.',
                'liked': False,
                'likes_count': story.likes.count()
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Story liked successfully.',
                'liked': True,
                'likes_count': story.likes.count()
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        """
        Get all comments for a story.
        """
        story = get_object_or_404(Story, pk=pk, is_active=True)
        
        # Check if user has permission to view this story
        if not self.get_queryset().filter(pk=pk).exists():
            return Response(
                {'error': 'You do not have permission to view comments on this story.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get top-level comments (parent_comment=None)
        comments = story.comments.filter(
            parent_comment=None,
            is_deleted=False
        ).order_by('-created_at')
        
        serializer = StoryCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """
        Add a comment to a story.
        """
        story = get_object_or_404(Story, pk=pk, is_active=True)
        
        # Check if user has permission to view this story
        if not self.get_queryset().filter(pk=pk).exists():
            return Response(
                {'error': 'You do not have permission to comment on this story.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CommentCreateSerializer(
            data=request.data, 
            context={'request': request, 'story': story}
        )
        
        if serializer.is_valid():
            comment = serializer.save()
            response_serializer = StoryCommentSerializer(comment, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoryCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing story comments.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StoryCommentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Users can only see comments on stories they have access to
        if user.user_type == 'teacher':
            teacher = user.teacher_profile
            assigned_class_ids = teacher.class_assignments.filter(
                is_active=True,
                class_obj__is_active=True
            ).values_list('class_obj__id', flat=True)
            
            return StoryComment.objects.filter(
                Q(story__target_classes__in=assigned_class_ids) | 
                Q(story__teacher=teacher) |
                Q(story__target_classes=None),
                story__is_active=True,
                is_deleted=False
            ).distinct()
            
        elif user.user_type == 'parent':
            # Parents can see comments on stories from their children's classes
            # For now, return empty queryset - implement based on your parent-child relationship
            return StoryComment.objects.none()
            
        else:
            # Admins can see all comments
            return StoryComment.objects.filter(
                story__is_active=True,
                is_deleted=False
            )
    
    def get_permissions(self):
        """
        Set different permissions based on the action.
        """
        if self.action in ['update', 'partial_update']:
            # Only comment author can edit their own comments
            permission_classes = [IsAuthenticated, IsCommentOwner]
        elif self.action == 'destroy':
            # Only comment author can delete their own comments
            permission_classes = [IsAuthenticated, IsCommentOwner]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return CommentUpdateSerializer
        return StoryCommentSerializer
    
    def perform_update(self, serializer):
        """
        Update a comment (only by the author).
        """
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Soft delete a comment by setting is_deleted to True.
        """
        instance.is_deleted = True
        instance.save()


class IsCommentOwner(permissions.BasePermission):
    """
    Custom permission to only allow comment authors to edit their own comments.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


# Additional view for getting teacher's own stories
class TeacherStoriesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for teachers to view their own stories.
    """
    permission_classes = [IsTeacherPermission]
    serializer_class = StoryListSerializer
    
    def get_queryset(self):
        teacher = self.request.user.teacher_profile
        return Story.objects.filter(
            teacher=teacher,
            is_active=True
        ).order_by('-created_at')


# View for getting classes assigned to a teacher
class TeacherClassesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for teachers to view their assigned classes.
    """
    permission_classes = [IsTeacherPermission]
    
    def get_queryset(self):
        teacher = self.request.user.teacher_profile
        return Class.objects.filter(
            teacher_assignments__teacher=teacher,
            teacher_assignments__is_active=True,
            is_active=True
        ).distinct()
    
    def list(self, request, *args, **kwargs):
        classes = self.get_queryset()
        data = [
            {
                'id': cls.id,
                'class_name': cls.class_name,
                'class_code': cls.class_code,
                'age_group': cls.age_group,
                'capacity': cls.capacity,
                'room_number': cls.room_number,
                'academic_year': cls.academic_year
            }
            for cls in classes
        ]
        return Response(data)