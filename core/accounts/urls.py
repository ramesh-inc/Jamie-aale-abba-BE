from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ParentRegistrationView,
    LoginView,
    EmailVerificationView,
    ResendVerificationView,
    TeacherRegistrationView,
    TeacherListView,
    TeacherDetailView,
    TeacherPasswordResetView,
    TeacherPasswordChangeView,
    AdminRegistrationView,
    AdminListView,
    AdminDetailView,
    AdminPasswordResetView,
    DebugUserView,
    health_check,
    ProfileUpdateView,
    UserProfileView,
    ParentPasswordChangeView,
)
from .admin_password_change import AdminFirstTimePasswordChangeView
from .password_reset_views import PasswordResetRequestView, PasswordResetConfirmView, validate_reset_token

app_name = 'accounts'  # App namespace

urlpatterns = [
    # Auth endpoints (for /api/v1/auth/)
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/parent/', ParentRegistrationView.as_view(), name='auth_parent_register'),
    path('auth/verify-email/', EmailVerificationView.as_view(), name='auth_verify_email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='auth_resend_verification'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('auth/health/', health_check, name='auth_health_check'),
    
    # Parent self-service endpoints
    path('auth/parent/change-password/', ParentPasswordChangeView.as_view(), name='parent_change_password'),
    
    # Teacher self-service endpoints
    path('auth/teacher/change-password/', TeacherPasswordChangeView.as_view(), name='teacher_change_password'),
    
    # Admin self-service endpoints
    path('auth/admin/change-password/', AdminFirstTimePasswordChangeView.as_view(), name='admin_change_password'),
    
    # Profile endpoints (self-service for all user types)
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('auth/profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    
    # Password reset endpoints
    path('auth/forgot-password/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/reset-password/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/validate-reset-token/<uuid:token>/', validate_reset_token, name='validate_reset_token'),
    
    # Debug endpoint
    path('debug/user/', DebugUserView.as_view(), name='debug_user'),
    
    # Teacher Management endpoints (Admin only - for /api/v1/admin/)
    path('admin/teachers/', TeacherListView.as_view(), name='admin_teacher_list'),
    path('admin/teachers/register/', TeacherRegistrationView.as_view(), name='admin_teacher_register'),
    path('admin/teachers/<int:teacher_id>/', TeacherDetailView.as_view(), name='admin_teacher_detail'),
    path('admin/teachers/<int:teacher_id>/reset-password/', TeacherPasswordResetView.as_view(), name='admin_teacher_password_reset'),
    
    # Admin Management endpoints (Super Admin only - for /api/v1/admin/)
    path('admin/admins/', AdminListView.as_view(), name='admin_admin_list'),
    path('admin/admins/register/', AdminRegistrationView.as_view(), name='admin_admin_register'),
    path('admin/admins/<int:admin_id>/', AdminDetailView.as_view(), name='admin_admin_detail'),
    path('admin/admins/<int:admin_id>/reset-password/', AdminPasswordResetView.as_view(), name='admin_admin_password_reset'),
    
    # Legacy endpoints (for /api/accounts/)
    path('health/', health_check, name='health_check'),
    path('register/parent/', ParentRegistrationView.as_view(), name='parent_register'),
    path('verify-email/', EmailVerificationView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]