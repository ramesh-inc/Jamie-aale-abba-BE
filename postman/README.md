# Jamie Aale Abba School Management System - Postman Collections

This directory contains Postman collections for testing the Jamie Aale Abba School Management System API endpoints.

## Collections Overview

### 1. **Jamie_Aale_Abba_Auth_API.postman_collection.json**
Authentication and registration endpoints:
- Health check
- Parent registration
- Email verification and resending
- Login and token refresh
- Password reset flow (forgot password, validate token, reset password)

### 2. **Jamie_Aale_Abba_User_Profile_API.postman_collection.json**
User profile and password management:
- Get current user profile
- Update profile information
- Change password (Parent, Teacher, Admin)
- Debug user information

### 3. **Jamie_Aale_Abba_Admin_Management_API.postman_collection.json**
Administrative endpoints (requires admin/super admin privileges):

**Teacher Management:**
- Create, list, get, update, delete teachers
- Reset teacher passwords

**Admin Management:**
- Create, list, get, update, delete admins
- Reset admin passwords

### 4. **Jamie_Aale_Abba_Class_Management_API.postman_collection.json**
Class management and student assignment endpoints (admin access only):

**Class Management:**
- Create, list, view, update, and deactivate nursery classes
- Search and filter classes by various criteria

**Student Management:**
- Create, list, view, update, and deactivate student records
- Search students and filter by class or enrollment status

**Teacher-Student Assignments:**
- View all teachers with their class assignments and student counts
- Bulk assign multiple students to teachers and classes
- Reassign students between classes
- Individual assignment and removal operations
- Manage teacher-class relationships with roles

**Dashboard Statistics:**
- Comprehensive statistics for admin dashboard
- Class utilization metrics and capacity tracking

### 5. **Jamie_Aale_Abba_Parent_Child_Management_API.postman_collection.json**
Parent child management endpoints (parent access only):

**Child Management:**
- View all children linked to parent account
- Add new child with comprehensive validation
- View detailed child information including class enrollment
- Update child information and relationship details
- Remove child from parent account (relationship management)

**Class Information:**
- View available classes for enrollment
- Request class enrollment for children (subject to admin approval)

**Dashboard & Summary:**
- Get summary statistics of children for parent dashboard
- Enrollment status and class distribution overview

### 6. **Jamie_Aale_Abba_Environment.postman_environment.json**
Pre-configured environment variables:
- `base_url`: API base URL (default: http://localhost:8000/api/v1)
- `access_token`: JWT access token (auto-populated after login)
- `refresh_token`: JWT refresh token (auto-populated after login)
- `teacher_id`: Teacher ID for testing (default: 1)
- `admin_id`: Admin ID for testing (default: 1)

## Setup Instructions

1. **Import Collections:**
   - Open Postman
   - Click "Import" button
   - Drag and drop all `.json` files from this directory
   - Or use "File" → "Import" and select the files

2. **Import Environment:**
   - Import the `Jamie_Aale_Abba_Environment.postman_environment.json` file
   - Select the environment from the dropdown in the top right

3. **Configuration:**
   - Update the `base_url` in the environment if your API runs on a different port
   - The `access_token` and `refresh_token` will be automatically set when you login

## Usage Flow

### Getting Started
1. **Health Check**: Test if the API is running
2. **Register Parent**: Create a new parent account
3. **Login**: Authenticate and get tokens (tokens are auto-saved to environment)

### Authentication Flow
```
Register → Verify Email (if needed) → Login → Access Protected Endpoints
```

### Password Reset Flow
```
Forgot Password → Check Email → Validate Reset Token → Reset Password
```

### Token Management
- The login request automatically saves tokens to environment variables
- Token refresh automatically updates the access token
- All authenticated requests use the `{{access_token}}` variable

## User Types and Permissions

### Parent
- Can update own profile
- Can change own password
- Limited to parent-specific endpoints

### Teacher
- Can update own profile
- Can change own password
- Access to teacher-specific functionality

### Admin
- Can manage teachers (CRUD operations)
- Can reset teacher passwords
- Can update own profile and change password

### Super Admin
- All admin permissions
- Can manage other admins (CRUD operations)
- Can reset admin passwords

## Example Data

### Parent Registration
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+1234567890",
    "password": "securepassword123",
    "confirm_password": "securepassword123"
}
```

### Teacher Creation (Admin only)
```json
{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@school.com",
    "phone_number": "+1234567891",
    "password": "temppassword123",
    "confirm_password": "temppassword123",
    "subjects": ["Mathematics", "Physics"],
    "employee_id": "T001",
    "qualification": "Master of Science in Mathematics",
    "experience_years": 5,
    "hire_date": "2024-01-15"
}
```

### Admin Creation (Super Admin only)
```json
{
    "first_name": "Bob",
    "last_name": "Wilson",
    "email": "bob.wilson@school.com",
    "phone_number": "+1234567892",
    "password": "tempadminpass123",
    "confirm_password": "tempadminpass123",
    "admin_level": "admin",
    "permissions": {
        "can_manage_teachers": true,
        "can_manage_students": true,
        "can_view_reports": true
    }
}
```

### Class Creation (Admin only)
```json
{
    "class_name": "Nursery 1",
    "class_code": "N1-2024",
    "age_group": "2-3 years",
    "capacity": 15,
    "room_number": "Room 101",
    "academic_year": "2024-2025",
    "is_active": true
}
```

### Student Creation (Admin only)
```json
{
    "student_name": "Emma Johnson",
    "student_id": "STU001",
    "date_of_birth": "2021-03-15",
    "gender": "female",
    "medical_conditions": "No known allergies",
    "is_active": true
}
```

### Bulk Student Assignment (Admin only)
```json
{
    "teacher_id": 1,
    "class_id": 1,
    "student_ids": [1, 2, 3],
    "role": "primary"
}
```

### Child Addition (Parent only)
```json
{
    "student_name": "Emma Johnson",
    "date_of_birth": "2021-03-15",
    "gender": "female",
    "avatar_url": "https://example.com/avatar.jpg",
    "medical_conditions": "No known allergies",
    "relationship_type": "mother",
    "is_primary_contact": true,
    "pickup_authorized": true
}
```

## Testing Tips

1. **Start with Authentication**: Always test the health check and login first
2. **Use Variables**: Leverage the environment variables for consistent testing
3. **Check Authorization**: Ensure you're logged in for protected endpoints
4. **Test Error Cases**: Try invalid data, unauthorized access, etc.
5. **Sequential Testing**: Some endpoints depend on others (e.g., create before update)

## API Base URL

Default: `http://localhost:8000/api/v1`

Update the `base_url` environment variable if your Django server runs on a different host/port.

## Support

If you encounter issues:
1. Check that the Django server is running
2. Verify the `base_url` environment variable
3. Ensure you have valid authentication tokens
4. Check the Django server logs for detailed error information