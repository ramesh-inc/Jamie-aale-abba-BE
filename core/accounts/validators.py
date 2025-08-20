import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class CustomPasswordValidator:
    """
    Custom password validator for nursery system
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """

    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError(
                _("Password must be at least 8 characters long."),
                code='password_too_short',
            )

        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter."),
                code='password_no_upper',
            )

        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least one lowercase letter."),
                code='password_no_lower',
            )

        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least one digit."),
                code='password_no_digit',
            )

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("Password must contain at least one special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 8 characters including "
            "one uppercase letter, one lowercase letter, one digit, "
            "and one special character."
        )


def validate_phone_number(value):
    """Validate Sri Lankan phone number format"""
    phone_pattern = r'^(\+94|0)[0-9]{9}$'
    if not re.match(phone_pattern, value):
        raise ValidationError(
            _('Enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567).'),
            code='invalid_phone'
        )


def validate_name(value):
    """Validate name contains only letters and spaces"""
    if not re.match(r'^[a-zA-Z\s]+$', value):
        raise ValidationError(
            _('Name can only contain letters and spaces.'),
            code='invalid_name'
        )