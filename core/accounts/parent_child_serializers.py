from rest_framework import serializers
from core.models import Student, Parent, ParentStudentRelationship, Class
from django.db import transaction
from django.utils import timezone
from datetime import date
import re


class ChildDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for child information including class details"""
    current_class = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    relationship_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_name', 'student_id', 'date_of_birth',
            'gender', 'avatar_url', 'medical_conditions',
            'current_class', 'age', 'relationship_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_class(self, obj):
        """Get current class information"""
        enrollment = obj.class_enrollments.filter(is_active=True).first()
        if enrollment:
            return {
                'id': enrollment.class_obj.id,
                'class_name': enrollment.class_obj.class_name,
                'class_code': enrollment.class_obj.class_code,
                'age_group': enrollment.class_obj.age_group,
                'room_number': enrollment.class_obj.room_number,
                'enrollment_date': enrollment.enrollment_date,
            }
        return None
    
    def get_age(self, obj):
        """Calculate age from date of birth"""
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def get_relationship_info(self, obj):
        """Get relationship information for the requesting parent"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'parent_profile'):
            relationship = obj.parent_relationships.filter(
                parent=request.user.parent_profile
            ).first()
            if relationship:
                return {
                    'relationship_type': relationship.relationship_type,
                    'is_primary_contact': relationship.is_primary_contact,
                    'pickup_authorized': relationship.pickup_authorized,
                }
        return None


class ChildListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing children"""
    current_class_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    relationship_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_name', 'student_id', 'date_of_birth',
            'gender', 'avatar_url', 'current_class_name',
            'age', 'relationship_type'
        ]
    
    def get_current_class_name(self, obj):
        enrollment = obj.class_enrollments.filter(is_active=True).first()
        return enrollment.class_obj.class_name if enrollment else 'Not Assigned'
    
    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def get_relationship_type(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'parent_profile'):
            relationship = obj.parent_relationships.filter(
                parent=request.user.parent_profile
            ).first()
            return relationship.relationship_type if relationship else None
        return None


class AddChildSerializer(serializers.ModelSerializer):
    """Serializer for adding a new child"""
    relationship_type = serializers.ChoiceField(
        choices=ParentStudentRelationship.RELATIONSHIP_CHOICES,
        write_only=True
    )
    is_primary_contact = serializers.BooleanField(
        default=False, 
        write_only=True,
        required=False
    )
    pickup_authorized = serializers.BooleanField(
        default=True, 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Student
        fields = [
            'student_name', 'date_of_birth', 'gender', 'avatar_url',
            'medical_conditions', 'relationship_type', 'is_primary_contact',
            'pickup_authorized'
        ]
    
    def validate_student_name(self, value):
        """Validate student name format"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Student name must be at least 2 characters long.")
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r'^[a-zA-Z\s\'-]+$', value.strip()):
            raise serializers.ValidationError("Student name can only contain letters, spaces, hyphens, and apostrophes.")
        
        return value.strip().title()
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if not value:
            raise serializers.ValidationError("Date of birth is required.")
        
        today = date.today()
        
        # Check if date is not in the future
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        # Check if child is not too old for nursery (typically max 6 years)
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age > 6:
            raise serializers.ValidationError("Child seems too old for nursery school (maximum age: 6 years).")
        
        # Check if child is not too young (minimum 1 year)
        if age < 1:
            raise serializers.ValidationError("Child must be at least 1 year old.")
        
        return value
    
    def validate_gender(self, value):
        """Validate gender field"""
        if not value:
            raise serializers.ValidationError("Gender is required.")
        return value.lower()
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Check for duplicate child for the same parent
        request = self.context.get('request')
        if request and hasattr(request.user, 'parent_profile'):
            parent = request.user.parent_profile
            
            # Check if parent already has a child with the same name and date of birth
            existing_relationships = parent.student_relationships.filter(
                student__student_name__iexact=attrs['student_name'],
                student__date_of_birth=attrs['date_of_birth']
            )
            
            if existing_relationships.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f"You already have a child named '{attrs['student_name']}' with the same date of birth. "
                        "If this is a different child, please contact the admin."
                    ]
                })
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Create child and parent-child relationship"""
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'parent_profile'):
            raise serializers.ValidationError("Only parents can add children.")
        
        parent = request.user.parent_profile
        
        # Extract relationship fields
        relationship_type = validated_data.pop('relationship_type')
        is_primary_contact = validated_data.pop('is_primary_contact', False)
        pickup_authorized = validated_data.pop('pickup_authorized', True)
        
        # Generate student ID if not provided
        if not validated_data.get('student_id'):
            # Generate a simple student ID based on current year and count
            current_year = timezone.now().year
            student_count = Student.objects.filter(
                created_at__year=current_year
            ).count() + 1
            validated_data['student_id'] = f"STU{current_year}{student_count:04d}"
        
        # Create the student
        student = Student.objects.create(**validated_data)
        
        # Create the parent-student relationship
        ParentStudentRelationship.objects.create(
            parent=parent,
            student=student,
            relationship_type=relationship_type,
            is_primary_contact=is_primary_contact,
            pickup_authorized=pickup_authorized
        )
        
        return student


class UpdateChildSerializer(serializers.ModelSerializer):
    """Serializer for updating child information by parent"""
    relationship_type = serializers.ChoiceField(
        choices=ParentStudentRelationship.RELATIONSHIP_CHOICES,
        write_only=True,
        required=False
    )
    is_primary_contact = serializers.BooleanField(
        write_only=True,
        required=False
    )
    pickup_authorized = serializers.BooleanField(
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Student
        fields = [
            'student_name', 'date_of_birth', 'gender', 'avatar_url',
            'medical_conditions', 'relationship_type', 'is_primary_contact',
            'pickup_authorized'
        ]
    
    def validate_student_name(self, value):
        """Validate student name format"""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Student name must be at least 2 characters long.")
        
        if not re.match(r'^[a-zA-Z\s\'-]+$', value.strip()):
            raise serializers.ValidationError("Student name can only contain letters, spaces, hyphens, and apostrophes.")
        
        return value.strip().title()
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if not value:
            raise serializers.ValidationError("Date of birth is required.")
        
        today = date.today()
        
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age > 6:
            raise serializers.ValidationError("Child seems too old for nursery school (maximum age: 6 years).")
        
        if age < 1:
            raise serializers.ValidationError("Child must be at least 1 year old.")
        
        return value
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update child and relationship information"""
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'parent_profile'):
            raise serializers.ValidationError("Only parents can update their children.")
        
        parent = request.user.parent_profile
        
        # Check if parent has relationship with this child
        relationship = ParentStudentRelationship.objects.filter(
            parent=parent,
            student=instance
        ).first()
        
        if not relationship:
            raise serializers.ValidationError("You can only update your own children.")
        
        # Extract relationship fields
        relationship_type = validated_data.pop('relationship_type', None)
        is_primary_contact = validated_data.pop('is_primary_contact', None)
        pickup_authorized = validated_data.pop('pickup_authorized', None)
        
        # Update student information
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update relationship information if provided
        if relationship_type is not None:
            relationship.relationship_type = relationship_type
        if is_primary_contact is not None:
            relationship.is_primary_contact = is_primary_contact
        if pickup_authorized is not None:
            relationship.pickup_authorized = pickup_authorized
        
        if any([relationship_type, is_primary_contact is not None, pickup_authorized is not None]):
            relationship.save()
        
        return instance


class AvailableClassSerializer(serializers.ModelSerializer):
    """Serializer for available classes that children can be enrolled in"""
    student_count = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'class_name', 'class_code', 'age_group',
            'capacity', 'room_number', 'student_count', 'available_spots'
        ]
    
    def get_student_count(self, obj):
        return obj.student_enrollments.filter(is_active=True).count()
    
    def get_available_spots(self, obj):
        current_count = obj.student_enrollments.filter(is_active=True).count()
        return max(0, obj.capacity - current_count)