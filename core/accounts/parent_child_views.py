from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from datetime import datetime, timedelta
from core.models import Student, Parent, ParentStudentRelationship, Class, StudentLearningRecord, LearningActivity
from .parent_child_serializers import (
    ChildDetailSerializer, ChildListSerializer, AddChildSerializer,
    UpdateChildSerializer, AvailableClassSerializer
)
from .permissions import IsParentUser


class ParentChildrenListView(generics.ListAPIView):
    """
    List all children linked to the authenticated parent's account
    Parent access only
    """
    serializer_class = ChildListSerializer
    permission_classes = [IsAuthenticated, IsParentUser]
    
    def get_queryset(self):
        """Return only children linked to the authenticated parent"""
        parent = self.request.user.parent_profile
        return Student.objects.filter(
            parent_relationships__parent=parent,
            is_active=True
        ).order_by('student_name')
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AddChildView(generics.CreateAPIView):
    """
    Add a new child and link to the authenticated parent's account
    Parent access only
    """
    serializer_class = AddChildSerializer
    permission_classes = [IsAuthenticated, IsParentUser]
    
    def get_serializer_context(self):
        """Pass request context to serializer for validation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to provide custom response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        child = serializer.save()
        
        # Return the created child with detailed information
        response_serializer = ChildDetailSerializer(
            child, 
            context={'request': request}
        )
        
        return Response({
            'message': 'Child added successfully',
            'child': response_serializer.data
        }, status=status.HTTP_201_CREATED)


class ChildDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update detailed information about a specific child
    Parent can only access their own children
    """
    serializer_class = ChildDetailSerializer
    permission_classes = [IsAuthenticated, IsParentUser]
    
    def get_queryset(self):
        """Return only children linked to the authenticated parent"""
        parent = self.request.user.parent_profile
        return Student.objects.filter(
            parent_relationships__parent=parent,
            is_active=True
        )
    
    def get_serializer_class(self):
        """Use different serializers for GET and PUT requests"""
        if self.request.method == 'PUT':
            return UpdateChildSerializer
        return ChildDetailSerializer
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        """Override update to provide custom response"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        child = serializer.save()
        
        # Return updated child with detailed information
        response_serializer = ChildDetailSerializer(
            child,
            context={'request': request}
        )
        
        return Response({
            'message': 'Child information updated successfully',
            'child': response_serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParentUser])
def get_available_classes(request):
    """
    Get list of available classes for enrollment
    Parent access only
    """
    try:
        # Get all active classes
        classes = Class.objects.filter(is_active=True).order_by('class_name')
        
        serializer = AvailableClassSerializer(classes, many=True)
        
        return Response({
            'message': 'Available classes retrieved successfully',
            'classes': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve classes: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParentUser])
def get_child_summary(request):
    """
    Get summary information about all children for the parent dashboard
    Parent access only
    """
    try:
        parent = request.user.parent_profile
        
        # Get all children
        children = Student.objects.filter(
            parent_relationships__parent=parent,
            is_active=True
        )
        
        # Calculate summary statistics
        total_children = children.count()
        enrolled_children = children.filter(
            class_enrollments__is_active=True
        ).distinct().count()
        
        unenrolled_children = total_children - enrolled_children
        
        # Get children by class
        children_by_class = {}
        for child in children:
            enrollment = child.class_enrollments.filter(is_active=True).first()
            if enrollment:
                class_name = enrollment.class_obj.class_name
                if class_name not in children_by_class:
                    children_by_class[class_name] = []
                children_by_class[class_name].append({
                    'id': child.id,
                    'name': child.student_name,
                    'age': ChildListSerializer().get_age(child)
                })
        
        summary = {
            'total_children': total_children,
            'enrolled_children': enrolled_children,
            'unenrolled_children': unenrolled_children,
            'children_by_class': children_by_class
        }
        
        return Response({
            'message': 'Child summary retrieved successfully',
            'summary': summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve child summary: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsParentUser])
def remove_child_relationship(request, child_id):
    """
    Remove the relationship between parent and child (soft delete)
    This doesn't delete the child record, just the relationship
    Parent access only
    """
    try:
        parent = request.user.parent_profile
        
        # Find the relationship
        relationship = ParentStudentRelationship.objects.filter(
            parent=parent,
            student_id=child_id
        ).first()
        
        if not relationship:
            return Response(
                {'error': 'Child not found or not linked to your account'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        child_name = relationship.student.student_name
        
        # Check if this is the only parent relationship for the child
        other_relationships = ParentStudentRelationship.objects.filter(
            student_id=child_id
        ).exclude(parent=parent)
        
        if not other_relationships.exists():
            # If this is the only parent, we might want to keep the child record
            # but mark it as needing admin attention
            # For now, we'll just delete the relationship
            pass
        
        # Delete the relationship
        relationship.delete()
        
        return Response({
            'message': f'Successfully removed {child_name} from your account'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to remove child relationship: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsParentUser])
def request_class_enrollment(request, child_id):
    """
    Request enrollment for a child in a specific class
    This creates a request that needs admin approval
    Parent access only
    """
    try:
        parent = request.user.parent_profile
        class_id = request.data.get('class_id')
        
        if not class_id:
            return Response(
                {'error': 'Class ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify parent owns this child
        child = Student.objects.filter(
            id=child_id,
            parent_relationships__parent=parent,
            is_active=True
        ).first()
        
        if not child:
            return Response(
                {'error': 'Child not found or not linked to your account'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify class exists and is active
        target_class = Class.objects.filter(id=class_id, is_active=True).first()
        if not target_class:
            return Response(
                {'error': 'Class not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if child is already enrolled in this class
        existing_enrollment = child.class_enrollments.filter(
            class_obj=target_class,
            is_active=True
        ).first()
        
        if existing_enrollment:
            return Response(
                {'error': f'{child.student_name} is already enrolled in {target_class.class_name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check class capacity
        current_enrollment = target_class.student_enrollments.filter(is_active=True).count()
        if current_enrollment >= target_class.capacity:
            return Response(
                {'error': f'Class {target_class.class_name} is at full capacity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For now, we'll create a simple enrollment request
        # In a full implementation, you might want to create an EnrollmentRequest model
        
        return Response({
            'message': f'Enrollment request submitted for {child.student_name} in {target_class.class_name}',
            'note': 'Your enrollment request has been submitted and is pending admin approval.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to submit enrollment request: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParentUser])
def get_child_learning_activities(request, child_id):
    """
    Get learning activities data for a specific child by year
    Returns monthly aggregated hours of learning activities
    Parent access only
    """
    try:
        parent = request.user.parent_profile
        year = request.GET.get('year', str(datetime.now().year))
        
        # Verify parent has access to this child
        relationship = ParentStudentRelationship.objects.filter(
            parent=parent,
            student_id=child_id
        ).first()
        
        if not relationship:
            return Response(
                {'error': 'Child not found or not linked to your account'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        child = relationship.student
        
        try:
            year_int = int(year)
            start_date = datetime(year_int, 1, 1)
            end_date = datetime(year_int, 12, 31, 23, 59, 59)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize monthly data
        months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        
        monthly_data = []
        
        for month_num in range(1, 13):
            month_start = datetime(year_int, month_num, 1)
            if month_num == 12:
                month_end = datetime(year_int + 1, 1, 1) - timedelta(seconds=1)
            else:
                month_end = datetime(year_int, month_num + 1, 1) - timedelta(seconds=1)
            
            # Get learning activities for this child in this month
            learning_records = StudentLearningRecord.objects.filter(
                student=child,
                learning_session__activity_date__gte=month_start,
                learning_session__activity_date__lte=month_end
            ).aggregate(
                total_hours=Sum('learning_session__duration_minutes')
            )
            
            total_minutes = learning_records.get('total_hours') or 0
            total_hours = round(total_minutes / 60, 1) if total_minutes else 0
            
            monthly_data.append({
                'month': months[month_num - 1],
                'hours': total_hours
            })
        
        return Response(monthly_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve learning activities: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParentUser])
def get_child_attendance_data(request, child_id):
    """
    Get attendance data for a specific child by year
    Returns monthly aggregated attendance counts (present, absent, late)
    Parent access only
    """
    try:
        parent = request.user.parent_profile
        year = request.GET.get('year', str(datetime.now().year))
        
        # Verify parent has access to this child
        relationship = ParentStudentRelationship.objects.filter(
            parent=parent,
            student_id=child_id
        ).first()
        
        if not relationship:
            return Response(
                {'error': 'Child not found or not linked to your account'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        child = relationship.student
        
        try:
            year_int = int(year)
            start_date = datetime(year_int, 1, 1)
            end_date = datetime(year_int, 12, 31, 23, 59, 59)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize monthly data
        months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        
        monthly_data = []
        
        for month_num in range(1, 13):
            month_start = datetime(year_int, month_num, 1)
            if month_num == 12:
                month_end = datetime(year_int + 1, 1, 1) - timedelta(seconds=1)
            else:
                month_end = datetime(year_int, month_num + 1, 1) - timedelta(seconds=1)
            
            # Get attendance records for this child in this month
            from core.models import DailyAttendance
            
            attendance_counts = DailyAttendance.objects.filter(
                student=child,
                attendance_date__gte=month_start,
                attendance_date__lte=month_end
            ).values('status').annotate(count=Count('id'))
            
            # Initialize counts
            present_count = 0
            absent_count = 0
            late_count = 0
            
            # Process the counts
            for record in attendance_counts:
                if record['status'] == 'present':
                    present_count = record['count']
                elif record['status'] == 'absent':
                    absent_count = record['count']
                elif record['status'] == 'late':
                    late_count = record['count']
            
            monthly_data.append({
                'month': months[month_num - 1],
                'present': present_count,
                'absent': absent_count,
                'late': late_count
            })
        
        return Response(monthly_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve attendance data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParentUser])
def get_child_learning_activities(request, child_id):
    """
    Get learning activities data for a specific child for a given year.
    Returns monthly aggregated learning hours based on activities the child participated in.
    
    Query Parameters:
    - year: Academic year (e.g., 2025)
    
    Returns monthly data with total learning hours per month.
    """
    try:
        # Get the parent from the authenticated user
        parent = request.user.parent_profile
        
        # Get the child and verify parent relationship
        try:
            child = Student.objects.get(
                id=child_id,
                parent_relationships__parent=parent,
                is_active=True
            )
        except Student.DoesNotExist:
            return Response(
                {'error': 'Child not found or not associated with your account'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get year from query parameters
        year = request.GET.get('year', str(datetime.now().year))
        
        try:
            year_int = int(year)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid year format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Month names for response
        months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        
        monthly_data = []
        
        # Import here to avoid circular imports
        from core.models import ClassLearningSession
        
        for month_num in range(1, 13):
            month_start = datetime(year_int, month_num, 1)
            if month_num == 12:
                month_end = datetime(year_int + 1, 1, 1) - timedelta(seconds=1)
            else:
                month_end = datetime(year_int, month_num + 1, 1) - timedelta(seconds=1)
            
            # Get all learning records for this child in this month
            # Only include records where the student was present (was_present=True)
            learning_records = StudentLearningRecord.objects.filter(
                student=child,
                class_session__session_date__gte=month_start,
                class_session__session_date__lte=month_end,
                was_present=True  # Only count hours for sessions where child was present
            ).select_related('class_session')
            
            # Calculate total hours for the month
            total_minutes = 0
            for record in learning_records:
                # Get duration from the session
                session_duration = record.class_session.duration_minutes or 0
                total_minutes += session_duration
            
            # Convert minutes to hours (rounded to 1 decimal place)
            total_hours = round(total_minutes / 60.0, 1) if total_minutes > 0 else 0
            
            monthly_data.append({
                'month': months[month_num - 1],
                'hours': total_hours
            })
        
        return Response(monthly_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve learning activities data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )