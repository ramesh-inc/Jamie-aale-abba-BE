import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from .messages import GENERAL_MESSAGES

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Log the exception
    if response is not None:
        logger.error(f"API Exception: {exc} - View: {context.get('view', 'Unknown')}")

    # Handle specific exceptions
    if isinstance(exc, ValidationError):
        return Response({
            'error': 'Validation failed',
            'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
        }, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, IntegrityError):
        logger.error(f"Database integrity error: {exc}")
        return Response({
            'error': 'Data integrity error. Please check your input and try again.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # If response is None, we have an unhandled exception
    if response is None:
        logger.error(f"Unhandled exception: {exc}")
        return Response({
            'error': GENERAL_MESSAGES['server_error']
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Customize the response format
    custom_response_data = {
        'error': True,
        'message': 'Request failed',
        'details': response.data
    }

    response.data = custom_response_data
    return response


def generate_unique_username(email, first_name, last_name):
    """
    Generate a unique username based on email and name
    """
    from core.models import User

    # Try email first
    base_username = email.split('@')[0]

    # If email username is not unique, try variations
    if User.objects.filter(username=base_username).exists():
        # Try first name + last name
        base_username = f"{first_name.lower()}{last_name.lower()}"

        # If still not unique, add numbers
        counter = 1
        while User.objects.filter(username=f"{base_username}{counter}").exists():
            counter += 1

        base_username = f"{base_username}{counter}"

    return base_username


def validate_user_permissions(user, required_permissions):
    """
    Validate if user has required permissions
    """
    if not user or not user.is_authenticated:
        return False

    if user.user_type == 'admin' and hasattr(user, 'admin_profile'):
        admin_permissions = user.admin_profile.permissions

        # Super admin has all permissions
        if user.admin_profile.admin_level == 'super_admin':
            return True

        # Check specific permissions
        for permission in required_permissions:
            if permission not in admin_permissions or not admin_permissions[permission]:
                return False

        return True

    return False


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def sanitize_filename(filename):
    """
    Sanitize filename for safe storage
    """
    import re
    import os

    # Get file extension
    name, ext = os.path.splitext(filename)

    # Remove special characters and spaces
    safe_name = re.sub(r'[^\w\s-]', '', name)
    safe_name = re.sub(r'[-\s]+', '-', safe_name)

    return f"{safe_name}{ext}"


def format_phone_number(phone_number):
    """
    Format phone number to standard Sri Lankan format
    """
    if not phone_number:
        return phone_number

    # Remove all non-digits
    digits_only = ''.join(filter(str.isdigit, phone_number))

    # Handle Sri Lankan numbers
    if digits_only.startswith('94'):
        return f"+{digits_only}"
    elif digits_only.startswith('0'):
        return f"+94{digits_only[1:]}"
    elif len(digits_only) == 9:
        return f"+94{digits_only}"

    return phone_number


def get_user_display_name(user):
    """
    Get user's display name in a consistent format
    """
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"
    elif user.first_name:
        return user.first_name
    elif user.last_name:
        return user.last_name
    else:
        return user.email.split('@')[0]


def create_audit_log(user, action, entity_type, entity_id=None, description="", ip_address=None):
    """
    Create audit log entry
    """
    from core.models import AuditLog

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")


def mask_email(email):
    """
    Mask email for privacy (e.g., jo***@example.com)
    """
    if not email or '@' not in email:
        return email

    local, domain = email.split('@', 1)

    if len(local) <= 2:
        masked_local = local
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]

    return f"{masked_local}@{domain}"


def generate_employee_id(prefix="EMP"):
    """
    Generate unique employee ID
    """
    from core.models import Teacher
    import random

    while True:
        # Generate 6-digit random number
        number = random.randint(100000, 999999)
        employee_id = f"{prefix}{number}"

        # Check if it's unique
        if not Teacher.objects.filter(employee_id=employee_id).exists():
            return employee_id


class ResponseFormatter:
    """
    Utility class for consistent API response formatting
    """

    @staticmethod
    def success(data=None, message="Success", status_code=status.HTTP_200_OK):
        """Format success response"""
        response_data = {
            'success': True,
            'message': message
        }
        if data is not None:
            response_data['data'] = data

        return Response(response_data, status=status_code)

    @staticmethod
    def error(message="Error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Format error response"""
        response_data = {
            'success': False,
            'message': message
        }
        if errors is not None:
            response_data['errors'] = errors

        return Response(response_data, status=status_code)

    @staticmethod
    def validation_error(errors, message="Validation failed"):
        """Format validation error response"""
        return ResponseFormatter.error(
            message=message,
            errors=errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )