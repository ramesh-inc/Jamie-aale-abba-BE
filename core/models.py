import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ('parent', 'Parent'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]
    
    # Core fields
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='parent')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(unique=True)  # Make email unique for USERNAME_FIELD
    
    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, null=True, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Override is_active to require email verification for parents
    # Teachers and admins are active by default
    
    # Required fields for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
    
    def save(self, *args, **kwargs):
        """Override save to handle email as username"""
        if not self.username and self.email:
            self.username = self.email
        super().save(*args, **kwargs)
    
    def generate_email_verification_token(self):
        """Generate a new verification token"""
        self.email_verification_token = uuid.uuid4()
        self.email_verification_sent_at = timezone.now()
        self.save()
        return self.email_verification_token
    
    def verify_email(self, token):
        """Verify email with token"""
        if str(self.email_verification_token) == str(token):
            if not self.is_verification_token_expired():
                self.is_email_verified = True
                if self.user_type == 'parent':  # Parents need email verification to be active
                    self.is_active = True
                self.email_verification_token = None
                self.email_verification_sent_at = None
                self.save()
                return True
        return False
    
    def is_verification_token_expired(self):
        """Check if verification token is expired (24 hours)"""
        if not self.email_verification_sent_at:
            return True
        return timezone.now() > self.email_verification_sent_at + timedelta(hours=24)
    
    def can_login(self):
        """Check if user can login"""
        if not self.is_active:
            return False
        if self.user_type == 'parent' and not self.is_email_verified:
            return False
        return True


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    subjects = models.CharField(max_length=255, default="General", help_text="Subject(s) or specialization")
    qualification = models.TextField(blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    password_change_required = models.BooleanField(default=True, help_text="Teacher must change password on first login")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teachers'


class Parent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    occupation = models.CharField(max_length=100, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parents'


class Admin(models.Model):
    ADMIN_LEVELS = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    admin_level = models.CharField(max_length=20, choices=ADMIN_LEVELS, default='admin')
    permissions = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admins'


class Class(models.Model):
    class_name = models.CharField(max_length=100)
    class_code = models.CharField(max_length=20, unique=True)
    age_group = models.CharField(max_length=50, blank=True)
    capacity = models.PositiveIntegerField(default=20)
    room_number = models.CharField(max_length=20, blank=True)
    academic_year = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classes'
        verbose_name_plural = 'Classes'


class Student(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    student_name = models.CharField(max_length=200)
    student_id = models.CharField(max_length=50, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    medical_conditions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'


class ClassTeacherAssignment(models.Model):
    ROLE_CHOICES = [
        ('primary', 'Primary'),
        ('assistant', 'Assistant'),
        ('substitute', 'Substitute'),
    ]

    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='teacher_assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='class_assignments')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='primary')
    assigned_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_teacher_assignments'
        unique_together = ['class_obj', 'teacher', 'role']


class ClassStudentEnrollment(models.Model):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='student_enrollments')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='class_enrollments')
    enrollment_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_student_enrollments'
        unique_together = ['class_obj', 'student']


class ParentStudentRelationship(models.Model):
    RELATIONSHIP_CHOICES = [
        ('mother', 'Mother'),
        ('father', 'Father'),
        ('guardian', 'Guardian'),
        ('other', 'Other'),
    ]

    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='student_relationships')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_relationships')
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    is_primary_contact = models.BooleanField(default=False)
    pickup_authorized = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parent_student_relationships'
        unique_together = ['parent', 'student']


class Post(models.Model):
    AUTHOR_TYPES = [
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]

    POST_TYPES = [
        ('announcement', 'Announcement'),
        ('news', 'News'),
        ('activity', 'Activity'),
        ('event', 'Event'),
    ]

    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('class_only', 'Class Only'),
        ('private', 'Private'),
    ]

    author_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    author_type = models.CharField(max_length=20, choices=AUTHOR_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='announcement')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    target_class = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    is_featured = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'


class PostAttachment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_url = models.URLField(max_length=500)
    file_type = models.CharField(max_length=100, blank=True)
    file_size = models.PositiveBigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    uploaded_by_user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_attachments'


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_likes'
        unique_together = ['post', 'user']


class PostComment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    comment_text = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'post_comments'


class MessageThread(models.Model):
    PARTICIPANT_TYPES = [
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('admin', 'Admin'),
    ]

    thread_id = models.UUIDField(default=uuid.uuid4, unique=True)
    participant1_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_threads_as_p1')
    participant2_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_threads_as_p2')
    participant1_type = models.CharField(max_length=20, choices=PARTICIPANT_TYPES)
    participant2_type = models.CharField(max_length=20, choices=PARTICIPANT_TYPES)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='last_messages')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'message_threads'


class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('file', 'File'),
        ('image', 'Image'),
    ]

    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message_text = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    attachment_url = models.URLField(max_length=500, blank=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'


class AllowedMessageContact(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='allowed_contacts')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='allowed_parent_contacts')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='allowed_message_contacts')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'allowed_message_contacts'
        unique_together = ['parent', 'teacher', 'student']


class DailyAttendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('early_departure', 'Early Departure'),
    ]

    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    attendance_date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    marked_by_teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='marked_attendance')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'daily_attendance'
        unique_together = ['class_obj', 'student', 'attendance_date']


class LearningActivity(models.Model):
    CATEGORY_CHOICES = [
        ('literacy', 'Literacy'),
        ('numeracy', 'Numeracy'),
        ('science', 'Science'),
        ('art', 'Art'),
        ('music', 'Music'),
        ('physical', 'Physical'),
        ('social', 'Social'),
        ('other', 'Other'),
    ]

    activity_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    age_group = models.CharField(max_length=50, blank=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learning_activities'


class ClassLearningSession(models.Model):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='learning_sessions')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='conducted_sessions')
    activity = models.ForeignKey(LearningActivity, on_delete=models.CASCADE, related_name='sessions')
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    attendance_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_learning_sessions'


class StudentLearningRecord(models.Model):
    PARTICIPATION_LEVELS = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('needs_improvement', 'Needs Improvement'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='learning_records')
    class_session = models.ForeignKey(ClassLearningSession, on_delete=models.CASCADE, related_name='student_records')
    was_present = models.BooleanField(default=False)
    participation_level = models.CharField(max_length=20, choices=PARTICIPATION_LEVELS, default='good')
    individual_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_learning_records'
        unique_together = ['student', 'class_session']


class DownloadLog(models.Model):
    ITEM_TYPES = [
        ('post_attachment', 'Post Attachment'),
        ('report', 'Report'),
        ('document', 'Document'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='download_logs')
    downloaded_item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    downloaded_item_id = models.PositiveBigIntegerField()
    file_name = models.CharField(max_length=255, blank=True)
    file_url = models.URLField(max_length=500, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    disclaimer_accepted = models.BooleanField(default=False)
    download_purpose = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'download_logs'


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_token = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_sessions'


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveBigIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'