# Import models from the main core.models
# This prevents model conflicts and ensures a single source of truth

from core.models import (
    User,
    Parent, 
    Teacher,
    Admin,
    # PasswordResetToken
)

# All user-related models are now defined in core/models.py
# This file just imports them for backward compatibility
