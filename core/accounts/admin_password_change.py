from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

logger = logging.getLogger(__name__)


class AdminFirstTimePasswordChangeView(APIView):
    """View for admins to change their password on first login"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Change password for first-time login admins",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'current_password': openapi.Schema(type=openapi.TYPE_STRING),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, minLength=8),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=['current_password', 'new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response('Password changed successfully'),
            400: openapi.Response('Validation error'),
            403: openapi.Response('Permission denied'),
        }
    )
    def post(self, request):
        user = request.user
        
        # Check if user is an admin
        if user.user_type != 'admin':
            return Response({
                'error': 'This endpoint is only for admin users.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([current_password, new_password, confirm_password]):
            return Response({
                'error': 'All password fields are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if passwords match
        if new_password != confirm_password:
            return Response({
                'error': 'New passwords do not match.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password strength
        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            return Response({
                'error': 'Password validation failed.',
                'details': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Change password and clear the must_change_password flag
            user.set_password(new_password)
            user.must_change_password = False
            user.save()
            
            logger.info(f"Admin {user.email} changed password successfully")
            
            return Response({
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password change failed for {user.email}: {str(e)}")
            return Response({
                'error': 'Password change failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)