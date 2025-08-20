"""
Message constants for multilingual support
All user-facing messages should be defined here for easy translation
"""

# Registration Messages
REGISTRATION_MESSAGES = {
    # Success messages
    'registration_success': 'Account created successfully! Please check your email to verify your account.',
    'email_verification_success': 'Email verified successfully! Your account is now active.',
    'verification_email_sent': 'Verification email sent successfully.',

    # Error messages
    'email_exists': 'An account with this email address already exists.',
    'passwords_dont_match': 'Passwords do not match.',
    'employee_id_exists': 'An employee with this ID already exists.',
    'verification_expired': 'Email verification token has expired. Please request a new one.',
    'invalid_verification_token': 'Invalid verification token.',
    'email_not_found_or_verified': 'Email not found or already verified.',
    'account_inactive': 'Your account is inactive. Please verify your email first.',
    'account_not_verified': 'Please verify your email before logging in.',

    # Validation messages
    'invalid_email': 'Enter a valid email address.',
    'required_field': 'This field is required.',
    'invalid_phone': 'Enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567).',
    'invalid_name': 'Name can only contain letters and spaces.',

    # Email subject lines
    'email_verification_subject': 'Verify your ClassDojo account',
    'welcome_subject': 'Welcome to ClassDojo!',
    'password_reset_subject': 'Reset your ClassDojo password',
}

# Authentication Messages
AUTH_MESSAGES = {
    'login_success': 'Logged in successfully.',
    'logout_success': 'Logged out successfully.',
    'invalid_credentials': 'Invalid email or password.',
    'account_disabled': 'This account has been disabled.',
    'account_inactive': 'Your account is inactive. Please verify your email first.',
    'account_not_verified': 'Please verify your email before logging in.',
    'token_expired': 'Authentication token has expired.',
    'token_invalid': 'Invalid authentication token.',
    'unauthorized': 'Authentication credentials were not provided.',
    'permission_denied': 'You do not have permission to perform this action.',
}

# General Messages
GENERAL_MESSAGES = {
    'success': 'Operation completed successfully.',
    'error': 'An error occurred. Please try again.',
    'not_found': 'The requested resource was not found.',
    'bad_request': 'Invalid request data.',
    'server_error': 'Internal server error. Please try again later.',
    'maintenance': 'System is under maintenance. Please try again later.',
}

# Form Labels (for future frontend integration)
FORM_LABELS = {
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email Address',
    'phone_number': 'Mobile Number',
    'preferred_language': 'Preferred Language',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'occupation': 'Occupation',
    'emergency_contact': 'Emergency Contact',
    'address': 'Address',
    'employee_id': 'Employee ID',
    'qualification': 'Qualification',
    'experience_years': 'Years of Experience',
    'hire_date': 'Hire Date',
    'admin_level': 'Admin Level',
}

# Form Placeholders
FORM_PLACEHOLDERS = {
    'first_name': 'Enter your first name',
    'last_name': 'Enter your last name',
    'email': 'Enter your email address',
    'phone_number': 'Enter your mobile number',
    'password': 'Enter a secure password',
    'confirm_password': 'Confirm your password',
    'occupation': 'Enter your occupation',
    'emergency_contact': 'Enter emergency contact number',
    'address': 'Enter your address',
    'employee_id': 'Enter employee ID',
    'qualification': 'Enter qualifications',
    'experience_years': 'Enter years of experience',
}

# User Types
USER_TYPE_LABELS = {
    'parent': 'Parent',
    'teacher': 'Teacher',
    'admin': 'Admin',
}

# Language Options
LANGUAGE_LABELS = {
    'en': 'English',
    'si': 'Sinhala',
    'ta': 'Tamil',
}