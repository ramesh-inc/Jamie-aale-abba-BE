import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_verification_email(user):
    """Send email verification email to user"""
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5174')
        verification_url = f"{frontend_url}/verify-email/{user.email_verification_token}"
        
        message = f"""
Hi {user.first_name},

Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

Thanks,
ClassDojo Team
        """.strip()
        
        send_mail(
            subject='Verify Your ClassDojo Account',
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@classdojo.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Verification email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def send_welcome_email(user):
    """Send welcome email after verification"""
    try:
        message = f"""
Welcome to ClassDojo, {user.first_name}!

Your account has been successfully verified. You can now log in and start using ClassDojo.

Thanks,
ClassDojo Team
        """.strip()
        
        send_mail(
            subject='Welcome to ClassDojo!',
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@classdojo.com'),
            recipient_list=[user.email],
            fail_silently=True,  # Don't fail if welcome email fails
        )
        
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False


def send_password_reset_email(user):
    """Send password reset email to user"""
    try:
        # Use the configured frontend URL from settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5174')
        reset_url = f"{frontend_url}/reset-password/{user.password_reset_token}"
        
        message = f"""
Hi {user.first_name},

We received a request to reset your password for your ClassDojo account.

Please click the link below to reset your password:

{reset_url}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

Thanks,
ClassDojo Team
        """.strip()
        
        send_mail(
            subject='Reset Your ClassDojo Password',
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@classdojo.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Password reset email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False