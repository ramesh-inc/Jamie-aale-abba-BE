from rest_framework import serializers
from core.models import (
    Class, Student, Teacher, ClassStudentEnrollment, 
    ClassTeacherAssignment, ParentStudentRelationship, Parent
)
from django.db import transaction
from django.utils import timezone


class ClassSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'class_name', 'class_code', 'age_group', 'capacity',
            'room_number', 'academic_year', 'is_active',
            'student_count', 'teacher_count', 'created_at', 'updated_at'
        ]
    
    def get_student_count(self, obj):
        return obj.student_enrollments.filter(is_active=True).count()
    
    def get_teacher_count(self, obj):
        return obj.teacher_assignments.filter(is_active=True).count()


class StudentSerializer(serializers.ModelSerializer):
    current_class = serializers.SerializerMethodField()
    parents = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_name', 'student_id', 'date_of_birth',
            'gender', 'avatar_url', 'medical_conditions', 'is_active',
            'current_class', 'parents', 'created_at', 'updated_at'
        ]
    
    def get_current_class(self, obj):
        enrollment = obj.class_enrollments.filter(is_active=True).first()
        if enrollment:
            return {
                'id': enrollment.class_obj.id,
                'class_name': enrollment.class_obj.class_name,
                'class_code': enrollment.class_obj.class_code
            }
        return None
    
    def get_parents(self, obj):
        relationships = obj.parent_relationships.all()
        parents = []
        for rel in relationships:
            parents.append({
                'id': rel.parent.id,
                'name': f"{rel.parent.user.first_name} {rel.parent.user.last_name}",
                'email': rel.parent.user.email,
                'phone': rel.parent.user.phone_number,
                'relationship': rel.relationship_type,
                'is_primary': rel.is_primary_contact
            })
        return parents


class TeacherSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    assigned_classes = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'name', 'email', 'phone', 'employee_id',
            'subjects', 'qualification', 'experience_years',
            'assigned_classes', 'student_count', 'is_active'
        ]
    
    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_phone(self, obj):
        return obj.user.phone_number
    
    def get_assigned_classes(self, obj):
        assignments = obj.class_assignments.filter(is_active=True)
        classes = []
        for assignment in assignments:
            classes.append({
                'id': assignment.class_obj.id,
                'class_name': assignment.class_obj.class_name,
                'class_code': assignment.class_obj.class_code,
                'role': assignment.role,
                'student_count': assignment.class_obj.student_enrollments.filter(is_active=True).count()
            })
        return classes
    
    def get_student_count(self, obj):
        total_students = 0
        for assignment in obj.class_assignments.filter(is_active=True):
            total_students += assignment.class_obj.student_enrollments.filter(is_active=True).count()
        return total_students


class ClassStudentEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='class_obj.class_name', read_only=True)
    
    class Meta:
        model = ClassStudentEnrollment
        fields = [
            'id', 'class_obj', 'student', 'enrollment_date', 'is_active',
            'student_name', 'student_id', 'class_name', 'created_at'
        ]


class ClassTeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.user.email', read_only=True)
    class_name = serializers.CharField(source='class_obj.class_name', read_only=True)
    
    class Meta:
        model = ClassTeacherAssignment
        fields = [
            'id', 'class_obj', 'teacher', 'role', 'assigned_date', 'is_active',
            'teacher_name', 'teacher_email', 'class_name', 'created_at'
        ]


class ClassDetailSerializer(ClassSerializer):
    students = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()
    
    class Meta(ClassSerializer.Meta):
        fields = ClassSerializer.Meta.fields + ['students', 'teachers']
    
    def get_students(self, obj):
        enrollments = obj.student_enrollments.filter(is_active=True)
        students = []
        for enrollment in enrollments:
            student = enrollment.student
            students.append({
                'id': student.id,
                'student_name': student.student_name,
                'student_id': student.student_id,
                'date_of_birth': student.date_of_birth,
                'gender': student.gender,
                'enrollment_date': enrollment.enrollment_date,
                'parents': StudentSerializer().get_parents(student)
            })
        return students
    
    def get_teachers(self, obj):
        assignments = obj.teacher_assignments.filter(is_active=True)
        teachers = []
        for assignment in assignments:
            teacher = assignment.teacher
            teachers.append({
                'id': teacher.id,
                'name': f"{teacher.user.first_name} {teacher.user.last_name}",
                'email': teacher.user.email,
                'phone': teacher.user.phone_number,
                'employee_id': teacher.employee_id,
                'role': assignment.role,
                'assigned_date': assignment.assigned_date,
                'subjects': teacher.subjects
            })
        return teachers


class TeacherStudentAssignmentSerializer(serializers.Serializer):
    """Serializer for bulk teacher-student assignments"""
    teacher_id = serializers.IntegerField()
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    class_id = serializers.IntegerField()
    role = serializers.ChoiceField(
        choices=ClassTeacherAssignment.ROLE_CHOICES,
        default='primary'
    )
    
    def validate_teacher_id(self, value):
        try:
            teacher = Teacher.objects.get(id=value, is_active=True)
        except Teacher.DoesNotExist:
            raise serializers.ValidationError("Teacher not found or inactive")
        return value
    
    def validate_class_id(self, value):
        try:
            class_obj = Class.objects.get(id=value, is_active=True)
        except Class.DoesNotExist:
            raise serializers.ValidationError("Class not found or inactive")
        return value
    
    def validate_student_ids(self, value):
        students = Student.objects.filter(id__in=value, is_active=True)
        if students.count() != len(value):
            raise serializers.ValidationError("Some students not found or inactive")
        return value
    
    @transaction.atomic
    def save(self):
        teacher_id = self.validated_data['teacher_id']
        student_ids = self.validated_data['student_ids']
        class_id = self.validated_data['class_id']
        role = self.validated_data['role']
        
        teacher = Teacher.objects.get(id=teacher_id)
        class_obj = Class.objects.get(id=class_id)
        
        # Create or update teacher-class assignment
        teacher_assignment, created = ClassTeacherAssignment.objects.get_or_create(
            class_obj=class_obj,
            teacher=teacher,
            role=role,
            defaults={'assigned_date': timezone.now().date(), 'is_active': True}
        )
        
        if not created and not teacher_assignment.is_active:
            teacher_assignment.is_active = True
            teacher_assignment.save()
        
        # Enroll students in the class if not already enrolled
        enrolled_students = []
        for student_id in student_ids:
            student = Student.objects.get(id=student_id)
            
            # Deactivate any existing enrollments for this student
            ClassStudentEnrollment.objects.filter(
                student=student, is_active=True
            ).update(is_active=False)
            
            # Create new enrollment
            enrollment, created = ClassStudentEnrollment.objects.get_or_create(
                class_obj=class_obj,
                student=student,
                defaults={'enrollment_date': timezone.now().date(), 'is_active': True}
            )
            
            if not created:
                enrollment.is_active = True
                enrollment.enrollment_date = timezone.now().date()
                enrollment.save()
            
            enrolled_students.append(student)
        
        return {
            'teacher': teacher,
            'class': class_obj,
            'students': enrolled_students,
            'role': role
        }


class StudentReassignmentSerializer(serializers.Serializer):
    """Serializer for reassigning students between classes/teachers"""
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    from_class_id = serializers.IntegerField(required=False, allow_null=True)
    to_class_id = serializers.IntegerField()
    
    def validate_student_ids(self, value):
        students = Student.objects.filter(id__in=value, is_active=True)
        if students.count() != len(value):
            raise serializers.ValidationError("Some students not found or inactive")
        return value
    
    def validate_to_class_id(self, value):
        try:
            class_obj = Class.objects.get(id=value, is_active=True)
        except Class.DoesNotExist:
            raise serializers.ValidationError("Destination class not found or inactive")
        return value
    
    @transaction.atomic
    def save(self):
        student_ids = self.validated_data['student_ids']
        to_class_id = self.validated_data['to_class_id']
        from_class_id = self.validated_data.get('from_class_id')
        
        to_class = Class.objects.get(id=to_class_id)
        reassigned_students = []
        
        for student_id in student_ids:
            student = Student.objects.get(id=student_id)
            
            # Deactivate current enrollment
            current_enrollments = ClassStudentEnrollment.objects.filter(
                student=student, is_active=True
            )
            
            if from_class_id:
                current_enrollments = current_enrollments.filter(class_obj_id=from_class_id)
            
            current_enrollments.update(is_active=False)
            
            # Create new enrollment
            new_enrollment, created = ClassStudentEnrollment.objects.get_or_create(
                class_obj=to_class,
                student=student,
                defaults={'enrollment_date': timezone.now().date(), 'is_active': True}
            )
            
            if not created:
                new_enrollment.is_active = True
                new_enrollment.enrollment_date = timezone.now().date()
                new_enrollment.save()
            
            reassigned_students.append(student)
        
        return {
            'to_class': to_class,
            'students': reassigned_students
        }