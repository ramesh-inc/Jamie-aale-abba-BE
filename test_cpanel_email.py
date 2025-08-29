#!/usr/bin/env python
"""
Test script for cPanel email configuration
Run with: python test_cpanel_email.py
"""
import os
import django
from django.core.mail import send_mail
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'classdojo_project.settings')
django.setup()

def test_email():
    """Test the email configuration by sending a test email"""
    
    print("Testing cPanel email configuration...")
    print(f"Email Host: {os.getenv('EMAIL_HOST', 'Not set')}")
    print(f"Email Port: {os.getenv('EMAIL_PORT', 'Not set')}")
    print(f"Email Use SSL: {os.getenv('EMAIL_USE_SSL', 'Not set')}")
    print(f"Email Use TLS: {os.getenv('EMAIL_USE_TLS', 'Not set')}")
    print(f"Email Host User: {os.getenv('EMAIL_HOST_USER', 'Not set')}")
    print(f"Default From Email: {os.getenv('DEFAULT_FROM_EMAIL', 'Not set')}")
    print("-" * 50)
    
    try:
        # Send test email
        send_mail(
            subject='cPanel Deployment Test - Jamie Aale Abba',
            message='This is a test email to verify the cPanel email configuration is working correctly.\n\nIf you receive this email, your Jamie Aale Abba mail server setup is working properly!',
            from_email=os.getenv('DEFAULT_FROM_EMAIL', 'noreply@jamiaaaleabba.co.uk'),
            recipient_list=['your-test-email@domain.com'],  # Replace with your test email
            fail_silently=False,
        )
        print("✅ Test email sent successfully!")
        print("Check your inbox to confirm email delivery.")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env file")
        print("2. Check that EMAIL_USE_SSL=True for port 465")
        print("3. Ensure port 465 is accessible from your cPanel hosting")
        print("4. Verify the Jamie Aale Abba email account is active")
        return False

if __name__ == "__main__":
    success = test_email()
    if success:
        print("\n🎉 Email configuration is ready for production!")
    else:
        print("\n⚠️  Please fix the email configuration before deploying.")