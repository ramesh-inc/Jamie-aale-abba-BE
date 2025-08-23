from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from core.models import User
from .serializers import (
    ParentRegistrationSerializer,
    LoginSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    UserProfileSerializer,
    TeacherRegistrationSerializer,
    TeacherUpdateSerializer,
    TeacherDetailSerializer,
    TeacherPasswordChangeSerializer,
    AdminRegistrationSerializer,
    AdminUpdateSerializer,
    AdminDetailSerializer,
    ParentUpdateSerializer,
    TeacherSelfUpdateSerializer,
    AdminSelfUpdateSerializer,
    ParentPasswordChangeSerializer
)
from .email_service import send_verification_email, send_welcome_email
from .permissions import IsAdminUser, IsOwnerOrAdmin
from .admin_password_change import AdminFirstTimePasswordChangeView
import logging

logger = logging.getLogger(__name__)


def get_admin_level_hierarchy():
    """Returns admin levels in hierarchical order (highest to lowest authority)"""
    return ['super_admin', 'admin', 'moderator']


def can_create_admin(current_user, target_level):
    """Check if current user can create an admin of target_level"""
    if not hasattr(current_user, 'admin_profile') or not current_user.admin_profile:
        return False
    
    current_level = current_user.admin_profile.admin_level
    
    # Super admins can create any level
    if current_level == 'super_admin':
        return True
    
    # Admins can create admins and moderators (but not super_admins)
    if current_level == 'admin' and target_level in ['admin', 'moderator']:
        return True
    
    return False


def can_view_admins(current_user):
    """Check if current user can view admin accounts"""
    if not hasattr(current_user, 'admin_profile') or not current_user.admin_profile:
        return False
    
    # Both super_admin and admin can view
    return current_user.admin_profile.admin_level in ['super_admin', 'admin']


def can_manage_admin(current_user, target_admin):
    """Check if current user can update/delete target admin"""
    if not hasattr(current_user, 'admin_profile') or not current_user.admin_profile:
        return False
    
    current_level = current_user.admin_profile.admin_level
    target_level = target_admin.admin_level
    
    # Can't manage yourself through admin endpoints (use profile endpoints instead)
    if current_user.id == target_admin.user.id:
        return False
    
    # Super admins can manage anyone except themselves
    if current_level == 'super_admin':
        return True
    
    # Admins can manage admins and moderators (but not super_admins)
    if current_level == 'admin' and target_level in ['admin', 'moderator']:
        return True
    
    return False


# Debug view to check user authentication
@method_decorator(csrf_exempt, name='dispatch')
class DebugUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        debug_info = {
            'user_id': user.id,
            'email': user.email,
            'user_type': user.user_type,
            'is_authenticated': user.is_authenticated,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'has_admin_profile': hasattr(user, 'admin_profile'),
        }
        
        if hasattr(user, 'admin_profile'):
            try:
                debug_info['admin_profile'] = {
                    'admin_level': user.admin_profile.admin_level,
                    'is_active': user.admin_profile.is_active,
                    'permissions': user.admin_profile.permissions,
                }
            except Exception as e:
                debug_info['admin_profile_error'] = str(e)
        
        # Test the exact permission logic from AdminListView
        permission_check = (user.is_authenticated and (user.is_superuser or 
                           (hasattr(user, 'admin_profile') and 
                            user.admin_profile.admin_level == 'super_admin')))
        debug_info['should_pass_admin_check'] = permission_check
        
        return Response(debug_info)


# Parent Registration
@method_decorator(csrf_exempt, name='dispatch')
class ParentRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ParentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Send verification email
                send_verification_email(user)
                
                return Response({
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'user_id': user.id,
                    'email': user.email
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Registration failed: {str(e)}")
                return Response({
                    'error': 'Registration failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Login
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Email Verification
@method_decorator(csrf_exempt, name='dispatch')
class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                user = User.objects.get(email_verification_token=token, is_email_verified=False)
                
                if user.verify_email(token):
                    send_welcome_email(user)
                    
                    # Generate JWT tokens for immediate login
                    refresh = RefreshToken.for_user(user)
                    
                    return Response({
                        'message': 'Email verified successfully! Your account is now active.',
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserProfileSerializer(user).data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Invalid or expired verification token.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({
                    'error': 'Invalid verification token.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Resend Verification
@method_decorator(csrf_exempt, name='dispatch')
class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_email_verified=False)
                
                # Check rate limiting (1 minute cooldown)
                if (user.email_verification_sent_at and 
                    timezone.now() < user.email_verification_sent_at + timezone.timedelta(minutes=1)):
                    return Response({
                        'error': 'Please wait before requesting another verification email.'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
                
                # Generate new token and send email
                user.generate_email_verification_token()
                send_verification_email(user)
                
                return Response({
                    'message': 'Verification email sent successfully.'
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response({
                    'error': 'Email not found or already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Health Check
@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)


# Teacher Management Views (Admin Only)

@method_decorator(csrf_exempt, name='dispatch')
class TeacherRegistrationView(APIView):
    """Admin-only view for registering new teachers"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Register a new teacher account (Admin only)",
        request_body=TeacherRegistrationSerializer,
        responses={
            201: openapi.Response('Teacher created successfully'),
            400: openapi.Response('Validation error'),
            403: openapi.Response('Admin permission required'),
        }
    )
    def post(self, request):
        serializer = TeacherRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                teacher_user = serializer.save()
                
                # Return teacher details
                teacher_data = TeacherDetailSerializer(teacher_user).data
                
                logger.info(f"Admin {request.user.email} created teacher account for {teacher_user.email}")
                
                return Response({
                    'message': 'Teacher account created successfully.',
                    'teacher': teacher_data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Teacher registration failed: {str(e)}")
                return Response({
                    'error': 'Teacher registration failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class TeacherListView(APIView):
    """Admin-only view for listing all teachers"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all teachers (Admin only)",
        responses={
            200: openapi.Response('List of teachers', TeacherDetailSerializer(many=True)),
            403: openapi.Response('Admin permission required'),
        }
    )
    def get(self, request):
        try:
            # Get all users with teacher type
            teachers = User.objects.filter(user_type='teacher').select_related('teacher_profile')
            
            # Serialize the data
            serializer = TeacherDetailSerializer(teachers, many=True)
            
            return Response({
                'teachers': serializer.data,
                'count': teachers.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to fetch teachers list: {str(e)}")
            return Response({
                'error': 'Failed to fetch teachers list.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class TeacherDetailView(APIView):
    """Admin-only view for teacher details and updates"""
    permission_classes = [IsAdminUser]
    
    def get_teacher(self, teacher_id):
        try:
            return User.objects.select_related('teacher_profile').get(
                id=teacher_id, 
                user_type='teacher'
            )
        except User.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get teacher details (Admin only)",
        responses={
            200: openapi.Response('Teacher details', TeacherDetailSerializer),
            404: openapi.Response('Teacher not found'),
            403: openapi.Response('Admin permission required'),
        }
    )
    def get(self, request, teacher_id):
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return Response({
                'error': 'Teacher not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TeacherDetailSerializer(teacher)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Update teacher details (Admin only)",
        request_body=TeacherUpdateSerializer,
        responses={
            200: openapi.Response('Teacher updated successfully', TeacherDetailSerializer),
            400: openapi.Response('Validation error'),
            404: openapi.Response('Teacher not found'),
            403: openapi.Response('Admin permission required'),
        }
    )
    def put(self, request, teacher_id):
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return Response({
                'error': 'Teacher not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TeacherUpdateSerializer(teacher, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_teacher = serializer.save()
                
                # Return updated teacher details
                teacher_data = TeacherDetailSerializer(updated_teacher).data
                
                logger.info(f"Admin {request.user.email} updated teacher account {updated_teacher.email}")
                
                return Response({
                    'message': 'Teacher account updated successfully.',
                    'teacher': teacher_data
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Teacher update failed: {str(e)}")
                return Response({
                    'error': 'Teacher update failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Delete/Deactivate teacher account (Admin only)",
        responses={
            200: openapi.Response('Teacher account deactivated'),
            404: openapi.Response('Teacher not found'),
            403: openapi.Response('Admin permission required'),
        }
    )
    def delete(self, request, teacher_id):
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return Response({
                'error': 'Teacher not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Deactivate instead of deleting to preserve data integrity
            teacher.is_active = False
            if hasattr(teacher, 'teacher_profile'):
                teacher.teacher_profile.is_active = False
                teacher.teacher_profile.save()
            teacher.save()
            
            logger.info(f"Admin {request.user.email} deactivated teacher account {teacher.email}")
            
            return Response({
                'message': 'Teacher account has been deactivated successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Teacher deactivation failed: {str(e)}")
            return Response({
                'error': 'Failed to deactivate teacher account.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Teacher Password Reset View (Admin Only)
@method_decorator(csrf_exempt, name='dispatch')
class TeacherPasswordResetView(APIView):
    """Admin-only view for resetting teacher passwords"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Reset teacher password (Admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, minLength=8),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=['new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response('Password reset successfully'),
            400: openapi.Response('Validation error'),
            404: openapi.Response('Teacher not found'),
            403: openapi.Response('Admin permission required'),
        }
    )
    def post(self, request, teacher_id):
        try:
            teacher = User.objects.get(id=teacher_id, user_type='teacher')
        except User.DoesNotExist:
            return Response({
                'error': 'Teacher not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not new_password or not confirm_password:
            return Response({
                'error': 'Both new_password and confirm_password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate password strength
            validate_password(new_password)
        except DjangoValidationError as e:
            return Response({
                'error': 'Password validation failed.',
                'details': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            teacher.set_password(new_password)
            teacher.save()
            
            logger.info(f"Admin {request.user.email} reset password for teacher {teacher.email}")
            
            return Response({
                'message': 'Teacher password has been reset successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset failed: {str(e)}")
            return Response({
                'error': 'Password reset failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Teacher Self-Service Password Change View
@method_decorator(csrf_exempt, name='dispatch')
class TeacherPasswordChangeView(APIView):
    """Teacher self-service password change"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Change teacher password (Teacher only)",
        request_body=TeacherPasswordChangeSerializer,
        responses={
            200: openapi.Response('Password changed successfully'),
            400: openapi.Response('Validation error'),
            403: openapi.Response('Permission denied - teachers only'),
        }
    )
    def post(self, request):
        # Only allow teachers to use this endpoint
        if request.user.user_type != 'teacher':
            return Response({
                'error': 'This endpoint is only available for teachers.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TeacherPasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                # Change password
                new_password = serializer.validated_data['new_password']
                request.user.set_password(new_password)
                request.user.save()
                
                # Mark password change as no longer required
                if hasattr(request.user, 'teacher_profile'):
                    request.user.teacher_profile.password_change_required = False
                    request.user.teacher_profile.save()
                
                logger.info(f"Teacher {request.user.email} changed their password")
                
                return Response({
                    'message': 'Password changed successfully. You can now access all teacher features.',
                    'password_change_required': False
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Password change failed for teacher {request.user.email}: {str(e)}")
                return Response({
                    'error': 'Password change failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin Management Views (Super Admin Only)

@method_decorator(csrf_exempt, name='dispatch')
class AdminRegistrationView(APIView):
    """Super Admin-only view for registering new admin accounts"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Register a new admin account (Super Admin only)",
        request_body=AdminRegistrationSerializer,
        responses={
            201: openapi.Response('Admin created successfully'),
            400: openapi.Response('Validation error'),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def post(self, request):
        # Extract target admin level from request
        target_level = request.data.get('admin_level', 'admin')
        
        # Check permissions using new hierarchy system
        if not can_create_admin(request.user, target_level):
            current_level = 'None'
            if hasattr(request.user, 'admin_profile') and request.user.admin_profile:
                current_level = request.user.admin_profile.admin_level
            return Response({
                'error': f'Insufficient permissions. Your level ({current_level}) cannot create {target_level} accounts.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        serializer = AdminRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                admin_user = serializer.save()
                
                # Return admin details
                admin_data = AdminDetailSerializer(admin_user).data
                
                logger.info(f"Super Admin {request.user.email} created admin account for {admin_user.email}")
                
                return Response({
                    'message': 'Admin account created successfully.',
                    'admin': admin_data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Admin registration failed: {str(e)}")
                return Response({
                    'error': 'Admin registration failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class AdminListView(APIView):
    """Super Admin-only view for listing all admin accounts"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="List all admin accounts (Super Admin only)",
        responses={
            200: openapi.Response('List of admins', AdminDetailSerializer(many=True)),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def get(self, request):
        # Check permissions using new hierarchy system
        if not can_view_admins(request.user):
            return Response({
                'error': 'Insufficient permissions to view admin accounts.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        try:
            # Get all users with admin type
            admins = User.objects.filter(user_type='admin').select_related('admin_profile')
            
            # Serialize the data
            serializer = AdminDetailSerializer(admins, many=True)
            
            return Response({
                'admins': serializer.data,
                'count': admins.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to fetch admins list: {str(e)}")
            return Response({
                'error': 'Failed to fetch admins list.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AdminDetailView(APIView):
    """Super Admin-only view for admin details and updates"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_admin(self, admin_id):
        try:
            return User.objects.select_related('admin_profile').get(
                id=admin_id, 
                user_type='admin'
            )
        except User.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get admin details (Super Admin only)",
        responses={
            200: openapi.Response('Admin details', AdminDetailSerializer),
            404: openapi.Response('Admin not found'),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def get(self, request, admin_id):
        # First check if they can view admins at all
        if not can_view_admins(request.user):
            return Response({
                'error': 'Insufficient permissions to view admin accounts.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        admin = self.get_admin(admin_id)
        if not admin:
            return Response({
                'error': 'Admin not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AdminDetailSerializer(admin)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Update admin details (Super Admin only)",
        request_body=AdminUpdateSerializer,
        responses={
            200: openapi.Response('Admin updated successfully', AdminDetailSerializer),
            400: openapi.Response('Validation error'),
            404: openapi.Response('Admin not found'),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def put(self, request, admin_id):
        admin = self.get_admin(admin_id)
        if not admin:
            return Response({
                'error': 'Admin not found.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check permissions using hierarchy system
        if not can_manage_admin(request.user, admin.admin_profile):
            return Response({
                'error': 'Insufficient permissions to manage this admin account.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent modification of super admin accounts by regular admins
        if (admin.is_superuser or 
            (hasattr(admin, 'admin_profile') and admin.admin_profile.admin_level == 'super_admin')):
            if not request.user.is_superuser:
                return Response({
                    'error': 'Cannot modify super admin accounts.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AdminUpdateSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_admin = serializer.save()
                
                # Return updated admin details
                admin_data = AdminDetailSerializer(updated_admin).data
                
                logger.info(f"Super Admin {request.user.email} updated admin account {updated_admin.email}")
                
                return Response({
                    'message': 'Admin account updated successfully.',
                    'admin': admin_data
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Admin update failed: {str(e)}")
                return Response({
                    'error': 'Admin update failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Delete/Deactivate admin account (Super Admin only)",
        responses={
            200: openapi.Response('Admin account deactivated'),
            404: openapi.Response('Admin not found'),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def delete(self, request, admin_id):
        admin = self.get_admin(admin_id)
        if not admin:
            return Response({
                'error': 'Admin not found.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check permissions using hierarchy system
        if not can_manage_admin(request.user, admin.admin_profile):
            return Response({
                'error': 'Insufficient permissions to manage this admin account.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent deletion of super admin accounts and self-deletion
        if (admin.is_superuser or 
            (hasattr(admin, 'admin_profile') and admin.admin_profile.admin_level == 'super_admin')):
            return Response({
                'error': 'Cannot deactivate super admin accounts.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if admin.id == request.user.id:
            return Response({
                'error': 'Cannot deactivate your own account.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Deactivate instead of deleting to preserve data integrity
            admin.is_active = False
            if hasattr(admin, 'admin_profile'):
                admin.admin_profile.is_active = False
                admin.admin_profile.save()
            admin.save()
            
            logger.info(f"Super Admin {request.user.email} deactivated admin account {admin.email}")
            
            return Response({
                'message': 'Admin account has been deactivated successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Admin deactivation failed: {str(e)}")
            return Response({
                'error': 'Failed to deactivate admin account.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin Password Reset View (Super Admin Only)
@method_decorator(csrf_exempt, name='dispatch')
class AdminPasswordResetView(APIView):
    """Super Admin-only view for resetting admin passwords"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Reset admin password (Super Admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, minLength=8),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=['new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response('Password reset successfully'),
            400: openapi.Response('Validation error'),
            404: openapi.Response('Admin not found'),
            403: openapi.Response('Super Admin permission required'),
        }
    )
    def post(self, request, admin_id):
        try:
            admin = User.objects.select_related('admin_profile').get(id=admin_id, user_type='admin')
        except User.DoesNotExist:
            return Response({
                'error': 'Admin not found.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check permissions using hierarchy system
        if not can_manage_admin(request.user, admin.admin_profile):
            return Response({
                'error': 'Insufficient permissions to reset this admin password.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent password reset of super admin accounts and self
        if (admin.is_superuser or 
            (hasattr(admin, 'admin_profile') and admin.admin_profile.admin_level == 'super_admin')):
            if not request.user.is_superuser or admin.id == request.user.id:
                return Response({
                    'error': 'Cannot reset super admin passwords or your own password.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not new_password or not confirm_password:
            return Response({
                'error': 'Both new_password and confirm_password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate password strength
            validate_password(new_password)
        except DjangoValidationError as e:
            return Response({
                'error': 'Password validation failed.',
                'details': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            admin.set_password(new_password)
            admin.save()
            
            logger.info(f"Super Admin {request.user.email} reset password for admin {admin.email}")
            
            return Response({
                'message': 'Admin password has been reset successfully.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset failed: {str(e)}")
            return Response({
                'error': 'Password reset failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Self-Service Profile Update Views

@method_decorator(csrf_exempt, name='dispatch')
class ProfileUpdateView(APIView):
    """Self-service profile update for all user types"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Update user profile (self-service)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING),
                'subjects': openapi.Schema(type=openapi.TYPE_STRING, description="For teachers only"),
                'qualification': openapi.Schema(type=openapi.TYPE_STRING, description="For teachers only"),
            }
        ),
        responses={
            200: openapi.Response('Profile updated successfully', UserProfileSerializer),
            400: openapi.Response('Validation error'),
        }
    )
    def put(self, request):
        user = request.user
        
        # Choose serializer based on user type
        if user.user_type == 'parent':
            serializer = ParentUpdateSerializer(user, data=request.data, partial=True)
        elif user.user_type == 'teacher':
            serializer = TeacherSelfUpdateSerializer(user, data=request.data, partial=True)
        elif user.user_type == 'admin':
            serializer = AdminSelfUpdateSerializer(user, data=request.data, partial=True)
        else:
            return Response({
                'error': 'Invalid user type.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if serializer.is_valid():
            try:
                updated_user = serializer.save()
                
                # Return updated user profile
                profile_data = UserProfileSerializer(updated_user).data
                
                logger.info(f"User {user.email} updated their profile")
                
                return Response({
                    'message': 'Profile updated successfully.',
                    'user': profile_data
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Profile update failed for user {user.email}: {str(e)}")
                return Response({
                    'error': 'Profile update failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class UserProfileView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get current user profile",
        responses={
            200: openapi.Response('User profile', UserProfileSerializer),
        }
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ParentPasswordChangeView(APIView):
    """Password change for parents"""
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Change password for parent users",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'current_password': openapi.Schema(type=openapi.TYPE_STRING),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, minLength=8),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING, minLength=8),
            },
            required=['current_password', 'new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response('Password changed successfully'),
            400: openapi.Response('Validation error'),
            403: openapi.Response('Access denied - parent only'),
        }
    )
    def post(self, request):
        user = request.user
        
        # Ensure user is a parent
        if user.user_type != 'parent':
            return Response({
                'error': 'This endpoint is only for parent users.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ParentPasswordChangeSerializer(data=request.data)
        
        if serializer.is_valid():
            current_password = serializer.validated_data['current_password']
            new_password = serializer.validated_data['new_password']
            
            # Verify current password
            if not user.check_password(current_password):
                return Response({
                    'error': 'Current password is incorrect.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Set new password
                user.set_password(new_password)
                user.save()
                
                logger.info(f"Parent {user.email} changed their password")
                
                return Response({
                    'message': 'Password changed successfully.'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Password change failed for parent {user.email}: {str(e)}")
                return Response({
                    'error': 'Password change failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)