from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from core.models import User, Parent, Teacher, Admin
from django.utils import timezone
import uuid


# Parent Registration Serializer
class ParentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        with transaction.atomic():
            # Create parent user (inactive until email verified)
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                password=validated_data['password'],
                user_type='parent',
                is_active=False,  # Inactive until email verified
                is_email_verified=False
            )
            
            # Generate verification token
            user.generate_email_verification_token()
            
            # Create parent profile
            Parent.objects.create(user=user)
            
            return user


# Login Serializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    user_type = serializers.ChoiceField(choices=['parent', 'teacher'], required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user_type = attrs.get('user_type')

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        # Check if user can login
        if not user.can_login():
            if user.user_type == 'parent' and not user.is_email_verified:
                raise serializers.ValidationError("Please verify your email before logging in.")
            else:
                raise serializers.ValidationError("Your account is not active.")

        # Authenticate password
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        # Validate user type if provided
        if user_type and user.user_type != user_type:
            if user_type == 'teacher' and user.user_type == 'parent':
                raise serializers.ValidationError({
                    'error': 'This account is registered as a Parent. Please login as a Teacher or use the Parent portal.',
                    'user_type_mismatch': True,
                    'actual_user_type': 'parent',
                    'expected_user_type': 'teacher'
                })
            elif user_type == 'parent' and user.user_type == 'teacher':
                raise serializers.ValidationError({
                    'error': 'This account is registered as a Teacher. Please login as a Teacher.',
                    'user_type_mismatch': True,
                    'actual_user_type': 'teacher',
                    'expected_user_type': 'parent'
                })

        attrs['user'] = user
        return attrs


# Email Verification Serializer
class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            user = User.objects.get(email_verification_token=value, is_email_verified=False)
            if user.is_verification_token_expired():
                raise serializers.ValidationError("Verification token has expired.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token.")


# Resend Verification Serializer
class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_email_verified=False)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Email not found or already verified.")


# User Profile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    teacher_profile = serializers.SerializerMethodField()
    admin_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'user_type', 'is_email_verified', 'is_active',
            'teacher_profile', 'admin_profile', 'is_staff', 'is_superuser',
            'must_change_password'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_teacher_profile(self, obj):
        if obj.user_type == 'teacher' and hasattr(obj, 'teacher_profile'):
            return {
                'employee_id': obj.teacher_profile.employee_id,
                'subjects': obj.teacher_profile.subjects,
                'qualification': obj.teacher_profile.qualification,
                'experience_years': obj.teacher_profile.experience_years,
                'hire_date': obj.teacher_profile.hire_date,
                'is_active': obj.teacher_profile.is_active,
                'password_change_required': obj.teacher_profile.password_change_required,
                'created_at': obj.teacher_profile.created_at,
            }
        return None

    def get_admin_profile(self, obj):
        if obj.user_type == 'admin' and hasattr(obj, 'admin_profile'):
            return {
                'admin_level': obj.admin_profile.admin_level,
                'permissions': obj.admin_profile.permissions,
                'is_active': obj.admin_profile.is_active,
                'created_at': obj.admin_profile.created_at,
            }
        return None


# Teacher Password Change Serializer (Self-service)
class TeacherPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        
        # Validate password strength
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})
        
        return attrs
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


# Teacher Registration Serializer (Admin Only)
class TeacherRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    subjects = serializers.CharField(max_length=255, help_text="Subject(s) or specialization")
    employee_id = serializers.CharField(max_length=50, required=False, help_text="Employee ID (auto-generated if not provided)")
    qualification = serializers.CharField(max_length=500, required=False, help_text="Educational qualifications")
    experience_years = serializers.IntegerField(min_value=0, default=0)
    hire_date = serializers.DateField(required=False)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 'password', 
            'confirm_password', 'subjects', 'employee_id', 'qualification', 
            'experience_years', 'hire_date'
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_employee_id(self, value):
        if value and Teacher.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("A teacher with this employee ID already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        
        return attrs

    def create(self, validated_data):
        # Extract teacher-specific fields
        subjects = validated_data.pop('subjects')
        employee_id = validated_data.pop('employee_id', None)
        qualification = validated_data.pop('qualification', '')
        experience_years = validated_data.pop('experience_years', 0)
        hire_date = validated_data.pop('hire_date', None)
        validated_data.pop('confirm_password')
        
        with transaction.atomic():
            # Create teacher user (active by default - no email verification needed)
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                password=validated_data['password'],
                user_type='teacher',
                is_active=True,  # Teachers are active by default
                is_email_verified=True  # No email verification needed for teachers
            )
            
            # Generate employee ID if not provided
            if not employee_id:
                employee_id = f"TCH{user.id:04d}"
            
            # Create teacher profile
            Teacher.objects.create(
                user=user,
                employee_id=employee_id,
                subjects=subjects,
                qualification=qualification,
                experience_years=experience_years,
                hire_date=hire_date or timezone.now().date()
            )
            
            return user


# Teacher Update Serializer (Admin Only)
class TeacherUpdateSerializer(serializers.ModelSerializer):
    subjects = serializers.CharField(max_length=255, help_text="Subject(s) or specialization")
    employee_id = serializers.CharField(max_length=50, help_text="Employee ID")
    qualification = serializers.CharField(max_length=500, required=False)
    experience_years = serializers.IntegerField(min_value=0, default=0)
    hire_date = serializers.DateField(required=False)
    is_active = serializers.BooleanField(default=True, help_text="Teacher account status")

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 
            'subjects', 'employee_id', 'qualification', 
            'experience_years', 'hire_date', 'is_active'
        ]

    def validate_email(self, value):
        # Check if email is being changed
        if self.instance and self.instance.email != value.lower():
            if User.objects.filter(email=value.lower()).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_employee_id(self, value):
        # Check if employee_id is being changed
        if self.instance and hasattr(self.instance, 'teacher_profile'):
            if self.instance.teacher_profile.employee_id != value:
                if Teacher.objects.filter(employee_id=value).exists():
                    raise serializers.ValidationError("A teacher with this employee ID already exists.")
        return value

    def update(self, instance, validated_data):
        # Extract teacher-specific fields
        subjects = validated_data.pop('subjects', None)
        employee_id = validated_data.pop('employee_id', None)
        qualification = validated_data.pop('qualification', None)
        experience_years = validated_data.pop('experience_years', None)
        hire_date = validated_data.pop('hire_date', None)
        
        with transaction.atomic():
            # Update user fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            # If email changed, mark for re-verification
            if 'email' in validated_data and instance.email != validated_data['email']:
                instance.is_email_verified = False
                instance.generate_email_verification_token()
            
            instance.save()
            
            # Update teacher profile
            if hasattr(instance, 'teacher_profile'):
                teacher_profile = instance.teacher_profile
                if subjects is not None:
                    teacher_profile.subjects = subjects
                if employee_id is not None:
                    teacher_profile.employee_id = employee_id
                if qualification is not None:
                    teacher_profile.qualification = qualification
                if experience_years is not None:
                    teacher_profile.experience_years = experience_years
                if hire_date is not None:
                    teacher_profile.hire_date = hire_date
                teacher_profile.save()
            
            return instance


# Teacher Detail Serializer (for listing and details)
class TeacherDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    teacher_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'user_type', 'is_email_verified', 'is_active',
            'teacher_profile', 'date_joined'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_teacher_profile(self, obj):
        if hasattr(obj, 'teacher_profile'):
            return {
                'employee_id': obj.teacher_profile.employee_id,
                'subjects': obj.teacher_profile.subjects,
                'qualification': obj.teacher_profile.qualification,
                'experience_years': obj.teacher_profile.experience_years,
                'hire_date': obj.teacher_profile.hire_date,
                'is_active': obj.teacher_profile.is_active,
                'created_at': obj.teacher_profile.created_at,
            }
        return None


# Admin Registration Serializer (Super Admin Only)
class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    admin_level = serializers.ChoiceField(choices=Admin.ADMIN_LEVELS, default='admin')
    permissions = serializers.JSONField(required=False, default=dict, help_text="Custom permissions as JSON object")

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 'password', 
            'confirm_password', 'admin_level', 'permissions'
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        
        return attrs

    def create(self, validated_data):
        # Extract admin-specific fields
        admin_level = validated_data.pop('admin_level', 'admin')
        permissions = validated_data.pop('permissions', {})
        validated_data.pop('confirm_password')
        
        with transaction.atomic():
            # Create admin user (active by default - no email verification needed)
            # Set is_superuser=True for super_admin level
            is_super = admin_level == 'super_admin'
            
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                password=validated_data['password'],
                user_type='admin',
                is_active=True,
                is_email_verified=True,
                is_staff=True,  # Admins are staff by default
                is_superuser=is_super,  # Set superuser status for super_admin level
                must_change_password=True  # Force password change on first login
            )
            
            # Admin profile is automatically created by signals.py
            # Update the admin profile with custom values
            admin_profile = Admin.objects.get(user=user)
            admin_profile.admin_level = admin_level
            admin_profile.permissions = permissions
            admin_profile.save()
            
            return user


# Admin Update Serializer (Super Admin Only)
class AdminUpdateSerializer(serializers.ModelSerializer):
    admin_level = serializers.ChoiceField(choices=Admin.ADMIN_LEVELS)
    permissions = serializers.JSONField(required=False, help_text="Custom permissions as JSON object")
    is_active = serializers.BooleanField(default=True, help_text="Admin account status")

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 
            'admin_level', 'permissions', 'is_active'
        ]

    def validate_email(self, value):
        # Check if email is being changed
        if self.instance and self.instance.email != value.lower():
            if User.objects.filter(email=value.lower()).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def update(self, instance, validated_data):
        # Extract admin-specific fields
        admin_level = validated_data.pop('admin_level', None)
        permissions = validated_data.pop('permissions', None)
        
        with transaction.atomic():
            # Update user fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            
            # Update admin profile
            if hasattr(instance, 'admin_profile'):
                admin_profile = instance.admin_profile
                if admin_level is not None:
                    admin_profile.admin_level = admin_level
                if permissions is not None:
                    admin_profile.permissions = permissions
                admin_profile.save()
            
            return instance


# Admin Detail Serializer (for listing and details)
class AdminDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    admin_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'user_type', 'is_email_verified', 'is_active',
            'admin_profile', 'date_joined', 'is_staff', 'is_superuser'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_admin_profile(self, obj):
        if hasattr(obj, 'admin_profile'):
            return {
                'admin_level': obj.admin_profile.admin_level,
                'permissions': obj.admin_profile.permissions,
                'is_active': obj.admin_profile.is_active,
                'created_at': obj.admin_profile.created_at,
            }
        return None


# Parent Update Serializer (Parent self-service)
class ParentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number'
        ]

    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update user fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            return instance


# Password Change Serializers
class ParentPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs


# Self-Service Profile Update Serializers
class TeacherSelfUpdateSerializer(serializers.ModelSerializer):
    subjects = serializers.CharField(max_length=255, help_text="Subject(s) or specialization", required=False)
    qualification = serializers.CharField(max_length=500, required=False)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 
            'subjects', 'qualification'
        ]

    def update(self, instance, validated_data):
        # Extract teacher-specific fields
        subjects = validated_data.pop('subjects', None)
        qualification = validated_data.pop('qualification', None)
        
        with transaction.atomic():
            # Update user fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            
            # Update teacher profile
            if hasattr(instance, 'teacher_profile'):
                teacher_profile = instance.teacher_profile
                if subjects is not None:
                    teacher_profile.subjects = subjects
                if qualification is not None:
                    teacher_profile.qualification = qualification
                teacher_profile.save()
            
            return instance


class AdminSelfUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number'
        ]

    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update user fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()
            return instance


# Password Change Serializers
class ParentPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs