# accounts/management/commands/create_superuser.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.accounts.models import Admin

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser with admin profile'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address')
        parser.add_argument('--password', type=str, help='Password')
        parser.add_argument('--first-name', type=str, help='First name')
        parser.add_argument('--last-name', type=str, help='Last name')

    def handle(self, *args, **options):
        email = options.get('email') or input('Email: ')
        password = options.get('password') or input('Password: ')
        first_name = options.get('first_name') or input('First name: ')
        last_name = options.get('last_name') or input('Last name: ')

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'User with email {email} already exists')
            )
            return

        try:
            # Create superuser
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                user_type='admin',
                is_staff=True,
                is_superuser=True,
                is_active=True,
                email_verified=True
            )

            # Create admin profile
            Admin.objects.create(
                user=user,
                admin_level='super_admin',
                permissions={
                    'manage_users': True,
                    'manage_teachers': True,
                    'manage_admins': True,
                    'view_all_data': True,
                    'delete_data': True,
                    'manage_system': True
                }
            )

            self.stdout.write(
                self.style.SUCCESS(f'Superuser {email} created successfully')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {e}')
            )


# accounts/management/commands/cleanup_unverified_users.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.accounts.models import User


class Command(BaseCommand):
    help = 'Clean up unverified users older than specified days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Delete unverified users older than this many days (default: 7)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']

        cutoff_date = timezone.now() - timedelta(days=days)

        unverified_users = User.objects.filter(
            email_verified=False,
            date_joined__lt=cutoff_date
        )

        count = unverified_users.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {count} unverified users older than {days} days'
                )
            )
            for user in unverified_users:
                self.stdout.write(f'  - {user.email} (created: {user.date_joined})')
        else:
            deleted_count, _ = unverified_users.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Deleted {deleted_count} unverified users older than {days} days'
                )
            )


# accounts/management/commands/send_test_email.py
from django.core.management.base import BaseCommand
from core.accounts.email_service import EmailService


class Command(BaseCommand):
    help = 'Send a test email to verify email configuration'

    def add_arguments(self, parser):
        parser.add_argument('--to', type=str, required=True, help='Recipient email address')
        parser.add_argument('--subject', type=str, default='Test Email', help='Email subject')

    def handle(self, *args, **options):
        recipient = options['to']
        subject = options['subject']

        context = {
            'user': {'first_name': 'Test', 'email': recipient},
            'site_name': 'Jamie Aale Abba - LMS',
            'message': 'This is a test email to verify your email configuration.'
        }

        try:
            success = EmailService.send_email(
                subject=subject,
                template_name='test_email',
                context=context,
                recipient_email=recipient
            )

            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'Test email sent successfully to {recipient}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Failed to send test email to {recipient}')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error sending test email: {e}')
            )


# accounts/management/commands/generate_sample_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.accounts.models import Parent, Teacher, Admin
from faker import Faker
import random

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    help = 'Generate sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument('--parents', type=int, default=10, help='Number of parents to create')
        parser.add_argument('--teachers', type=int, default=5, help='Number of teachers to create')
        parser.add_argument('--admins', type=int, default=2, help='Number of admins to create')

    def handle(self, *args, **options):
        parents_count = options['parents']
        teachers_count = options['teachers']
        admins_count = options['admins']

        self.stdout.write('Creating sample data...')

        # Create parents
        for i in range(parents_count):
            email = fake.unique.email()
            user = User.objects.create_user(
                username=email,
                email=email,
                password='TestPass123!',
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                user_type='parent',
                phone_number=f'+947{random.randint(10000000, 99999999)}',
                preferred_language=random.choice(['en', 'si', 'ta']),
                is_active=True,
                email_verified=True
            )

            Parent.objects.create(
                user=user,
                occupation=fake.job(),
                emergency_contact=f'+947{random.randint(10000000, 99999999)}',
                address=fake.address()
            )

        self.stdout.write(f'Created {parents_count} parent users')

        # Create teachers
        for i in range(teachers_count):
            email = fake.unique.email()
            user = User.objects.create_user(
                username=email,
                email=email,
                password='TestPass123!',
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                user_type='teacher',
                phone_number=f'+947{random.randint(10000000, 99999999)}',
                preferred_language=random.choice(['en', 'si', 'ta']),
                is_active=True,
                email_verified=True
            )

            Teacher.objects.create(
                user=user,
                employee_id=f'TCH{1000 + i}',
                qualification=fake.sentence(nb_words=4),
                experience_years=random.randint(1, 15),
                hire_date=fake.date_between(start_date='-5y', end_date='today')
            )

        self.stdout.write(f'Created {teachers_count} teacher users')

        # Create admins
        for i in range(admins_count):
            email = fake.unique.email()
            user = User.objects.create_user(
                username=email,
                email=email,
                password='TestPass123!',
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                user_type='admin',
                phone_number=f'+947{random.randint(10000000, 99999999)}',
                preferred_language=random.choice(['en', 'si', 'ta']),
                is_active=True,
                email_verified=True,
                is_staff=True
            )

            Admin.objects.create(
                user=user,
                admin_level=random.choice(['admin', 'moderator']),
                permissions={
                    'manage_users': True,
                    'manage_teachers': True,
                    'view_reports': True
                }
            )

        self.stdout.write(f'Created {admins_count} admin users')
        self.stdout.write(
            self.style.SUCCESS('Sample data generation completed successfully!')
        )