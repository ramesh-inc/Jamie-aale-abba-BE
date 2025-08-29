#!/usr/bin/env python3
"""
Test script for Gmail SMTP configuration
Run with: python test_email.py
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'classdojo_project.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    """Test email sending with current configuration"""
    
    print(f"Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Email Host: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
    print(f"Email Port: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
    print(f"Email Use TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
    print(f"Email Host User: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
    print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    print("-" * 50)
    
    # Only test if not using console backend
    if settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
        try:
            result = send_mail(
                subject='Test Email from Jamie Aale Abba',
                message='This is a test email to verify Gmail SMTP configuration.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],  # Send to yourself
                fail_silently=False,
            )
            
            if result:
                print("✅ Email sent successfully!")
                print(f"Sent to: {settings.EMAIL_HOST_USER}")
            else:
                print("❌ Failed to send email")
                
        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            print("\nCommon issues:")
            print("1. Check if 2-Factor Authentication is enabled on Gmail")
            print("2. Use App Password instead of regular password")
            print("3. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env")
            print("4. Check if 'Less secure app access' is enabled (not recommended)")
            
    else:
        print("📧 Using console backend - emails will be printed to console")
        print("Set DEBUG=False or uncomment Gmail settings to test actual sending")

if __name__ == '__main__':
    test_email()