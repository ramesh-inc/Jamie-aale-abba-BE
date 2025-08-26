"""
Teacher-specific views for class management and attendance functionality.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from core.models import Teacher, Class, ClassTeacherAssignment, Student, ClassStudentEnrollment, DailyAttendance, LearningActivity, ClassLearningSession, StudentLearningRecord, ParentStudentRelationship, Parent
from .permissions import IsTeacherUser
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_students_with_parents(request, class_id):
    """
    GET endpoint to retrieve detailed student information including parent contacts
    for a specific class. Only accessible by teachers assigned to the class.
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can access student information'}, 
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
        
        # Validate and get class
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
        
        # Get all active students enrolled in this class with parent information
        student_enrollments = ClassStudentEnrollment.objects.filter(
            class_obj=class_obj,
            is_active=True
        ).select_related('student')
        
        # Format student data with parent information
        students_data = []
        for enrollment in student_enrollments:
            student = enrollment.student
            if student.is_active:
                # Get primary parent contact (first relationship)
                parent_contact = None
                parent_relationship = ParentStudentRelationship.objects.filter(
                    student=student,
                    parent__is_active=True,
                    parent__user__is_active=True
                ).select_related('parent__user').first()
                
                if parent_relationship:
                    parent = parent_relationship.parent
                    parent_contact = {
                        'parent_name': f"{parent.user.first_name} {parent.user.last_name}".strip(),
                        'phone_number': parent.user.phone_number or '',
                        'email': parent.user.email or '',
                        'relationship': parent_relationship.get_relationship_type_display()
                    }
                
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
                    'parent_contact': parent_contact,
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
        import traceback
        print(f"Error in get_class_students_with_parents: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_marked_attendance_dates(request, class_id):
    """
    GET endpoint to retrieve dates when attendance has already been marked for a specific class.
    Only accessible by teachers assigned to the class.
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can access attendance information'}, 
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
        
        # Validate and get class
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
        
        # Get distinct dates when attendance was marked for this class
        marked_dates = DailyAttendance.objects.filter(
            class_obj=class_obj
        ).values_list('attendance_date', flat=True).distinct().order_by('attendance_date')
        
        # Convert dates to string format
        marked_dates_list = [date.strftime('%Y-%m-%d') for date in marked_dates]
        
        response_data = {
            'success': True,
            'data': {
                'class_id': class_obj.id,
                'class_name': class_obj.class_name,
                'marked_dates': marked_dates_list
            },
            'count': len(marked_dates_list)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_learning_activity(request):
    """
    POST endpoint to record a learning activity session for a class.
    Expected payload:
    {
        "class_id": 1,
        "session_date": "2023-12-01",
        "activity_name": "Singing Activity",
        "description": "Children learned to sing nursery rhymes",
        "category": "music",
        "start_time": "10:00",
        "end_time": "10:30",
        "duration_minutes": 30,
        "notes": "All children participated actively"
    }
    """
    try:
        # Verify user is a teacher
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can record learning activities'}, 
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
        session_date = request.data.get('session_date')
        activity_name = request.data.get('activity_name')
        description = request.data.get('description', '')
        category = request.data.get('category', 'other')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        duration_minutes = request.data.get('duration_minutes')
        notes = request.data.get('notes', '')
        
        # Required field validation
        if not class_id:
            return Response(
                {'error': 'class_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not session_date:
            return Response(
                {'error': 'session_date is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not activity_name:
            return Response(
                {'error': 'activity_name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Provide default start_time if not provided
        if not start_time:
            start_time = "10:00"  # Default start time
        
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
        
        # Parse and validate dates/times
        try:
            from datetime import datetime, time
            session_date_obj = datetime.strptime(session_date, '%Y-%m-%d').date()
            start_time_obj = datetime.strptime(start_time, '%H:%M').time()
            
            end_time_obj = None
            if end_time:
                end_time_obj = datetime.strptime(end_time, '%H:%M').time()
        except ValueError as ve:
            return Response(
                {'error': f'Invalid date/time format: {str(ve)}. Use YYYY-MM-DD for date and HH:MM for time'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate duration if not provided
        if not duration_minutes and end_time_obj:
            start_datetime = datetime.combine(session_date_obj, start_time_obj)
            end_datetime = datetime.combine(session_date_obj, end_time_obj)
            duration_minutes = int((end_datetime - start_datetime).total_seconds() / 60)
        elif not duration_minutes:
            duration_minutes = 30  # Default duration
        
        # Validate category
        valid_categories = [choice[0] for choice in LearningActivity.CATEGORY_CHOICES]
        if category not in valid_categories:
            return Response(
                {'error': f'Invalid category "{category}". Valid options: {", ".join(valid_categories)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or get learning activity template
        activity, created = LearningActivity.objects.get_or_create(
            activity_name=activity_name,
            category=category,
            defaults={
                'description': description,
                'duration_minutes': duration_minutes,
                'age_group': class_obj.age_group
            }
        )
        
        # Get students who attended class on this date (present or late)
        attended_students = DailyAttendance.objects.filter(
            class_obj=class_obj,
            attendance_date=session_date_obj,
            status__in=['present', 'late']
        ).select_related('student')
        
        attendance_count = attended_students.count()
        
        # Create class learning session
        learning_session = ClassLearningSession.objects.create(
            class_obj=class_obj,
            teacher=teacher,
            activity=activity,
            session_date=session_date_obj,
            start_time=start_time_obj,
            end_time=end_time_obj,
            duration_minutes=duration_minutes,
            notes=notes,
            attendance_count=attendance_count
        )
        
        # Create student learning records for students who attended
        student_records = []
        for attendance in attended_students:
            student_record = StudentLearningRecord.objects.create(
                student=attendance.student,
                class_session=learning_session,
                was_present=True,
                participation_level='good',  # Default level
                individual_notes=''
            )
            student_records.append(student_record)
        
        # Prepare response data
        response_data = {
            'success': True,
            'message': f'Learning activity "{activity_name}" recorded successfully for {attendance_count} students',
            'data': {
                'session_id': learning_session.id,
                'activity': {
                    'id': activity.id,
                    'name': activity.activity_name,
                    'category': activity.category,
                    'description': activity.description
                },
                'class': {
                    'id': class_obj.id,
                    'name': class_obj.class_name,
                    'code': class_obj.class_code
                },
                'session_details': {
                    'date': session_date,
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration_minutes': duration_minutes,
                    'notes': notes,
                    'attendance_count': attendance_count
                },
                'participating_students': [
                    {
                        'student_id': record.student.id,
                        'student_name': record.student.student_name,
                        'student_code': record.student.student_id
                    }
                    for record in student_records
                ],
                'created_at': learning_session.created_at.isoformat()
            }
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacherUser])
def get_teacher_activities(request):
    """
    Get learning activities recorded by the authenticated teacher
    
    Query Parameters:
    - date: Filter activities by specific date (YYYY-MM-DD format)
    - class_id: Filter activities by specific class
    
    Returns list of activities with details
    """
    try:
        teacher = request.user.teacher_profile
        
        # Get query parameters
        selected_date = request.GET.get('date')
        class_id = request.GET.get('class_id')
        
        # Base query - get all learning sessions for this teacher
        query = ClassLearningSession.objects.filter(teacher=teacher).select_related(
            'activity', 'class_obj'
        ).prefetch_related('student_records__student')
        
        # Apply date filter if provided
        if selected_date:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(selected_date, '%Y-%m-%d').date()
                query = query.filter(session_date=date_obj)
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Apply class filter if provided
        if class_id:
            try:
                class_id_int = int(class_id)
                query = query.filter(class_obj_id=class_id_int)
            except ValueError:
                return Response(
                    {'error': 'Invalid class_id format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Order by most recent first
        learning_sessions = query.order_by('-session_date', '-start_time')
        
        # Format the response
        activities = []
        for session in learning_sessions:
            # Get student count for this session
            student_count = session.student_records.filter(was_present=True).count()
            
            # Calculate end time if not provided
            end_time = session.end_time
            if not end_time and session.start_time and session.duration_minutes:
                from datetime import datetime, timedelta
                start_datetime = datetime.combine(session.session_date, session.start_time)
                end_datetime = start_datetime + timedelta(minutes=session.duration_minutes)
                end_time = end_datetime.time()
            
            activity_data = {
                'id': session.id,
                'activity_date': session.session_date.isoformat(),
                'activity_type': session.activity.category if session.activity else 'general',
                'title': session.activity.activity_name if session.activity else 'Learning Session',
                'description': session.notes or '',
                'learning_objectives': session.activity.learning_objectives if session.activity else '',
                'materials_used': session.activity.materials_used if session.activity else '',
                'duration_minutes': session.duration_minutes or 0,
                'class_name': session.class_obj.class_name,
                'class_id': session.class_obj.id,
                'student_count': student_count,
                'created_at': session.created_at.isoformat(),
                'start_time': session.start_time.strftime('%H:%M') if session.start_time else None,
                'end_time': end_time.strftime('%H:%M') if end_time else None,
            }
            
            activities.append(activity_data)
        
        return Response(activities, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve activities: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_learning_activities(request, student_id):
    """
    GET endpoint for teachers to retrieve learning activities data for a specific student.
    Returns monthly aggregated data similar to parent endpoint but with teacher access controls.
    """
    try:
        from django.db.models import Sum
        from datetime import datetime, date
        from calendar import monthrange
        import calendar
        
        # Get teacher profile
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the student
        try:
            student = Student.objects.get(id=student_id, is_active=True)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if teacher has access to this student (through class assignment)
        student_enrollment = ClassStudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).first()
        
        if not student_enrollment:
            return Response(
                {'error': 'Student is not enrolled in any active class'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if teacher is assigned to the student's class
        teacher_assignment = ClassTeacherAssignment.objects.filter(
            teacher=teacher,
            class_obj=student_enrollment.class_obj,
            is_active=True
        ).first()
        
        if not teacher_assignment:
            return Response(
                {'error': 'You do not have access to this student'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get year parameter
        year = request.GET.get('year', str(date.today().year))
        try:
            year_int = int(year)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get learning activities for this student for the specified year
        learning_records = StudentLearningRecord.objects.filter(
            student=student,
            class_session__session_date__year=year_int,
            class_session__class_obj=student_enrollment.class_obj
        ).select_related('class_session', 'class_session__activity')
        
        # Aggregate by month
        monthly_data = []
        for month in range(1, 13):
            month_records = learning_records.filter(
                class_session__session_date__month=month
            )
            
            # Calculate total hours for the month
            total_minutes = month_records.aggregate(
                total=Sum('class_session__duration_minutes')
            )['total'] or 0
            
            total_hours = round(total_minutes / 60, 1)
            
            monthly_data.append({
                'month': calendar.month_abbr[month],
                'hours': total_hours
            })
        
        return Response(monthly_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve learning activities: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_attendance_data(request, student_id):
    """
    GET endpoint for teachers to retrieve attendance data for a specific student.
    Returns monthly aggregated data similar to parent endpoint but with teacher access controls.
    """
    try:
        from datetime import datetime, date
        import calendar
        
        # Get teacher profile
        try:
            teacher = Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the student
        try:
            student = Student.objects.get(id=student_id, is_active=True)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if teacher has access to this student (through class assignment)
        student_enrollment = ClassStudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).first()
        
        if not student_enrollment:
            return Response(
                {'error': 'Student is not enrolled in any active class'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if teacher is assigned to the student's class
        teacher_assignment = ClassTeacherAssignment.objects.filter(
            teacher=teacher,
            class_obj=student_enrollment.class_obj,
            is_active=True
        ).first()
        
        if not teacher_assignment:
            return Response(
                {'error': 'You do not have access to this student'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get year parameter
        year = request.GET.get('year', str(date.today().year))
        try:
            year_int = int(year)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get attendance records for this student for the specified year
        attendance_records = DailyAttendance.objects.filter(
            student=student,
            attendance_date__year=year_int,
            class_obj=student_enrollment.class_obj
        )
        
        # Aggregate by month
        monthly_data = []
        for month in range(1, 13):
            month_records = attendance_records.filter(
                attendance_date__month=month
            )
            
            total_days = month_records.count()
            present_days = month_records.filter(status='present').count()
            late_days = month_records.filter(status='late').count()
            absent_days = month_records.filter(status='absent').count()
            
            # Calculate attendance rate (present + late = attended)
            attended_days = present_days + late_days
            attendance_rate = round((attended_days / total_days * 100), 1) if total_days > 0 else 0
            
            monthly_data.append({
                'month': calendar.month_abbr[month],
                'total_days': total_days,
                'present_days': present_days,
                'late_days': late_days,
                'absent_days': absent_days,
                'attendance_rate': attendance_rate
            })
        
        return Response(monthly_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve attendance data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )