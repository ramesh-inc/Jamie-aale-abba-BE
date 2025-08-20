from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
from core.models import Parent, Teacher, Admin
from .email_service import send_verification_email

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model functionality"""

    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'TestPass123!',
            'user_type': 'parent'
        }

    def test_create_user(self):
        """Test user creation"""
        user = User.objects.create_user(
            username=self.user_data['email'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            user_type=self.user_data['user_type']
        )

        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.user_type, 'parent')
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)
        self.assertTrue(user.check_password(self.user_data['password']))

    def test_get_full_name(self):
        """Test get_full_name method"""
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            first_name='John',
            last_name='Doe',
            password='TestPass123!'
        )
        self.assertEqual(user.get_full_name(), 'John Doe')

    def test_email_verification_token_generation(self):
        """Test email verification token generation"""
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!'
        )

        token = user.generate_email_verification_token()
        self.assertIsNotNone(token)
        self.assertIsNotNone(user.email_verification_sent_at)

    def test_email_verification_expiry(self):
        """Test email verification token expiry"""
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!'
        )

        # New token should not be expired
        user.generate_email_verification_token()
        self.assertFalse(user.is_email_verification_expired())


class ParentRegistrationTest(APITestCase):
    """Test parent registration endpoint"""

    def setUp(self):
        self.register_url = reverse('auth:parent_register')
        self.valid_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'parent@example.com',
            'phone_number': '+94771234567',
            'preferred_language': 'en',
            'password': 'TestPass123!',
            'confirm_password': 'TestPass123!',
            'occupation': 'Engineer',
            'emergency_contact': '+94771234568',
            'address': '123 Main St, Colombo'
        }

    @patch('accounts.email_service.send_verification_email')
    def test_successful_parent_registration(self, mock_send_email):
        """Test successful parent registration"""
        mock_send_email.return_value = True

        response = self.client.post(self.register_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user_id', response.data)
        self.assertIn('email', response.data)

        # Check user was created
        user = User.objects.get(email=self.valid_data['email'])
        self.assertEqual(user.user_type, 'parent')
        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)

        # Check parent profile was created
        self.assertTrue(hasattr(user, 'parent_profile'))
        self.assertEqual(user.parent_profile.occupation, 'Engineer')

        # Check email was sent
        mock_send_email.assert_called_once()

    def test_duplicate_email_registration(self):
        """Test registration with duplicate email"""
        # Create existing user
        User.objects.create_user(
            username='parent@example.com',
            email='parent@example.com',
            password='TestPass123!'
        )

        response = self.client.post(self.register_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_password_mismatch(self):
        """Test registration with password mismatch"""
        data = self.valid_data.copy()
        data['confirm_password'] = 'DifferentPass123!'

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_invalid_phone_number(self):
        """Test registration with invalid phone number"""
        data = self.valid_data.copy()
        data['phone_number'] = 'invalid-phone'

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_weak_password(self):
        """Test registration with weak password"""
        data = self.valid_data.copy()
        data['password'] = 'weak'
        data['confirm_password'] = 'weak'

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class EmailVerificationTest(APITestCase):
    """Test email verification endpoint"""

    def setUp(self):
        self.verify_url = reverse('auth:verify_email')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            user_type='parent'
        )
        self.token = self.user.generate_email_verification_token()

    def test_successful_email_verification(self):
        """Test successful email verification"""
        data = {'token': str(self.token)}

        response = self.client.post(self.verify_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)

        # Check user was activated
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)
        self.assertTrue(self.user.is_active)
        self.assertIsNone(self.user.email_verification_token)

    def test_invalid_verification_token(self):
        """Test verification with invalid token"""
        data = {'token': 'invalid-token'}

        response = self.client.post(self.verify_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('token', response.data)

    def test_already_verified_user(self):
        """Test verification of already verified user"""
        # Verify user first
        self.user.email_verified = True
        self.user.save()

        data = {'token': str(self.token)}

        response = self.client.post(self.verify_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthenticationTest(APITestCase):
    """Test JWT authentication"""

    def setUp(self):
        self.login_url = reverse('auth:token_obtain_pair')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            is_active=True,
            email_verified=True
        )

    def test_successful_login(self):
        """Test successful login"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_with_unverified_email(self):
        """Test login with unverified email"""
        self.user.email_verified = False
        self.user.save()

        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        }

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class TeacherRegistrationTest(APITestCase):
    """Test teacher registration by admin"""

    def setUp(self):
        self.register_url = reverse('auth:teacher_register')

        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='AdminPass123!',
            user_type='admin',
            is_active=True,
            email_verified=True
        )

        # Create admin profile
        Admin.objects.create(
            user=self.admin_user,
            admin_level='admin'
        )

        self.valid_data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'teacher@example.com',
            'phone_number': '+94771234567',
            'preferred_language': 'en',
            'password': 'TeacherPass123!',
            'confirm_password': 'TeacherPass123!',
            'employee_id': 'TCH001',
            'qualification': 'B.Ed in Early Childhood',
            'experience_years': 5,
        }

    def test_admin_can_register_teacher(self):
        """Test admin can register teacher"""
        # Login as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(self.register_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check teacher was created
        user = User.objects.get(email=self.valid_data['email'])
        self.assertEqual(user.user_type, 'teacher')
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)

        # Check teacher profile
        self.assertTrue(hasattr(user, 'teacher_profile'))
        self.assertEqual(user.teacher_profile.employee_id, 'TCH001')

    def test_non_admin_cannot_register_teacher(self):
        """Test non-admin cannot register teacher"""
        # Create regular parent user
        parent_user = User.objects.create_user(
            username='parent@example.com',
            email='parent@example.com',
            password='ParentPass123!',
            user_type='parent',
            is_active=True,
            email_verified=True
        )

        # Login as parent
        refresh = RefreshToken.for_user(parent_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(self.register_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_employee_id(self):
        """Test registration with duplicate employee ID"""
        # Create existing teacher
        existing_user = User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='ExistingPass123!',
            user_type='teacher'
        )
        Teacher.objects.create(
            user=existing_user,
            employee_id='TCH001'
        )

        # Login as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(self.register_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('employee_id', response.data)


class UserProfileTest(APITestCase):
    """Test user profile endpoint"""

    def setUp(self):
        self.profile_url = reverse('auth:user_profile')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User',
            user_type='parent',
            is_active=True,
            email_verified=True
        )

    def test_authenticated_user_can_get_profile(self):
        """Test authenticated user can get their profile"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['full_name'], 'Test User')
        self.assertEqual(response.data['user_type'], 'parent')

    def test_unauthenticated_user_cannot_get_profile(self):
        """Test unauthenticated user cannot get profile"""
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ResendVerificationTest(APITestCase):
    """Test resend verification email endpoint"""

    def setUp(self):
        self.resend_url = reverse('auth:resend_verification')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!',
            email_verified=False
        )

    @patch('accounts.email_service.send_verification_email')
    def test_resend_verification_email(self, mock_send_email):
        """Test resending verification email"""
        mock_send_email.return_value = True

        data = {'email': 'test@example.com'}
        response = self.client.post(self.resend_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        mock_send_email.assert_called_once()

    def test_resend_for_verified_user(self):
        """Test resend for already verified user"""
        self.user.email_verified = True
        self.user.save()

        data = {'email': 'test@example.com'}
        response = self.client.post(self.resend_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_resend_for_nonexistent_email(self):
        """Test resend for non-existent email"""
        data = {'email': 'nonexistent@example.com'}
        response = self.client.post(self.resend_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)