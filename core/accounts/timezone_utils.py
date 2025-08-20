import pytz
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin


class TimezoneMiddleware(MiddlewareMixin):
    """
    Middleware to set timezone based on user preference or detect from request
    """

    def process_request(self, request):
        # Default timezone
        user_timezone = 'Asia/Colombo'

        # If user is authenticated, use their timezone preference
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'timezone') and request.user.timezone:
                user_timezone = request.user.timezone
        else:
            # Try to detect timezone from headers or other sources
            user_timezone = self.detect_timezone_from_request(request)

        # Activate the timezone
        try:
            timezone.activate(pytz.timezone(user_timezone))
        except pytz.exceptions.UnknownTimeZoneError:
            # Fallback to default timezone
            timezone.activate(pytz.timezone('Asia/Colombo'))

    def detect_timezone_from_request(self, request):
        """
        Detect timezone from request headers or other sources
        This is a basic implementation - you can enhance it based on your needs
        """
        # Check for timezone in headers (if sent by frontend)
        timezone_header = request.META.get('HTTP_X_TIMEZONE')
        if timezone_header:
            try:
                pytz.timezone(timezone_header)
                return timezone_header
            except pytz.exceptions.UnknownTimeZoneError:
                pass

        # Check for timezone in session
        if hasattr(request, 'session') and 'user_timezone' in request.session:
            return request.session['user_timezone']

        # Default timezone for Sri Lanka
        return 'Asia/Colombo'


def get_user_timezone(user):
    """
    Get timezone for a specific user
    """
    if user and hasattr(user, 'timezone') and user.timezone:
        try:
            return pytz.timezone(user.timezone)
        except pytz.exceptions.UnknownTimeZoneError:
            pass

    # Default timezone
    return pytz.timezone('Asia/Colombo')


def convert_to_user_timezone(dt, user):
    """
    Convert datetime to user's timezone
    """
    user_tz = get_user_timezone(user)

    if timezone.is_aware(dt):
        return dt.astimezone(user_tz)
    else:
        # Make naive datetime aware in UTC first
        utc_dt = timezone.make_aware(dt, pytz.UTC)
        return utc_dt.astimezone(user_tz)


# Common timezone choices for Sri Lanka and nearby regions
TIMEZONE_CHOICES = [
    ('Asia/Colombo', 'Colombo (GMT+5:30)'),
    ('Asia/Kolkata', 'Kolkata (GMT+5:30)'),
    ('Asia/Dhaka', 'Dhaka (GMT+6:00)'),
    ('Asia/Dubai', 'Dubai (GMT+4:00)'),
    ('UTC', 'UTC (GMT+0:00)'),
]