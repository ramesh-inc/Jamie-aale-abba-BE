# Teacher Authentication API Testing Guide

This guide explains how to use the Postman collection to test teacher login and password change functionality.

## Files Included

1. **Teacher_Auth_API.postman_collection.json** - Main collection with all test requests
2. **Teacher_Auth_Environment.postman_environment.json** - Environment variables
3. **Teacher_Auth_Testing_Guide.md** - This guide

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click "Import" button
3. Import both JSON files:
   - `Teacher_Auth_API.postman_collection.json`
   - `Teacher_Auth_Environment.postman_environment.json`
4. Select the "Teacher Auth Environment" from the environment dropdown

### 2. Configure Environment Variables

Before running tests, update these variables in the environment:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `base_url` | Backend server URL | `http://127.0.0.1:8000` |
| `teacher_email` | Valid teacher email | `teacher@school.com` |
| `teacher_password` | Current teacher password | `CurrentPass123!` |
| `teacher_initial_password` | Initial password from admin | `TempPass123!` |
| `teacher_new_password` | New password for testing | `NewSecurePass123!` |

### 3. Prerequisites

- Django backend server running on port 8000
- At least one teacher account exists in the database
- Teacher account should have `password_change_required=True` for first login flow testing

## Test Scenarios

### A. Authentication Tests

#### 1. Teacher Login
- **Endpoint**: `POST /api/v1/auth/login/`
- **Purpose**: Test successful teacher login
- **Auto-actions**: Stores access/refresh tokens and checks password change requirement

#### 2. Teacher Login - Invalid Credentials
- **Purpose**: Test login with wrong email/password
- **Expected**: 400 status with error message

#### 3. Teacher Login - Wrong User Type
- **Purpose**: Test parent trying to login as teacher
- **Expected**: 400 status with user type mismatch error

### B. Password Management Tests

#### 1. Teacher Change Password
- **Endpoint**: `POST /api/v1/auth/teacher/change-password/`
- **Purpose**: Test successful password change
- **Requires**: Valid access token from login
- **Auto-actions**: Updates environment with new password

#### 2. Teacher Change Password - Wrong Current Password
- **Purpose**: Test password change with incorrect current password
- **Expected**: 400 status with current password error

#### 3. Teacher Change Password - Password Mismatch
- **Purpose**: Test when new password and confirm password don't match
- **Expected**: 400 status with confirm password error

#### 4. Teacher Change Password - Weak Password
- **Purpose**: Test password strength validation
- **Expected**: 400 status with password validation errors

### C. Token Management

#### 1. Refresh Token
- **Endpoint**: `POST /api/v1/auth/refresh/`
- **Purpose**: Test JWT token refresh
- **Auto-actions**: Updates access token

### D. Complete First Login Flow

This folder contains a complete sequence for testing the teacher first login experience:

1. **Login with Initial Password** - Teacher logs in with admin-assigned password
2. **Change Password** - Teacher changes password (required on first login)
3. **Login with New Password** - Verify new password works and requirement is cleared

## Running Tests

### Individual Tests
1. Select any request from the collection
2. Click "Send"
3. Check the "Test Results" tab for automated assertions

### Full Flow Testing
1. Run the "Complete Teacher First Login Flow" folder in sequence:
   - Right-click folder → "Run collection"
   - Or run requests one by one in order

### Automated Testing
The collection includes test scripts that:
- Automatically store tokens and user data
- Verify response structure and status codes
- Check business logic (password change requirements)
- Update environment variables for subsequent requests

## Expected API Responses

### Successful Login Response
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "teacher@school.com",
        "first_name": "John",
        "last_name": "Teacher",
        "user_type": "teacher",
        "teacher_profile": {
            "employee_id": "TCH001",
            "password_change_required": true,
            "subjects": "Mathematics"
        }
    }
}
```

### Successful Password Change Response
```json
{
    "message": "Password changed successfully. You can now access all teacher features.",
    "password_change_required": false
}
```

### Error Response Examples
```json
// Invalid credentials
{
    "non_field_errors": ["Invalid email or password."]
}

// Wrong current password
{
    "current_password": ["Current password is incorrect."]
}

// Password mismatch
{
    "confirm_password": ["New passwords do not match."]
}

// User type mismatch
{
    "error": "This account is registered as a Parent. Please login as a Teacher.",
    "user_type_mismatch": true,
    "actual_user_type": "parent",
    "expected_user_type": "teacher"
}
```

## Troubleshooting

### Common Issues

1. **"Access token required" error**
   - Run the "Teacher Login" request first
   - Check if login was successful and token was stored

2. **"User not found" errors**
   - Verify teacher account exists in database
   - Check email address in environment variables

3. **Password change not working**
   - Ensure you're using the correct current password
   - Check if teacher account requires password change

4. **Server connection errors**
   - Verify Django server is running on correct port
   - Check `base_url` in environment variables

### Creating Test Data

If you need to create a teacher account for testing:

```python
# Django shell commands
python manage.py shell

# Create a teacher user
from core.models import User, Teacher
from django.contrib.auth.hashers import make_password

user = User.objects.create(
    username="teacher@school.com",
    email="teacher@school.com",
    first_name="John",
    last_name="Teacher",
    user_type="teacher",
    password=make_password("TempPass123!"),
    is_active=True,
    is_email_verified=True
)

Teacher.objects.create(
    user=user,
    employee_id="TCH001",
    subjects="Mathematics",
    password_change_required=True  # For first login testing
)
```

## Test Coverage

This collection covers:
- ✅ Teacher authentication flow
- ✅ Password change requirements
- ✅ Token management
- ✅ Error handling for invalid credentials
- ✅ User type validation
- ✅ Password strength validation
- ✅ First login workflow
- ✅ JWT token refresh

## Notes

- Tokens are automatically managed by the test scripts
- Environment variables are updated after successful operations
- All requests include proper error handling tests
- The collection is designed to be run multiple times safely