"""
Teacher-specific views for class management and attendance functionality.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from core.models import Teacher, Class, ClassTeacherAssignment, Student, ClassStudentEnrollment, DailyAttendance
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_classes(request):
    """
    GET endpoint to retrieve classes assigned to a teacher based on JWT token.
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher profile from JWT token
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all active classes assigned to this teacher
        assigned_classes = Class.objects.filter(
            teacher_assignments__teacher=teacher,
            teacher_assignments__is_active=True,
            is_active=True
        ).annotate(
            student_count=Count(
                'student_enrollments',
                filter=Q(student_enrollments__is_active=True)
            )
        ).distinct()
        
        # Format response data
        classes_data = []
        for cls in assigned_classes:
            classes_data.append({
                'id': cls.id,
                'class_name': cls.class_name,
                'class_code': cls.class_code,
                'age_group': cls.age_group,
                'capacity': cls.capacity,
                'room_number': cls.room_number,
                'academic_year': cls.academic_year,
                'student_count': cls.student_count,
                'is_active': cls.is_active,
                'created_at': cls.created_at.isoformat() if hasattr(cls, 'created_at') else None,
            })
        
        return Response({
            'success': True,
            'data': classes_data,
            'count': len(classes_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_students(request, class_id):
    """
    GET endpoint to retrieve students in a specific class that the teacher is assigned to.
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher profile from JWT token
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the class and verify teacher is assigned to it
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            return Response(
                {'error': 'Class not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if teacher is assigned to this class
        teacher_assignment = ClassTeacherAssignment.objects.filter(
            class_obj=class_obj,
            teacher=teacher,
            is_active=True
        ).first()
        
        if not teacher_assignment:
            return Response(
                {'error': 'You are not assigned to this class'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all active students enrolled in this class
        student_enrollments = ClassStudentEnrollment.objects.filter(
            class_obj=class_obj,
            is_active=True
        ).select_related('student')
        
        # Format student data
        students_data = []
        for enrollment in student_enrollments:
            student = enrollment.student
            if student.is_active:
                students_data.append({
                    'id': student.id,
                    'student_name': student.student_name,
                    'student_id': student.student_id,
                    'date_of_birth': student.date_of_birth.isoformat() if student.date_of_birth else None,
                    'gender': student.gender,
                    'avatar_url': student.avatar_url,
                    'medical_conditions': student.medical_conditions,
                    'is_active': student.is_active,
                    'enrollment_date': enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                })
        
        return Response({
            'success': True,
            'data': students_data,
            'count': len(students_data),
            'class_info': {
                'id': class_obj.id,
                'class_name': class_obj.class_name,
                'class_code': class_obj.class_code,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    """
    POST endpoint to mark attendance for students in a class.
    Expected payload:
    {
        "class_id": 1,
        "attendance_date": "2023-12-01",
        "attendance_records": [
            {
                "student_id": 1,
                "status": "present",
                "notes": "Optional notes"
            }
        ]
    }
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can mark attendance'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher profile
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate request data
        class_id = request.data.get('class_id')
        attendance_date = request.data.get('attendance_date')
        attendance_records = request.data.get('attendance_records', [])
        
        if not class_id:
            return Response(
                {'error': 'class_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not attendance_date:
            return Response(
                {'error': 'attendance_date is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not attendance_records:
            return Response(
                {'error': 'attendance_records is required and cannot be empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and get class
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            return Response(
                {'error': 'Class not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify teacher is assigned to this class
        teacher_assignment = ClassTeacherAssignment.objects.filter(
            class_obj=class_obj,
            teacher=teacher,
            is_active=True
        ).first()
        
        if not teacher_assignment:
            return Response(
                {'error': 'You are not assigned to this class'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse attendance date
        try:
            from datetime import datetime
            attendance_date_obj = datetime.strptime(attendance_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid attendance_date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if attendance for this date already exists and prevent duplicate submissions
        existing_attendance = DailyAttendance.objects.filter(
            class_obj=class_obj,
            attendance_date=attendance_date_obj,
            marked_by_teacher=teacher
        ).first()
        
        if existing_attendance:
            return Response(
                {'error': f'Attendance for {attendance_date} has already been marked for this class'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate attendance records and students
        valid_statuses = ['present', 'absent', 'late', 'early_departure']
        created_records = []
        
        for record in attendance_records:
            student_id = record.get('student_id')
            record_status = record.get('status', 'present')
            notes = record.get('notes', '')
            
            if not student_id:
                return Response(
                    {'error': 'student_id is required for each attendance record'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if record_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status "{record_status}". Valid options: {", ".join(valid_statuses)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify student exists and is enrolled in this class
            try:
                student = Student.objects.get(id=student_id, is_active=True)
            except Student.DoesNotExist:
                return Response(
                    {'error': f'Student with ID {student_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if student is enrolled in this class
            enrollment = ClassStudentEnrollment.objects.filter(
                class_obj=class_obj,
                student=student,
                is_active=True
            ).first()
            
            if not enrollment:
                return Response(
                    {'error': f'Student {student.student_name} is not enrolled in this class'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create attendance record
            attendance_record = DailyAttendance.objects.create(
                class_obj=class_obj,
                student=student,
                attendance_date=attendance_date_obj,
                status=record_status,
                marked_by_teacher=teacher,
                notes=notes
            )
            created_records.append(attendance_record)
        
        # Prepare response data
        response_data = {
            'success': True,
            'message': f'Attendance for {attendance_date} has been recorded successfully',
            'data': {
                'class_id': class_obj.id,
                'class_name': class_obj.class_name,
                'attendance_date': attendance_date,
                'total_records': len(created_records),
                'records': [
                    {
                        'student_id': record.student.id,
                        'student_name': record.student.student_name,
                        'status': record.status,
                        'notes': record.notes,
                        'created_at': record.created_at.isoformat()
                    }
                    for record in created_records
                ]
            }
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance(request):
    """
    GET endpoint to retrieve attendance records for a teacher's classes.
    Query parameters:
    - class_id: Filter by specific class (required)
    - student_id: Filter by specific student (optional)
    - attendance_date: Filter by specific date in YYYY-MM-DD format (optional)
    - start_date: Filter from start date (optional)
    - end_date: Filter to end date (optional)
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can view attendance records'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher profile
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        class_id = request.GET.get('class_id')
        student_id = request.GET.get('student_id')
        attendance_date = request.GET.get('attendance_date')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if not class_id:
            return Response(
                {'error': 'class_id query parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and get class
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            return Response(
                {'error': 'Class not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify teacher is assigned to this class
        teacher_assignment = ClassTeacherAssignment.objects.filter(
            class_obj=class_obj,
            teacher=teacher,
            is_active=True
        ).first()
        
        if not teacher_assignment:
            return Response(
                {'error': 'You are not assigned to this class'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Build query for attendance records
        attendance_query = DailyAttendance.objects.filter(
            class_obj=class_obj
        ).select_related('student', 'marked_by_teacher__user')
        
        # Apply filters
        if student_id:
            try:
                student = Student.objects.get(id=student_id, is_active=True)
                attendance_query = attendance_query.filter(student=student)
            except Student.DoesNotExist:
                return Response(
                    {'error': f'Student with ID {student_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if attendance_date:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(attendance_date, '%Y-%m-%d').date()
                attendance_query = attendance_query.filter(attendance_date=date_obj)
            except ValueError:
                return Response(
                    {'error': 'Invalid attendance_date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if start_date:
            try:
                from datetime import datetime
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                attendance_query = attendance_query.filter(attendance_date__gte=start_date_obj)
            except ValueError:
                return Response(
                    {'error': 'Invalid start_date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if end_date:
            try:
                from datetime import datetime
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                attendance_query = attendance_query.filter(attendance_date__lte=end_date_obj)
            except ValueError:
                return Response(
                    {'error': 'Invalid end_date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Order by date (newest first) and then by student name
        attendance_records = attendance_query.order_by('-attendance_date', 'student__student_name')
        
        # Format response data
        records_data = []
        for record in attendance_records:
            records_data.append({
                'id': record.id,
                'student': {
                    'id': record.student.id,
                    'student_name': record.student.student_name,
                    'student_id': record.student.student_id,
                },
                'attendance_date': record.attendance_date.isoformat(),
                'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None,
                'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
                'status': record.status,
                'notes': record.notes,
                'marked_by': {
                    'id': record.marked_by_teacher.id,
                    'first_name': record.marked_by_teacher.user.first_name,
                    'last_name': record.marked_by_teacher.user.last_name,
                },
                'marked_at': record.created_at.isoformat(),
                'updated_at': record.updated_at.isoformat()
            })
        
        response_data = {
            'success': True,
            'data': records_data,
            'count': len(records_data),
            'filters': {
                'class_id': int(class_id),
                'class_name': class_obj.class_name,
                'student_id': int(student_id) if student_id else None,
                'attendance_date': attendance_date,
                'start_date': start_date,
                'end_date': end_date,
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )