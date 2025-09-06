from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from core.models import Teacher, User
import uuid
import os
import logging


def story_file_path(instance, filename):
    """Generate file path for story attachments"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('stories', str(instance.story.id), filename)


class SimpleStory(models.Model):
    STORY_TYPES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('file', 'File'),
        ('journal', 'Journal'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='simple_stories')
    title = models.CharField(max_length=200)
    content = models.TextField()
    story_type = models.CharField(max_length=20, choices=STORY_TYPES, default='journal')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'simple_stories'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.teacher.user.get_full_name()}"


class SimpleStoryAttachment(models.Model):
    story = models.ForeignKey(SimpleStory, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=story_file_path)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField()
    file_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simple_story_attachments'

    def __str__(self):
        return f"{self.file_name} - {self.story.title}"
    
    def delete_file(self):
        """Delete the associated file from filesystem"""
        if self.file and os.path.exists(self.file.path):
            try:
                os.remove(self.file.path)
                logging.info(f"Deleted media file: {self.file.path}")
                return True
            except Exception as e:
                logging.error(f"Failed to delete media file {self.file.path}: {str(e)}")
                return False
        return False


class SimpleStoryLike(models.Model):
    story = models.ForeignKey(SimpleStory, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simple_story_likes'
        unique_together = ['story', 'user']

    def __str__(self):
        return f"{self.user.get_full_name()} likes {self.story.title}"


class SimpleStoryComment(models.Model):
    story = models.ForeignKey(SimpleStory, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment_text = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'simple_story_comments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.story.title}"


# Signal to automatically delete media files when attachment is deleted
@receiver(post_delete, sender=SimpleStoryAttachment)
def delete_attachment_file(sender, instance, **kwargs):
    """Delete file from filesystem when attachment is deleted"""
    instance.delete_file()