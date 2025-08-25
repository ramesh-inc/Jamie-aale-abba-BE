from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from core.models import (
    Class, Student, Teacher, ClassStudentEnrollment,
    ClassTeacherAssignment, User
)
from .class_management_serializers import (
    ClassSerializer, ClassDetailSerializer, StudentSerializer,
    TeacherSerializer, ClassStudentEnrollmentSerializer,
    ClassTeacherAssignmentSerializer, TeacherStudentAssignmentSerializer,
    StudentReassignmentSerializer
)
from .permissions import IsAdminUser


class ClassListCreateView(generics.ListCreateAPIView):
    """
    List all classes or create a new class
    Admin only access
    """
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Class.objects.all().order_by('class_name')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(class_name__icontains=search) |
                Q(class_code__icontains=search) |
                Q(age_group__icontains=search)
            )
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a class
    Admin only access
    """
    queryset = Class.objects.all()
    serializer_class = ClassDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'message': 'Class deactivated successfully'}, status=status.HTTP_200_OK)


class StudentListCreateView(generics.ListCreateAPIView):
    """
    List all students or create a new student
    Admin only access
    """
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Student.objects.all().order_by('student_name')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(student_name__icontains=search) |
                Q(student_id__icontains=search)
            )
        
        # Filter by class
        class_id = self.request.query_params.get('class_id', None)
        if class_id:
            queryset = queryset.filter(
                class_enrollments__class_obj_id=class_id,
                class_enrollments__is_active=True
            )
        
        # Filter by enrollment status
        enrollment_status = self.request.query_params.get('enrollment_status', None)
        if enrollment_status == 'enrolled':
            queryset = queryset.filter(
                class_enrollments__is_active=True
            ).distinct()
        elif enrollment_status == 'unassigned':
            queryset = queryset.exclude(
                class_enrollments__is_active=True
            )
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a student
    Admin only access
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark as inactive"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'message': 'Student deactivated successfully'}, status=status.HTTP_200_OK)


class TeacherStudentAssignmentView(generics.ListAPIView):
    """
    List all teacher-student assignments with detailed information
    Admin only access
    """
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Teacher.objects.filter(is_active=True).order_by('user__first_name')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(employee_id__icontains=search)
            )
        
        # Filter by class assignment
        class_id = self.request.query_params.get('class_id', None)
        if class_id:
            queryset = queryset.filter(
                class_assignments__class_obj_id=class_id,
                class_assignments__is_active=True
            )
        
        # Filter by assignment status
        assignment_status = self.request.query_params.get('assignment_status', None)
        if assignment_status == 'assigned':
            queryset = queryset.filter(
                class_assignments__is_active=True
            ).distinct()
        elif assignment_status == 'unassigned':
            queryset = queryset.exclude(
                class_assignments__is_active=True
            )
        
        # Filter by subject
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subjects__icontains=subject)
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_students_to_teacher(request):
    """
    Assign multiple students to a teacher and class
    """
    serializer = TeacherStudentAssignmentSerializer(data=request.data)
    if serializer.is_valid():
        try:
            result = serializer.save()
            return Response({
                'message': 'Students assigned successfully',
                'teacher': f"{result['teacher'].user.get_full_name()}",
                'class': result['class'].class_name,
                'students_count': len(result['students']),
                'role': result['role']
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Assignment failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reassign_students(request):
    """
    Reassign students from one class to another
    """
    serializer = StudentReassignmentSerializer(data=request.data)
    if serializer.is_valid():
        try:
            result = serializer.save()
            return Response({
                'message': 'Students reassigned successfully',
                'to_class': result['to_class'].class_name,
                'students_count': len(result['students'])
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Reassignment failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def remove_student_assignment(request, student_id):
    """
    Remove a student from their current class assignment
    """
    try:
        student = Student.objects.get(id=student_id, is_active=True)
        
        # Deactivate current enrollment
        current_enrollments = ClassStudentEnrollment.objects.filter(
            student=student, is_active=True
        )
        
        if not current_enrollments.exists():
            return Response(
                {'error': 'Student is not currently assigned to any class'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        current_enrollments.update(is_active=False)
        
        return Response({
            'message': f'Student {student.student_name} removed from class assignment'
        }, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Removal failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_teacher_to_class(request):
    """
    Assign a teacher to a specific class
    """
    teacher_id = request.data.get('teacher_id')
    class_id = request.data.get('class_id')
    role = request.data.get('role', 'primary')
    
    if not teacher_id or not class_id:
        return Response(
            {'error': 'teacher_id and class_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        teacher = Teacher.objects.get(id=teacher_id, is_active=True)
        class_obj = Class.objects.get(id=class_id, is_active=True)
        
        # Create or update teacher-class assignment
        assignment, created = ClassTeacherAssignment.objects.get_or_create(
            class_obj=class_obj,
            teacher=teacher,
            role=role,
            defaults={
                'assigned_date': timezone.now().date(),
                'is_active': True
            }
        )
        
        if not created and not assignment.is_active:
            assignment.is_active = True
            assignment.assigned_date = timezone.now().date()
            assignment.save()
        
        action = 'assigned' if created else 'reactivated'
        
        return Response({
            'message': f'Teacher {action} to class successfully',
            'teacher': teacher.user.get_full_name(),
            'class': class_obj.class_name,
            'role': role
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Teacher.DoesNotExist:
        return Response(
            {'error': 'Teacher not found or inactive'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Class.DoesNotExist:
        return Response(
            {'error': 'Class not found or inactive'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Assignment failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def remove_teacher_from_class(request, teacher_id, class_id):
    """
    Remove a teacher from a class assignment
    """
    try:
        assignment = ClassTeacherAssignment.objects.get(
            teacher_id=teacher_id,
            class_obj_id=class_id,
            is_active=True
        )
        
        assignment.is_active = False
        assignment.save()
        
        return Response({
            'message': 'Teacher removed from class successfully'
        }, status=status.HTTP_200_OK)
        
    except ClassTeacherAssignment.DoesNotExist:
        return Response(
            {'error': 'Teacher assignment not found or already inactive'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Removal failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_statistics(request):
    """
    Get dashboard statistics for admin overview
    """
    try:
        stats = {
            'total_classes': Class.objects.filter(is_active=True).count(),
            'total_students': Student.objects.filter(is_active=True).count(),
            'total_teachers': Teacher.objects.filter(is_active=True).count(),
            'enrolled_students': Student.objects.filter(
                class_enrollments__is_active=True
            ).distinct().count(),
            'unassigned_students': Student.objects.filter(
                is_active=True
            ).exclude(
                class_enrollments__is_active=True
            ).count(),
            'assigned_teachers': Teacher.objects.filter(
                class_assignments__is_active=True
            ).distinct().count(),
            'unassigned_teachers': Teacher.objects.filter(
                is_active=True
            ).exclude(
                class_assignments__is_active=True
            ).count(),
        }
        
        # Class utilization
        classes_with_stats = Class.objects.filter(is_active=True).annotate(
            student_count=Count('student_enrollments', filter=Q(student_enrollments__is_active=True))
        )
        
        class_utilization = []
        for class_obj in classes_with_stats:
            utilization_percent = (class_obj.student_count / class_obj.capacity * 100) if class_obj.capacity > 0 else 0
            class_utilization.append({
                'class_name': class_obj.class_name,
                'student_count': class_obj.student_count,
                'capacity': class_obj.capacity,
                'utilization_percent': round(utilization_percent, 1)
            })
        
        stats['class_utilization'] = class_utilization
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch statistics: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )