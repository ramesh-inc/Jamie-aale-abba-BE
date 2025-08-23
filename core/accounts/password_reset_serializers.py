from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from core.models import User
import uuid


# Password Reset Request Serializer
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("No active account found with this email address.")
        return value.lower()


# Password Reset Confirm Serializer
class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # Validate password strength
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})
        
        return attrs

    def validate_token(self, value):
        # Check if token exists and is not expired (valid for 1 hour)
        try:
            user = User.objects.get(
                password_reset_token=value,
                password_reset_sent_at__gte=timezone.now() - timezone.timedelta(hours=1),
                is_active=True
            )
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired reset token.")
        
        # Store user instance for use in save method
        self.user = user
        return value

    def save(self):
        new_password = self.validated_data['new_password']
        
        # Update password and clear reset token
        self.user.set_password(new_password)
        self.user.password_reset_token = None
        self.user.password_reset_sent_at = None
        self.user.must_change_password = False  # Clear any password change requirement
        self.user.save()
        
        return self.user