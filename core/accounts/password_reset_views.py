from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from core.models import User
from .password_reset_serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .email_service import send_password_reset_email
import uuid
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetRequestView(APIView):
    """Request password reset - sends email with reset token"""
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_description="Request password reset for any user type",
        request_body=PasswordResetRequestSerializer,
        responses={
            200: openapi.Response('Password reset email sent'),
            400: openapi.Response('Validation error'),
            404: openapi.Response('User not found'),
        }
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Generate new reset token
                user.password_reset_token = uuid.uuid4()
                user.password_reset_sent_at = timezone.now()
                user.save()
                
                # Send reset email
                if send_password_reset_email(user):
                    logger.info(f"Password reset requested for {email}")
                    return Response({
                        'message': 'If an account with this email exists, you will receive a password reset link shortly.'
                    }, status=status.HTTP_200_OK)
                else:
                    logger.error(f"Failed to send password reset email for {email}")
                    return Response({
                        'error': 'Failed to send reset email. Please try again later.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except User.DoesNotExist:
                # Still return success message to prevent email enumeration
                logger.warning(f"Password reset requested for non-existent email: {email}")
                return Response({
                    'message': 'If an account with this email exists, you will receive a password reset link shortly.'
                }, status=status.HTTP_200_OK)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetConfirmView(APIView):
    """Confirm password reset with token and set new password"""
    permission_classes = [permissions.AllowAny]
    
    @swagger_auto_schema(
        operation_description="Confirm password reset with valid token",
        request_body=PasswordResetConfirmSerializer,
        responses={
            200: openapi.Response('Password reset successful'),
            400: openapi.Response('Invalid token or validation error'),
        }
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                logger.info(f"Password reset completed for {user.email}")
                
                return Response({
                    'message': 'Password has been reset successfully. You can now login with your new password.'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Password reset failed: {str(e)}")
                return Response({
                    'error': 'Password reset failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def validate_reset_token(request, token):
    """Validate if a password reset token is still valid"""
    try:
        user = User.objects.get(
            password_reset_token=token,
            password_reset_sent_at__gte=timezone.now() - timezone.timedelta(hours=1),
            is_active=True
        )
        return Response({
            'valid': True,
            'email': user.email,
            'user_type': user.user_type
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid or expired token'
        }, status=status.HTTP_400_BAD_REQUEST)