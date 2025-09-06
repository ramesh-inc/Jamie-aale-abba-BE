from rest_framework import serializers
from django.core.files.uploadedfile import InMemoryUploadedFile
from core.simple_story_models import SimpleStory, SimpleStoryAttachment, SimpleStoryLike, SimpleStoryComment


class SimpleStoryAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    mime_type = serializers.SerializerMethodField()
    
    class Meta:
        model = SimpleStoryAttachment
        fields = ['id', 'file_name', 'file_url', 'file_size', 'file_type', 'mime_type', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_mime_type(self, obj):
        # Derive mime type from file_type
        if obj.file_type == 'image':
            return 'image/jpeg'  # Default, could be more specific
        elif obj.file_type == 'video':
            return 'video/mp4'   # Default, could be more specific
        elif obj.file_type == 'document':
            return 'application/pdf'  # Default, could be more specific
        return 'application/octet-stream'


class SimpleStoryListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    attachments = SimpleStoryAttachmentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    target_classes_names = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = SimpleStory
        fields = [
            'id', 'title', 'content', 'story_type', 'teacher_name',
            'attachments', 'likes_count', 'comments_count', 'user_has_liked',
            'target_classes_names', 'can_delete', 'can_edit', 'created_at', 'updated_at'
        ]
    
    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name()
    
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
        # Simple implementation - just return empty list for now
        # Since the simple model doesn't have target classes relationship
        return []
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Admins can delete any story, teachers can delete their own stories
        if request.user.user_type == 'admin' and hasattr(request.user, 'admin_profile'):
            return True
        elif request.user.user_type == 'teacher' and hasattr(request.user, 'teacher_profile'):
            return obj.teacher.user == request.user
        return False
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Admins can edit any story, teachers can edit their own stories
        if request.user.user_type == 'admin' and hasattr(request.user, 'admin_profile'):
            return True
        elif request.user.user_type == 'teacher' and hasattr(request.user, 'teacher_profile'):
            return obj.teacher.user == request.user
        return False
    
    def to_representation(self, instance):
        # Get the base representation
        data = super().to_representation(instance)
        
        # Re-serialize attachments with context
        if instance.attachments.exists():
            attachments_serializer = SimpleStoryAttachmentSerializer(
                instance.attachments.all(),
                many=True,
                context=self.context
            )
            data['attachments'] = attachments_serializer.data
        
        return data


class SimpleStoryCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        write_only=True
    )
    
    class Meta:
        model = SimpleStory
        fields = ['title', 'content', 'story_type', 'attachments']
    
    def validate_attachments(self, files):
        if not files:
            return files
        
        if len(files) > 5:
            raise serializers.ValidationError("Maximum 5 files can be attached.")
        
        for file in files:
            # Validate file size based on type
            if file.content_type.startswith('image/'):
                max_size = 3 * 1024 * 1024  # 3MB
                if file.size > max_size:
                    raise serializers.ValidationError(f"Image files must be smaller than 3MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")
            elif file.content_type.startswith('video/'):
                max_size = 20 * 1024 * 1024  # 20MB
                if file.size > max_size:
                    raise serializers.ValidationError(f"Video files must be smaller than 20MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")
            else:
                max_size = 3 * 1024 * 1024  # 3MB
                if file.size > max_size:
                    raise serializers.ValidationError(f"Document files must be smaller than 3MB. File {file.name} is {file.size / (1024*1024):.1f}MB.")
        
        return files
    
    def create(self, validated_data):
        attachments = validated_data.pop('attachments', [])
        
        # Get user from request
        request = self.context.get('request')
        
        # Handle both teachers and admins
        if request.user.user_type == 'teacher':
            teacher = request.user.teacher_profile
        elif request.user.user_type == 'admin':
            # For admins, we'll need to create a temporary teacher profile or modify the model
            # For now, let's create as admin but we need to update the model
            # Since SimpleStory requires a teacher, we need to modify this
            from django.contrib.auth import get_user_model
            from core.models import Teacher
            User = get_user_model()
            
            # Create a virtual teacher profile for admin posts
            # This is a workaround - ideally we'd modify the model
            teacher, created = Teacher.objects.get_or_create(
                user=request.user,
                defaults={
                    'employee_id': f'ADMIN_{request.user.id}',
                    'subjects': 'Administration',
                    'experience_years': 0,
                }
            )
        else:
            raise serializers.ValidationError("Only teachers and admins can create stories")
        
        # Create story
        story = SimpleStory.objects.create(teacher=teacher, **validated_data)
        
        # Create attachments
        for file in attachments:
            # Determine file type
            if file.content_type.startswith('image/'):
                file_type = 'image'
            elif file.content_type.startswith('video/'):
                file_type = 'video'
            else:
                file_type = 'document'
            
            SimpleStoryAttachment.objects.create(
                story=story,
                file=file,
                file_name=file.name,
                file_size=file.size,
                file_type=file_type
            )
        
        return story


class SimpleStoryCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = SimpleStoryComment
        fields = ['id', 'comment_text', 'user_name', 'created_at', 'can_delete']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Admins can delete any comment, users can delete their own comments
        if request.user.user_type == 'admin' and hasattr(request.user, 'admin_profile'):
            return True
        return obj.user == request.user


class SimpleStoryCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimpleStoryComment
        fields = ['comment_text']
    
    def create(self, validated_data):
        request = self.context.get('request')
        story = self.context.get('story')
        
        return SimpleStoryComment.objects.create(
            story=story,
            user=request.user,
            **validated_data
        )