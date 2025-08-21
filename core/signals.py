from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import User, Admin


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create related profiles when a user is created
    """
    if created:
        if instance.user_type == 'admin':
            # Create admin profile for admin users
            Admin.objects.create(
                user=instance,
                admin_level='super_admin' if instance.is_superuser else 'admin',
                is_active=True
            )