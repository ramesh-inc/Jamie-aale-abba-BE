import secrets
import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from celery import shared_task
from core.models import User, EmailVerificationToken, PasswordResetToken, UserActivity
from .utils import get_client_ip, get_user_agent


class UserService:
    """Service class for user-related operations"""

    @staticmethod
    def create_user(validated_data, request=None):
        """Create a new user and handle post-creation tasks"""
        user = User.objects.create_user(**validated_data)

        # Log signup activity
        if request:
            ActivityService.log_activity(
                user=user,
                activity_type='signup',
                request=request,
                metadata={'role': user.role}
            )

        # Send verification email
        EmailService.send_verification_email(user)

        return user

    @staticmethod
    def verify_email(token):
        """Verify user email with token"""
        try:
            verification_token = EmailVerificationToken.objects.get(
                token=token,
                is_used=False
            )

            if verification_token.is_expired():
                return False, "Verification token has expired. Please request a new one."

            # Mark token as used
            verification_token.is_used = True
            verification_token.save()

            # Activate user and mark email as verified
            user = verification_token.user
            user.is_email_verified = True
            user.is_active = True
            user.save()

            # Log email verification activity
            ActivityService.log_activity(
                user=user,
                activity_type='email_verification',
                metadata={'verification_method': 'email_token'}
            )

            return True, "Email verified successfully!"

        except EmailVerificationToken.DoesNotExist:
            return False, "Invalid verification token."

    @staticmethod
    def login_user(user, request, remember_me=False):
        """Login user and handle post-login tasks"""
        # Set session expiry based on remember_me
        if remember_me:
            request.session.set_expiry(30 * 24 * 60 * 60)  # 30 days
        else:
            request.session.set_expiry(0)  # Browser close

        # Update last login IP
        user.last_login_ip = get_client_ip(request)
        user.save(update_fields=['last_login_ip'])

        # Login user
        login(request, user)

        # Log login activity
        ActivityService.log_activity(
            user=user,
            activity_type='login',
            request=request,
            metadata={'remember_me': remember_me}
        )

        return user

    @staticmethod
    def logout_user(user, request):
        """Logout user and handle post-logout tasks"""
        # Log logout activity
        ActivityService.log_activity(
            user=user,
            activity_type='logout',
            request=request
        )

        # Logout user
        logout(request)

    @staticmethod
    def change_password(user, new_password, request=None):
        """Change user password"""
        user.set_password(new_password)
        user.save()

        # Log password change activity
        if request:
            ActivityService.log_activity(
                user=user,
                activity_type='password_change',
                request=request
            )

        return user


class EmailService:
    """Service class for email-related operations"""

    @staticmethod
    def generate_verification_token(user):
        """Generate and save email verification token"""
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(
            hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS
        )

        # Invalidate old tokens
        EmailVerificationToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)

        # Create new token
        verification_token = EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        return verification_token

    @staticmethod
    def send_verification_email(user):
        """Send email verification email"""
        verification_token = EmailService.generate_verification_token(user)

        # Send email asynchronously
        send_verification_email_task.delay(
            user_id=str(user.id),
            token=verification_token.token,
            user_email=user.email,
            user_name=user.full_name
        )

        # Update user verification sent timestamp
        user.email_verification_sent_at = timezone.now()
        user.save(update_fields=['email_verification_sent_at'])

        return verification_token

    @staticmethod
    def generate_password_reset_token(user):
        """Generate and save password reset token"""
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(
            hours=settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS
        )

        # Invalidate old tokens
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)

        # Create new token
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

        return reset_token

    @staticmethod
    def send_password_reset_email(user):
        """Send password reset email"""
        reset_token = EmailService.generate_password_reset_token(user)

        # Send email asynchronously
        send_password_reset_email_task.delay(
            user_id=str(user.id),
            token=reset_token.token,
            user_email=user.email,
            user_name=user.full_name
        )

        return reset_token

    @staticmethod
    def reset_password_with_token(token, new_password):
        """Reset password using token"""
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                is_used=False
            )

            if reset_token.is_expired():
                return False, "Password reset token has expired. Please request a new one."

            # Mark token as used
            reset_token.is_used = True
            reset_token.save()

            # Update user password
            user = reset_token.user
            user.set_password(new_password)
            user.save()

            # Log password reset activity
            ActivityService.log_activity(
                user=user,
                activity_type='password_reset',
                metadata={'reset_method': 'email_token'}
            )

            return True, "Password reset successfully!"

        except PasswordResetToken.DoesNotExist:
            return False, "Invalid password reset token."


class ActivityService:
    """Service class for user activity tracking"""

    @staticmethod
    def log_activity(user, activity_type, request=None, metadata=None):
        """Log user activity"""
        activity_data = {
            'user': user,
            'activity_type': activity_type,
            'metadata': metadata or {}
        }

        if request:
            activity_data.update({
                'ip_address': get_client_ip(request),
                'user_agent': get_user_agent(request)
            })

        return UserActivity.objects.create(**activity_data)

    @staticmethod
    def get_user_activities(user, activity_type=None, limit=50):
        """Get user activities with optional filtering"""
        queryset = UserActivity.objects.filter(user=user)

        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)

        return queryset.order_by('-created_at')[:limit]


# Celery tasks for async email sending
@shared_task
def send_verification_email_task(user_id, token, user_email, user_name):
    """Async task to send verification email"""
    try:
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

        subject = "Verify your Jamie Aale Abba - LMS account"
        html_message = render_to_string('emails/verification_email.html', {
            'user_name': user_name,
            'verification_url': verification_url,
            'expiry_hours': settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )

        return f"Verification email sent to {user_email}"

    except Exception as e:
        # Log error (you might want to use proper logging here)
        print(f"Error sending verification email: {str(e)}")
        return f"Error sending email: {str(e)}"


@shared_task
def send_password_reset_email_task(user_id, token, user_email, user_name):
    """Async task to send password reset email"""
    try:
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"

        subject = "Reset your Jamie Aale Abba - LMS password"
        html_message = render_to_string('emails/password_reset_email.html', {
            'user_name': user_name,
            'reset_url': reset_url,
            'expiry_hours': settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )

        return f"Password reset email sent to {user_email}"

    except Exception as e:
        # Log error
        print(f"Error sending password reset email: {str(e)}")
        return f"Error sending email: {str(e)}"


@shared_task
def send_welcome_email_task(user_id, user_email, user_name):
    """Async task to send welcome email after email verification"""
    try:
        subject = "Welcome to Jamie Aale Abba - LMS!"
        html_message = render_to_string('emails/welcome_email.html', {
            'user_name': user_name,
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )

        return f"Welcome email sent to {user_email}"

    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        return f"Error sending email: {str(e)}"