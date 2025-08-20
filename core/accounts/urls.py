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
    health_check,
)

app_name = 'accounts'  # App namespace

urlpatterns = [
    # Auth endpoints (for /api/v1/auth/)
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/parent/', ParentRegistrationView.as_view(), name='auth_parent_register'),
    path('auth/verify-email/', EmailVerificationView.as_view(), name='auth_verify_email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='auth_resend_verification'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('auth/health/', health_check, name='auth_health_check'),
    
    # Teacher self-service endpoints
    path('auth/teacher/change-password/', TeacherPasswordChangeView.as_view(), name='teacher_change_password'),
    
    # Teacher Management endpoints (Admin only - for /api/v1/admin/)
    path('admin/teachers/', TeacherListView.as_view(), name='admin_teacher_list'),
    path('admin/teachers/register/', TeacherRegistrationView.as_view(), name='admin_teacher_register'),
    path('admin/teachers/<int:teacher_id>/', TeacherDetailView.as_view(), name='admin_teacher_detail'),
    path('admin/teachers/<int:teacher_id>/reset-password/', TeacherPasswordResetView.as_view(), name='admin_teacher_password_reset'),
    
    # Legacy endpoints (for /api/accounts/)
    path('health/', health_check, name='health_check'),
    path('register/parent/', ParentRegistrationView.as_view(), name='parent_register'),
    path('verify-email/', EmailVerificationView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]