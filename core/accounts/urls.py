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
from .class_management_views import (
    ClassListCreateView,
    ClassDetailView,
    StudentListCreateView,
    StudentDetailView,
    TeacherStudentAssignmentView,
    assign_students_to_teacher,
    reassign_students,
    remove_student_assignment,
    assign_teacher_to_class,
    remove_teacher_from_class,
    dashboard_statistics,
)
from .teacher_views import (
    get_teacher_classes,
    get_class_students,
    get_class_students_with_parents,
    mark_attendance,
    get_attendance,
    get_marked_attendance_dates,
    record_learning_activity,
    get_teacher_activities,
)
from .parent_child_views import (
    ParentChildrenListView,
    AddChildView,
    ChildDetailView,
    get_available_classes,
    get_child_summary,
    remove_child_relationship,
    request_class_enrollment,
    get_child_learning_activities,
    get_child_attendance_data,
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
    
    # Teacher class management endpoints (for /api/v1/teacher/)
    path('teacher/my-classes/', get_teacher_classes, name='get_teacher_classes'),
    path('teacher/classes/<int:class_id>/students/', get_class_students, name='get_class_students'),
    path('teacher/classes/<int:class_id>/students-with-parents/', get_class_students_with_parents, name='get_class_students_with_parents'),
    
    # Teacher attendance endpoints (for /api/v1/teacher/)
    path('teacher/attendance/mark/', mark_attendance, name='teacher_attendance_mark'),
    path('teacher/attendance/', get_attendance, name='teacher_attendance_get'),
    path('teacher/classes/<int:class_id>/marked-dates/', get_marked_attendance_dates, name='teacher_marked_attendance_dates'),
    
    # Teacher learning activities endpoints (for /api/v1/teacher/)
    path('teacher/learning-activities/record/', record_learning_activity, name='teacher_record_learning_activity'),
    path('teacher/learning-activities/', get_teacher_activities, name='teacher_get_activities'),
    
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
    
    # Class Management endpoints (Admin only - for /api/v1/admin/)
    path('admin/classes/', ClassListCreateView.as_view(), name='admin_class_list'),
    path('admin/classes/<int:pk>/', ClassDetailView.as_view(), name='admin_class_detail'),
    path('admin/students/', StudentListCreateView.as_view(), name='admin_student_list'),
    path('admin/students/<int:pk>/', StudentDetailView.as_view(), name='admin_student_detail'),
    
    # Teacher-Student Assignment endpoints (Admin only)
    path('admin/teacher-assignments/', TeacherStudentAssignmentView.as_view(), name='admin_teacher_assignments'),
    path('admin/assign-students/', assign_students_to_teacher, name='admin_assign_students'),
    path('admin/reassign-students/', reassign_students, name='admin_reassign_students'),
    path('admin/remove-student-assignment/<int:student_id>/', remove_student_assignment, name='admin_remove_student'),
    path('admin/assign-teacher-to-class/', assign_teacher_to_class, name='admin_assign_teacher_class'),
    path('admin/remove-teacher-from-class/<int:teacher_id>/<int:class_id>/', remove_teacher_from_class, name='admin_remove_teacher_class'),
    
    # Dashboard statistics (Admin only)
    path('admin/dashboard-stats/', dashboard_statistics, name='admin_dashboard_stats'),
    
    # Parent Child Management endpoints (Parent only - for /api/v1/parent/)
    path('parent/children/', ParentChildrenListView.as_view(), name='parent_children_list'),
    path('parent/children/add/', AddChildView.as_view(), name='parent_add_child'),
    path('parent/children/<int:pk>/', ChildDetailView.as_view(), name='parent_child_detail'),
    path('parent/children/<int:child_id>/remove/', remove_child_relationship, name='parent_remove_child'),
    path('parent/children/<int:child_id>/request-enrollment/', request_class_enrollment, name='parent_request_enrollment'),
    path('parent/children/<int:child_id>/learning-activities/', get_child_learning_activities, name='parent_child_learning_activities'),
    path('parent/children/<int:child_id>/attendance/', get_child_attendance_data, name='parent_child_attendance'),
    path('parent/children/summary/', get_child_summary, name='parent_child_summary'),
    path('parent/available-classes/', get_available_classes, name='parent_available_classes'),
]