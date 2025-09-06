from rest_framework import serializers
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.exceptions import ValidationError as DjangoValidationError
from django.conf import settings
from core.models import Story, StoryAttachment, StoryLike, StoryComment, Teacher, Class, User
import mimetypes
import os
import uuid


class StoryAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryAttachment
        fields = ['id', 'file_name', 'file_url', 'file_type', 'file_size', 'mime_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class StoryCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    replies = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = StoryComment
        fields = [
            'id', 'comment_text', 'user_name', 'user_type', 'parent_comment',
            'replies', 'can_edit', 'can_delete', 'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name()

    def get_replies(self, obj):
        if obj.parent_comment is None:
            replies = obj.replies.filter(is_deleted=False).order_by('created_at')
            return StoryCommentSerializer(replies, many=True, context=self.context).data
        return []

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user


class StoryLikeSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = StoryLike
        fields = ['id', 'user_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name()


class StoryListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    target_classes_names = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'title', 'content', 'story_type', 'teacher_name',
            'attachments', 'likes_count', 'comments_count', 'user_has_liked',
            'target_classes_names', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        try:
            return obj.teacher.user.get_full_name()
        except AttributeError:
            return "Unknown Teacher"

    def get_attachments(self, obj):
        try:
            return StoryAttachmentSerializer(obj.attachments.all(), many=True).data
        except AttributeError:
            return []

    def get_likes_count(self, obj):
        try:
            return obj.likes.count()
        except AttributeError:
            return 0

    def get_comments_count(self, obj):
        try:
            return obj.comments.filter(is_deleted=False).count()
        except AttributeError:
            return 0

    def get_user_has_liked(self, obj):
        try:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                return False
            return obj.likes.filter(user=request.user).exists()
        except AttributeError:
            return False

    def get_target_classes_names(self, obj):
        try:
            return [cls.class_name for cls in obj.target_classes.all()]
        except AttributeError:
            return []


class StoryDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    attachments = StoryAttachmentSerializer(many=True, read_only=True)
    likes = StoryLikeSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    target_classes_names = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'title', 'content', 'story_type', 'teacher_name',
            'attachments', 'likes', 'comments', 'likes_count', 'comments_count',
            'user_has_liked', 'target_classes_names', 'can_edit', 'can_delete',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name()

    def get_comments(self, obj):
        # Only return top-level comments (parent_comment=None)
        # Replies will be nested within each comment
        comments = obj.comments.filter(parent_comment=None, is_deleted=False).order_by('-created_at')
        return StoryCommentSerializer(comments, many=True, context=self.context).data

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_user_has_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()

    def get_target_classes_names(self, obj):
        try:
            return [cls.class_name for cls in obj.target_classes.all()]
        except AttributeError:
            return []

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.teacher.user == request.user

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.teacher.user == request.user


class StoryCreateSerializer(serializers.ModelSerializer):
    target_class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of class IDs that can view this story"
    )
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        help_text="List of files to attach (max 5)"
    )

    class Meta:
        model = Story
        fields = ['title', 'content', 'story_type', 'target_class_ids', 'attachments']
    
    def to_representation(self, instance):
        # Don't try to serialize the created instance - let the view handle it
        return {
            'id': instance.id,
            'title': instance.title,
            'content': instance.content,
            'story_type': instance.story_type,
            'created_at': instance.created_at.isoformat(),
        }

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required and cannot be empty.")
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Title cannot exceed 100 characters.")
        return value.strip()

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content is required and cannot be empty.")
        return value.strip()

    def validate_attachments(self, files):
        if not files:
            return files

        if len(files) > 5:
            raise serializers.ValidationError("Maximum 5 files can be attached.")

        for file in files:
            # Validate file size based on type
            if file.content_type.startswith('image/'):
                max_size = 3 * 1024 * 1024  # 3MB for images
                if file.size > max_size:
                    raise serializers.ValidationError(f"Image files must be smaller than 3MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")
            elif file.content_type.startswith('video/'):
                max_size = 20 * 1024 * 1024  # 20MB for videos
                if file.size > max_size:
                    raise serializers.ValidationError(f"Video files must be smaller than 20MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")
            else:
                max_size = 3 * 1024 * 1024  # 3MB for other files
                if file.size > max_size:
                    raise serializers.ValidationError(f"Document files must be smaller than 3MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")

            # Validate file type for documents
            allowed_doc_types = [
                'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'application/rtf'
            ]
            
            if not (file.content_type.startswith('image/') or 
                    file.content_type.startswith('video/') or 
                    file.content_type in allowed_doc_types):
                raise serializers.ValidationError(f"File type {file.content_type} is not allowed. Please upload images, videos, or common document formats.")

        return files

    def validate_target_class_ids(self, class_ids):
        if not class_ids:
            return class_ids

        # Validate that all class IDs exist
        existing_classes = Class.objects.filter(id__in=class_ids, is_active=True)
        existing_ids = list(existing_classes.values_list('id', flat=True))
        
        invalid_ids = set(class_ids) - set(existing_ids)
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid class IDs: {list(invalid_ids)}")

        return class_ids

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'teacher_profile'):
            raise serializers.ValidationError("Only teachers can create stories.")

        # Validate that teacher has access to specified classes
        if 'target_class_ids' in attrs and attrs['target_class_ids']:
            teacher = request.user.teacher_profile
            # Check if teacher is assigned to any of the specified classes
            assigned_class_ids = teacher.class_assignments.filter(
                is_active=True, 
                class_obj__id__in=attrs['target_class_ids'],
                class_obj__is_active=True
            ).values_list('class_obj__id', flat=True)
            
            if not assigned_class_ids:
                raise serializers.ValidationError("You can only create stories for classes you are assigned to.")

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        teacher = request.user.teacher_profile
        
        target_class_ids = validated_data.pop('target_class_ids', [])
        attachments = validated_data.pop('attachments', [])

        # Create the story
        story = Story.objects.create(
            teacher=teacher,
            **validated_data
        )

        # Add target classes (do this after story is saved to avoid RelatedManager issues)
        if target_class_ids:
            target_classes = Class.objects.filter(id__in=target_class_ids, is_active=True)
            for target_class in target_classes:
                story.target_classes.add(target_class)

        # Create attachments with proper file storage
        for file in attachments:
            # Determine file type
            if file.content_type.startswith('image/'):
                file_type = 'image'
            elif file.content_type.startswith('video/'):
                file_type = 'video'
            else:
                file_type = 'document'

            # Create media directory if it doesn't exist
            media_dir = os.path.join(settings.BASE_DIR, 'media', 'stories', str(story.id))
            os.makedirs(media_dir, exist_ok=True)
            
            # Generate unique filename to avoid conflicts
            file_extension = os.path.splitext(file.name)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            file_path = os.path.join(media_dir, unique_filename)
            
            # Save file to disk
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            # Create URL for file (relative to media root)
            file_url = f"/media/stories/{story.id}/{unique_filename}"

            StoryAttachment.objects.create(
                story=story,
                file_name=file.name,
                file_url=file_url,
                file_type=file_type,
                file_size=file.size,
                mime_type=file.content_type
            )

        # Refresh from database to get all related objects
        story.refresh_from_db()
        return story


class SimpleStoryResponseSerializer(serializers.Serializer):
    """
    Simple serializer for story creation response that avoids RelatedManager issues.
    """
    id = serializers.IntegerField()
    title = serializers.CharField()
    content = serializers.CharField()
    story_type = serializers.CharField()
    teacher_name = serializers.CharField()
    attachments_count = serializers.IntegerField()
    target_classes_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    
    def to_representation(self, instance):
        return {
            'id': instance.id,
            'title': instance.title,
            'content': instance.content,
            'story_type': instance.story_type,
            'teacher_name': instance.teacher.user.get_full_name(),
            'attachments_count': instance.attachments.count() if hasattr(instance, 'attachments') else 0,
            'target_classes_count': instance.target_classes.count() if hasattr(instance, 'target_classes') else 0,
            'likes_count': 0,
            'comments_count': 0,
            'user_has_liked': False,
            'target_classes_names': [],
            'attachments': [],
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }


class StoryUpdateSerializer(serializers.ModelSerializer):
    target_class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of class IDs that can view this story"
    )

    class Meta:
        model = Story
        fields = ['title', 'content', 'target_class_ids']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required and cannot be empty.")
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Title cannot exceed 100 characters.")
        return value.strip()

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content is required and cannot be empty.")
        return value.strip()

    def validate_target_class_ids(self, class_ids):
        if not class_ids:
            return class_ids

        # Validate that all class IDs exist
        existing_classes = Class.objects.filter(id__in=class_ids, is_active=True)
        existing_ids = list(existing_classes.values_list('id', flat=True))
        
        invalid_ids = set(class_ids) - set(existing_ids)
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid class IDs: {list(invalid_ids)}")

        return class_ids

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'teacher_profile'):
            raise serializers.ValidationError("Only teachers can update stories.")

        # Validate that teacher has access to specified classes
        if 'target_class_ids' in attrs and attrs['target_class_ids']:
            teacher = request.user.teacher_profile
            # Check if teacher is assigned to any of the specified classes
            assigned_class_ids = teacher.class_assignments.filter(
                is_active=True, 
                class_obj__id__in=attrs['target_class_ids'],
                class_obj__is_active=True
            ).values_list('class_obj__id', flat=True)
            
            if not assigned_class_ids:
                raise serializers.ValidationError("You can only update stories for classes you are assigned to.")

        return attrs

    def update(self, instance, validated_data):
        target_class_ids = validated_data.pop('target_class_ids', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update target classes if provided
        if target_class_ids is not None:
            if target_class_ids:
                target_classes = Class.objects.filter(id__in=target_class_ids, is_active=True)
                instance.target_classes.set(target_classes)
            else:
                instance.target_classes.clear()

        return instance


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryComment
        fields = ['comment_text', 'parent_comment']

    def validate_comment_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Comment text is required and cannot be empty.")
        return value.strip()

    def validate_parent_comment(self, value):
        if value and value.story != self.context['story']:
            raise serializers.ValidationError("Parent comment must belong to the same story.")
        return value

    def create(self, validated_data):
        validated_data['story'] = self.context['story']
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryComment
        fields = ['comment_text']

    def validate_comment_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Comment text is required and cannot be empty.")
        return value.strip()