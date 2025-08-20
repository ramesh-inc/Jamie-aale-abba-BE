from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission for admin users (Admin or Super Admin)
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.user_type in ['admin', 'super_admin'] and
                hasattr(request.user, 'admin_profile') and
                request.user.admin_profile.is_active
        )


class IsSuperAdminUser(permissions.BasePermission):
    """
    Permission for super admin users only
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.user_type == 'admin' and
                hasattr(request.user, 'admin_profile') and
                request.user.admin_profile.admin_level == 'super_admin' and
                request.user.admin_profile.is_active
        )


class IsTeacherUser(permissions.BasePermission):
    """
    Permission for teacher users
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.user_type == 'teacher' and
                hasattr(request.user, 'teacher_profile') and
                request.user.teacher_profile.is_active
        )


class IsParentUser(permissions.BasePermission):
    """
    Permission for parent users
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.user_type == 'parent' and
                hasattr(request.user, 'parent_profile') and
                request.user.parent_profile.is_active
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission for resource owners or admin users
    """

    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if (request.user.user_type in ['admin'] and
                hasattr(request.user, 'admin_profile') and
                request.user.admin_profile.is_active):
            return True

        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user

        return False


class IsActiveUser(permissions.BasePermission):
    """
    Permission for active users only
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.is_active and
                request.user.email_verified
        )