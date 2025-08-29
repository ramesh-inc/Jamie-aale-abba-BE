#!/usr/bin/env python
"""
Test script for production email configuration
Run with: python test_production_email.py
"""
import os
import django
from django.conf import settings
from django.core.mail import send_mail
from dotenv import load_dotenv

# Load production environment variables
load_dotenv('.env.production')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'classdojo_project.settings')
django.setup()

def test_email_configuration():
    """Test the email configuration by sending a test email"""
    
    print("Testing email configuration...")
    print(f"Email Host: {settings.EMAIL_HOST}")
    print(f"Email Port: {settings.EMAIL_PORT}")
    print(f"Email Use SSL: {settings.EMAIL_USE_SSL}")
    print(f"Email Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"Email Host User: {settings.EMAIL_HOST_USER}")
    print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
    print("-" * 50)
    
    try:
        # Send test email
        send_mail(
            subject='Test Email - Jamie Aale Abba Production Setup',
            message='This is a test email to verify the production email configuration is working correctly.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to the same email for testing
            fail_silently=False,
        )
        print("✅ Test email sent successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {str(e)}")
        return False

if __name__ == "__main__":
    test_email_configuration()