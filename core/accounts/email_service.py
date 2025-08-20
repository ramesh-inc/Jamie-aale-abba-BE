import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_verification_email(user):
    """Send email verification email to user"""
    try:
        verification_url = f"http://localhost:5173/verify-email/{user.email_verification_token}"
        
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