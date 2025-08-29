# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Jamie Aale Abba Nursery Management System to production.

## 🔧 Production Changes Required

### 1. Django Backend Configuration Changes

#### Environment Variables Setup
Create a production `.env` file with the following variables:

```bash
# Core Django Settings
DEBUG=False
SECRET_KEY=your-very-secure-production-secret-key-256-chars-long
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Database Configuration
DATABASES_ENGINE=django.db.backends.mysql
MYSQL_DATABASE=classdojo_production
MYSQL_USER=classdojo_prod_user
MYSQL_PASSWORD=very-secure-database-password
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Email Configuration - Jamie Aale Abba Mail Server
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mail.jamiaaaleabba.co.uk
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
EMAIL_HOST_USER=noreply@jamiaaaleabba.co.uk
EMAIL_HOST_PASSWORD=qv=Wulz%8[.tE_=2
DEFAULT_FROM_EMAIL=Jamie Aale Abba <noreply@jamiaaaleabba.co.uk>

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Static Files
STATIC_ROOT=/var/www/jamie-aale-abba/static/
MEDIA_ROOT=/var/www/jamie-aale-abba/media/

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_ALL_ORIGINS=False
FRONTEND_URL=https://yourdomain.com

# Optional: Error Tracking (Sentry)
SENTRY_DSN=your-sentry-dsn-here
```

#### Update `settings.py` for Production
Add the following configurations to `classdojo_project/settings.py`:

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Production Settings
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# Database Configuration for Production
if not DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': os.getenv('DATABASES_ENGINE', 'django.db.backends.mysql'),
            'NAME': os.getenv('MYSQL_DATABASE', 'classdojo_production'),
            'USER': os.getenv('MYSQL_USER', 'root'),
            'PASSWORD': os.getenv('MYSQL_PASSWORD', ''),
            'HOST': os.getenv('MYSQL_HOST', 'localhost'),
            'PORT': os.getenv('MYSQL_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }

# Static Files Configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.getenv('STATIC_ROOT', BASE_DIR / 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.getenv('MEDIA_ROOT', BASE_DIR / 'media')

# Security Settings for Production
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', 31536000))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'

# CORS Settings for Production
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_ALL_ORIGINS = False

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/jamie-aale-abba/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Optional: Sentry Error Tracking
SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=1.0,
        send_default_pii=True
    )
```

### 2. Frontend Configuration Changes

#### Create production environment file
Create `frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENV=production
VITE_ENABLE_DEBUG=false
```

#### Update build process for production
The frontend build process remains the same:
```bash
cd frontend
npm run build
```

## 📧 Email Configuration Setup

### Jamie Aale Abba Mail Server Configuration

The project is configured to use the Jamie Aale Abba mail server for production email services:

**Email Server Details:**
- **Host**: `mail.jamiaaaleabba.co.uk`
- **Port**: `465` (SSL/TLS Required)
- **Username**: `noreply@jamiaaaleabba.co.uk`
- **Password**: `qv=Wulz%8[.tE_=2`
- **Encryption**: SSL (Port 465)

### Email Functionality

The following email features are configured:

1. **Email Verification**: New user registration emails
2. **Welcome Emails**: Post-verification welcome messages  
3. **Password Reset**: Forgot password functionality
4. **Admin Notifications**: System notifications

### Testing Email Configuration

Before deploying, test the email configuration using the provided test script:

```bash
# Run the email test script
python test_production_email.py
```

Expected output:
```
Testing email configuration...
Email Host: mail.jamiaaaleabba.co.uk
Email Port: 465
Email Use SSL: True
Email Use TLS: False
Email Host User: noreply@jamiaaaleabba.co.uk
Default From Email: Jamie Aale Abba <noreply@jamiaaaleabba.co.uk>
--------------------------------------------------
✅ Test email sent successfully!
```

### Email Service Testing

You can test different email functions using Django shell:

```bash
python manage.py shell
```

```python
# Test email verification
from core.accounts.email_service import send_verification_email
from core.models import User

user = User.objects.first()  # Get a test user
send_verification_email(user)

# Test password reset
from core.accounts.email_service import send_password_reset_email
send_password_reset_email(user)

# Test welcome email
from core.accounts.email_service import send_welcome_email
send_welcome_email(user)
```

### Email Troubleshooting

**Common Email Issues:**

1. **SSL Certificate Errors:**
   - Ensure your server can connect to `mail.jamiaaaleabba.co.uk` on port 465
   - Verify SSL/TLS settings are correct

2. **Authentication Errors:**
   - Verify the email credentials are correct in your `.env` file
   - Check that EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are set properly

3. **Port Blocked:**
   - Ensure port 465 is open on your production server
   - Check firewall settings

4. **Email Not Sending:**
   - Check Django logs for email-related errors
   - Verify EMAIL_USE_SSL=True and EMAIL_USE_TLS=False for port 465

## 🚀 Deployment Options

### Option 1: Traditional VPS/Server Deployment

#### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 20GB minimum
- **CPU**: 2 cores minimum
- **Python**: 3.13+
- **Node.js**: 18+

#### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.13 python3-pip python3-venv mysql-server nginx git supervisor redis-server

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Secure MySQL installation
sudo mysql_secure_installation
```

#### Step 2: Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE classdojo_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'classdojo_prod_user'@'localhost' IDENTIFIED BY 'very-secure-database-password';
GRANT ALL PRIVILEGES ON classdojo_production.* TO 'classdojo_prod_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/jamie-aale-abba
sudo chown $USER:$USER /var/www/jamie-aale-abba

# Clone repository
cd /var/www/jamie-aale-abba
git clone https://github.com/your-username/Jamie-aale-abba-BE.git .

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with production values

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Build frontend
cd frontend
npm install
npm run build
```

#### Step 4: Gunicorn Configuration

Create `/etc/systemd/system/jamie-aale-abba.service`:

```ini
[Unit]
Description=Jamie Aale Abba Gunicorn Application Server
Requires=jamie-aale-abba.socket
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
RuntimeDirectory=jamie-aale-abba
WorkingDirectory=/var/www/jamie-aale-abba
ExecStart=/var/www/jamie-aale-abba/venv/bin/gunicorn \
          --pid /run/jamie-aale-abba/pid \
          --bind unix:/run/jamie-aale-abba/socket \
          --workers 3 \
          --timeout 60 \
          --max-requests 1000 \
          --max-requests-jitter 50 \
          --preload \
          classdojo_project.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Environment="DJANGO_SETTINGS_MODULE=classdojo_project.settings"
EnvironmentFile=/var/www/jamie-aale-abba/.env

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/jamie-aale-abba.socket`:

```ini
[Unit]
Description=Jamie Aale Abba Gunicorn Socket

[Socket]
ListenStream=/run/jamie-aale-abba/socket
SocketUser=www-data
SocketMode=600

[Install]
WantedBy=sockets.target
```

#### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/jamie-aale-abba`:

```nginx
upstream jamie_aale_abba {
    server unix:/run/jamie-aale-abba/socket fail_timeout=0;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;

    # Frontend (React build)
    location / {
        root /var/www/jamie-aale-abba/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://jamie_aale_abba;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://jamie_aale_abba;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Django Static Files
    location /static/ {
        alias /var/www/jamie-aale-abba/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Django Media Files
    location /media/ {
        alias /var/www/jamie-aale-abba/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Documentation
    location /swagger/ {
        proxy_pass http://jamie_aale_abba;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

#### Step 6: SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

#### Step 7: Start Services

```bash
# Enable and start services
sudo systemctl enable jamie-aale-abba.socket
sudo systemctl start jamie-aale-abba.socket
sudo systemctl enable jamie-aale-abba.service
sudo systemctl start jamie-aale-abba.service

# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/jamie-aale-abba /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Enable Redis (for caching)
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Option 2: Docker Deployment

#### Create Dockerfile for Backend

Create `Dockerfile` in project root:

```dockerfile
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        default-libmysqlclient-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "classdojo_project.wsgi:application"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: jamie-aale-abba-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: classdojo_production
      MYSQL_USER: classdojo_prod_user
      MYSQL_PASSWORD: very-secure-database-password
      MYSQL_ROOT_PASSWORD: super-secure-root-password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    container_name: jamie-aale-abba-redis
    restart: unless-stopped

  web:
    build: .
    container_name: jamie-aale-abba-web
    restart: unless-stopped
    environment:
      - DEBUG=False
      - SECRET_KEY=your-production-secret-key
      - DATABASES_ENGINE=django.db.backends.mysql
      - MYSQL_DATABASE=classdojo_production
      - MYSQL_USER=classdojo_prod_user
      - MYSQL_PASSWORD=very-secure-database-password
      - MYSQL_HOST=db
      - MYSQL_PORT=3306
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 3 classdojo_project.wsgi:application"

  nginx:
    image: nginx:alpine
    container_name: jamie-aale-abba-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static_volume:/var/www/static
      - media_volume:/var/www/media
      - ./frontend/dist:/var/www/frontend
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - web

volumes:
  mysql_data:
  static_volume:
  media_volume:
```

### Option 3: cPanel Shared Hosting Deployment

#### Prerequisites for cPanel Deployment

- **cPanel hosting account** with Python support (3.8+)
- **SSH access** (if available) or File Manager access
- **MySQL database** access
- **Subdomain/domain** configured
- **Email account** already set up (noreply@jamiaaaleabba.co.uk)

#### Step 1: Prepare Your cPanel Environment

**1.1 Create Python App in cPanel:**
```bash
# In cPanel → Setup Python App
- Python Version: 3.8+ (latest available)
- Application Root: jamie-aale-abba
- Application URL: your-domain.com (or subdomain)
- Startup File: passenger_wsgi.py
```

**1.2 Create Database:**
```sql
# In cPanel → MySQL Databases
- Create Database: [username]_classdojo_prod
- Create Database User: [username]_django_user
- Assign User to Database with ALL PRIVILEGES
```

**1.3 Set up Environment Variables in cPanel:**
```bash
# In Python App → Environment Variables
DEBUG=False
SECRET_KEY=your-very-secure-production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database Settings
DATABASES_ENGINE=django.db.backends.mysql
MYSQL_DATABASE=[your_cpanel_username]_classdojo_prod
MYSQL_USER=[your_cpanel_username]_django_user
MYSQL_PASSWORD=your-database-password
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Email Configuration (Already configured for Jamie Aale Abba)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mail.jamiaaaleabba.co.uk
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
EMAIL_HOST_USER=noreply@jamiaaaleabba.co.uk
EMAIL_HOST_PASSWORD=qv=Wulz%8[.tE_=2
DEFAULT_FROM_EMAIL=Jamie Aale Abba <noreply@jamiaaaleabba.co.uk>

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/home/[username]/public_html/static/
MEDIA_URL=/media/
MEDIA_ROOT=/home/[username]/public_html/media/

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

#### Step 2: Upload and Configure Application Files

**2.1 Upload Project Files:**
```bash
# Via File Manager or FTP
# Upload all project files to: /home/[username]/jamie-aale-abba/
# Exclude: venv/, __pycache__/, .git/, node_modules/

# Key files to upload:
- manage.py
- requirements.txt
- classdojo_project/
- core/
- templates/
- static/
- .env.production (rename to .env)
```

**2.2 Create passenger_wsgi.py (cPanel Entry Point):**
```python
# Create: /home/[username]/jamie-aale-abba/passenger_wsgi.py
import sys
import os
from dotenv import load_dotenv

# Add your project directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
load_dotenv()

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'classdojo_project.settings')

# Import Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**2.3 Install Python Dependencies:**
```bash
# In cPanel Python App terminal or SSH:
source /home/[username]/virtualenv/jamie-aale-abba/3.8/bin/activate
pip install -r requirements.txt

# Additional packages often needed for cPanel:
pip install mysqlclient
pip install python-dotenv
```

#### Step 3: Database Setup

**3.1 Run Django Migrations:**
```bash
# In Python App terminal:
cd /home/[username]/jamie-aale-abba
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

**3.2 Import Initial Data (if needed):**
```bash
# If you have a database backup:
mysql -u [username]_django_user -p [username]_classdojo_prod < backup.sql
```

#### Step 4: Static Files and Frontend Setup

**4.1 Configure Static Files:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# Set up static file serving via cPanel
# In File Manager, ensure static/ folder is in public_html/
```

**4.2 Build and Deploy Frontend:**
```bash
# Local machine - build frontend:
cd frontend
npm run build

# Upload dist/ contents to:
# /home/[username]/public_html/ (for root domain)
# OR /home/[username]/public_html/subdomain/ (for subdomain)
```

**4.3 Configure .htaccess for React Routing:**
```apache
# Create: /home/[username]/public_html/.htaccess
RewriteEngine On
RewriteBase /

# Handle Angular/React Router
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# API routing to Django
RewriteRule ^api/(.*)$ /jamie-aale-abba/$1 [P,L]
RewriteRule ^admin/(.*)$ /jamie-aale-abba/$1 [P,L]
RewriteRule ^swagger/(.*)$ /jamie-aale-abba/$1 [P,L]
```

#### Step 5: Configure Email and Testing

**5.1 Test Email Configuration:**
```python
# Create test_cpanel_email.py in your app directory:
import os
import django
from django.core.mail import send_mail
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'classdojo_project.settings')
django.setup()

def test_email():
    try:
        send_mail(
            'cPanel Deployment Test',
            'This is a test email from your cPanel deployment.',
            'noreply@jamiaaaleabba.co.uk',
            ['your-test-email@domain.com'],
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Email failed: {e}")

if __name__ == "__main__":
    test_email()
```

```bash
# Run email test:
python test_cpanel_email.py
```

#### Step 6: cPanel-Specific Configurations

**6.1 Set up Cron Jobs for Maintenance:**
```bash
# In cPanel → Cron Jobs, add:

# Daily cleanup of unverified users (every day at 2 AM)
0 2 * * * cd /home/[username]/jamie-aale-abba && python manage.py cleanup_unverified_users

# Weekly database backup (every Sunday at 1 AM)
0 1 * * 0 mysqldump -u [username]_django_user -p'password' [username]_classdojo_prod > /home/[username]/backups/db_backup_$(date +\%Y\%m\%d).sql
```

**6.2 Configure File Permissions:**
```bash
# Set proper permissions
chmod 755 /home/[username]/jamie-aale-abba
chmod 644 /home/[username]/jamie-aale-abba/passenger_wsgi.py
chmod -R 755 /home/[username]/public_html/static
chmod -R 755 /home/[username]/public_html/media
```

**6.3 Set up Error Logging:**
```python
# Update settings.py for cPanel logging:
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/home/[username]/logs/django_errors.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

#### Step 7: Domain and SSL Setup

**7.1 Configure Domain/Subdomain:**
```bash
# In cPanel → Subdomains (if using subdomain)
- Subdomain: app
- Domain: yourdomain.com
- Document Root: public_html/app
```

**7.2 Enable SSL:**
```bash
# In cPanel → SSL/TLS
- Install SSL Certificate (Let's Encrypt or purchased)
- Force HTTPS Redirect
```

#### Step 8: Testing and Go-Live

**8.1 Test All Functionality:**
```bash
# Test URLs:
https://yourdomain.com/                    # Frontend
https://yourdomain.com/api/auth/login/     # Backend API
https://yourdomain.com/admin/              # Django Admin
https://yourdomain.com/swagger/            # API Docs

# Test email functionality:
python test_cpanel_email.py

# Test database connection:
python manage.py shell
```

**8.2 Monitor Application:**
```bash
# Check error logs:
# cPanel → Error Logs
# Or: tail -f /home/[username]/logs/django_errors.log

# Check access logs:
# cPanel → Raw Access Logs
```

#### cPanel Deployment Limitations

**Common Limitations:**
1. **Limited server control** (no root access)
2. **Resource restrictions** (CPU, memory limits)
3. **No SSH access** on some shared hosting
4. **Python version constraints**
5. **Background task limitations**

**Workarounds:**
1. **Use cPanel cron jobs** for scheduled tasks
2. **Optimize database queries** for shared resources
3. **Use CDN** for static files if needed
4. **Implement proper caching** strategies

#### cPanel Troubleshooting

**Common Issues:**

1. **Application not starting:**
   ```bash
   # Check passenger_wsgi.py
   # Verify Python path
   # Check environment variables
   ```

2. **Database connection errors:**
   ```bash
   # Verify database credentials
   # Check MySQL user privileges
   # Test connection manually
   ```

3. **Static files not loading:**
   ```bash
   # Run collectstatic
   # Check file permissions
   # Verify .htaccess rules
   ```

4. **Email not working:**
   ```bash
   # Verify SMTP settings
   # Check cPanel email accounts
   # Test with test_cpanel_email.py
   ```

### Option 4: Cloud Platform Deployment

#### AWS Elastic Beanstalk

1. **Requirements file**: Create `requirements-prod.txt`
2. **Configuration**: Create `.ebextensions/` folder with configuration files
3. **Deploy**: Use EB CLI to deploy

#### Heroku Deployment

1. **Procfile**: Create `Procfile`
2. **Requirements**: Use `requirements.txt`
3. **Settings**: Configure environment variables
4. **Deploy**: Use Git to deploy

#### DigitalOcean App Platform

1. **App Spec**: Create `app.yaml` configuration
2. **Environment**: Configure via dashboard
3. **Deploy**: Connect GitHub repository

## 🔒 Security Checklist

- [ ] Update `SECRET_KEY` to a secure 256-character string
- [ ] Set `DEBUG=False` in production
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Set up SSL certificate (HTTPS)
- [ ] Enable security headers
- [ ] Configure secure session cookies
- [ ] Set up proper CORS settings
- [ ] Use environment variables for sensitive data
- [ ] Enable database connection security
- [ ] Set up proper logging
- [ ] Configure error tracking (Sentry)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Firewall configuration

## 📊 Monitoring and Maintenance

### Log Files to Monitor
- Django application logs: `/var/log/jamie-aale-abba/django.log`
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- System logs: `/var/log/syslog`

### Regular Maintenance Tasks
1. **Database backups** (daily)
2. **Security updates** (weekly)
3. **Log rotation** (automatic)
4. **SSL certificate renewal** (automatic with Let's Encrypt)
5. **Performance monitoring**
6. **Error tracking review**
7. **Email delivery monitoring** (weekly)

### Email Monitoring

Monitor email delivery by:
1. **Checking Django logs** for email send status
   ```bash
   # Check for email-related logs
   grep -i "email" /var/log/jamie-aale-abba/django.log
   
   # Monitor email service logs
   tail -f logs/django.log | grep -i "email"
   ```

2. **Testing email functionality** periodically:
   ```bash
   # Run email test script monthly
   python test_production_email.py
   ```

3. **Monitoring bounce/delivery reports** from email provider

### Database Backup Strategy

#### Automated Backup Setup

**1. Create Backup Directory Structure:**
```bash
# Create backup directories
sudo mkdir -p /backups/jamie-aale-abba/{database,media,logs}
sudo chown $USER:$USER /backups/jamie-aale-abba
chmod 755 /backups/jamie-aale-abba

# Create subdirectories for different backup types
mkdir -p /backups/jamie-aale-abba/database/{daily,weekly,monthly}
mkdir -p /backups/jamie-aale-abba/media/{daily,weekly}
mkdir -p /backups/jamie-aale-abba/logs
```

**2. Create Comprehensive Backup Script:**
```bash
# Create: /home/scripts/backup_jamie_aale_abba.sh
#!/bin/bash

# Configuration
APP_NAME="jamie-aale-abba"
BACKUP_BASE_DIR="/backups/$APP_NAME"
APP_DIR="/var/www/$APP_NAME"
DATE=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)
LOG_FILE="$BACKUP_BASE_DIR/logs/backup_$DATE_ONLY.log"

# Database Configuration
DB_NAME="classdojo_production"
DB_USER="classdojo_prod_user"
DB_PASSWORD="very-secure-database-password"
DB_HOST="localhost"

# Email Configuration (for notifications)
ADMIN_EMAIL="admin@jamiaaaleabba.co.uk"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to send notification email
send_notification() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$ADMIN_EMAIL"
}

# Start backup process
log_message "Starting backup process for $APP_NAME"

# 1. DATABASE BACKUP
log_message "Creating database backup..."
DB_BACKUP_FILE="$BACKUP_BASE_DIR/database/daily/db_${DB_NAME}_$DATE.sql"

# Create database dump
mysqldump --single-transaction \
          --routines \
          --triggers \
          --events \
          --lock-tables=false \
          -h "$DB_HOST" \
          -u "$DB_USER" \
          -p"$DB_PASSWORD" \
          "$DB_NAME" > "$DB_BACKUP_FILE" 2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$DB_BACKUP_FILE"
    log_message "Database backup completed: ${DB_BACKUP_FILE}.gz"
    
    # Verify the backup
    gunzip -t "${DB_BACKUP_FILE}.gz" 2>> "$LOG_FILE"
    if [ $? -eq 0 ]; then
        log_message "Database backup verification successful"
    else
        log_message "ERROR: Database backup verification failed"
        send_notification "Backup Error - $APP_NAME" "Database backup verification failed. Check logs: $LOG_FILE"
    fi
else
    log_message "ERROR: Database backup failed"
    send_notification "Backup Error - $APP_NAME" "Database backup failed. Check logs: $LOG_FILE"
fi

# 2. MEDIA FILES BACKUP
log_message "Creating media files backup..."
MEDIA_BACKUP_FILE="$BACKUP_BASE_DIR/media/daily/media_$DATE.tar.gz"

if [ -d "$APP_DIR/media" ]; then
    tar -czf "$MEDIA_BACKUP_FILE" -C "$APP_DIR" media/ 2>> "$LOG_FILE"
    if [ $? -eq 0 ]; then
        log_message "Media files backup completed: $MEDIA_BACKUP_FILE"
    else
        log_message "ERROR: Media files backup failed"
    fi
else
    log_message "WARNING: Media directory not found: $APP_DIR/media"
fi

# 3. APPLICATION FILES BACKUP (Code, configurations)
log_message "Creating application files backup..."
APP_BACKUP_FILE="$BACKUP_BASE_DIR/daily/app_files_$DATE.tar.gz"

# Backup important application files (exclude venv, cache, logs)
tar -czf "$APP_BACKUP_FILE" \
    --exclude="$APP_DIR/venv" \
    --exclude="$APP_DIR/__pycache__" \
    --exclude="$APP_DIR/*/__pycache__" \
    --exclude="$APP_DIR/logs" \
    --exclude="$APP_DIR/.git" \
    --exclude="$APP_DIR/node_modules" \
    -C "$(dirname $APP_DIR)" \
    "$(basename $APP_DIR)" 2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
    log_message "Application files backup completed: $APP_BACKUP_FILE"
else
    log_message "ERROR: Application files backup failed"
fi

# 4. BACKUP SIZE REPORTING
log_message "Backup size report:"
if [ -f "${DB_BACKUP_FILE}.gz" ]; then
    DB_SIZE=$(du -h "${DB_BACKUP_FILE}.gz" | cut -f1)
    log_message "Database backup size: $DB_SIZE"
fi

if [ -f "$MEDIA_BACKUP_FILE" ]; then
    MEDIA_SIZE=$(du -h "$MEDIA_BACKUP_FILE" | cut -f1)
    log_message "Media files backup size: $MEDIA_SIZE"
fi

if [ -f "$APP_BACKUP_FILE" ]; then
    APP_SIZE=$(du -h "$APP_BACKUP_FILE" | cut -f1)
    log_message "Application files backup size: $APP_SIZE"
fi

# 5. CLEANUP OLD BACKUPS
log_message "Cleaning up old backups..."

# Keep daily backups for 7 days
find "$BACKUP_BASE_DIR/database/daily" -name "*.sql.gz" -mtime +7 -delete 2>> "$LOG_FILE"
find "$BACKUP_BASE_DIR/media/daily" -name "*.tar.gz" -mtime +7 -delete 2>> "$LOG_FILE"
find "$BACKUP_BASE_DIR/daily" -name "*.tar.gz" -mtime +7 -delete 2>> "$LOG_FILE"

# Keep weekly backups for 4 weeks (28 days)
find "$BACKUP_BASE_DIR/database/weekly" -name "*.sql.gz" -mtime +28 -delete 2>> "$LOG_FILE"
find "$BACKUP_BASE_DIR/media/weekly" -name "*.tar.gz" -mtime +28 -delete 2>> "$LOG_FILE"

# Keep monthly backups for 12 months (365 days)
find "$BACKUP_BASE_DIR/database/monthly" -name "*.sql.gz" -mtime +365 -delete 2>> "$LOG_FILE"

# Clean old log files (keep 30 days)
find "$BACKUP_BASE_DIR/logs" -name "backup_*.log" -mtime +30 -delete 2>> "$LOG_FILE"

log_message "Backup cleanup completed"

# 6. WEEKLY AND MONTHLY BACKUP ROTATION
WEEKDAY=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

# Copy to weekly backup on Sundays
if [ "$WEEKDAY" -eq 7 ] && [ -f "${DB_BACKUP_FILE}.gz" ]; then
    WEEKLY_DB_BACKUP="$BACKUP_BASE_DIR/database/weekly/db_weekly_$DATE.sql.gz"
    cp "${DB_BACKUP_FILE}.gz" "$WEEKLY_DB_BACKUP"
    log_message "Weekly database backup created: $WEEKLY_DB_BACKUP"
    
    if [ -f "$MEDIA_BACKUP_FILE" ]; then
        WEEKLY_MEDIA_BACKUP="$BACKUP_BASE_DIR/media/weekly/media_weekly_$DATE.tar.gz"
        cp "$MEDIA_BACKUP_FILE" "$WEEKLY_MEDIA_BACKUP"
        log_message "Weekly media backup created: $WEEKLY_MEDIA_BACKUP"
    fi
fi

# Copy to monthly backup on first day of month
if [ "$DAY_OF_MONTH" -eq 01 ] && [ -f "${DB_BACKUP_FILE}.gz" ]; then
    MONTHLY_DB_BACKUP="$BACKUP_BASE_DIR/database/monthly/db_monthly_$DATE.sql.gz"
    cp "${DB_BACKUP_FILE}.gz" "$MONTHLY_DB_BACKUP"
    log_message "Monthly database backup created: $MONTHLY_DB_BACKUP"
fi

# 7. BACKUP VERIFICATION AND NOTIFICATION
TOTAL_SIZE=$(du -sh "$BACKUP_BASE_DIR" | cut -f1)
log_message "Total backup size: $TOTAL_SIZE"
log_message "Backup process completed successfully"

# Send success notification
send_notification "Backup Success - $APP_NAME" "Backup completed successfully. Total size: $TOTAL_SIZE. Check logs: $LOG_FILE"

echo "Backup completed. Check log file: $LOG_FILE"
```

**3. Make Script Executable:**
```bash
chmod +x /home/scripts/backup_jamie_aale_abba.sh
```

#### Manual Backup Procedures

**Immediate Database Backup:**
```bash
# Quick database backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/jamie-aale-abba/manual_db_backup_$DATE.sql"

# Create backup
mysqldump --single-transaction \
          --routines \
          --triggers \
          --events \
          --lock-tables=false \
          -u classdojo_prod_user \
          -p'very-secure-database-password' \
          classdojo_production > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Manual backup created: ${BACKUP_FILE}.gz"
```

**Backup Before Updates:**
```bash
#!/bin/bash
# Pre-update backup script
echo "Creating pre-update backup..."

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/jamie-aale-abba/pre-update"
mkdir -p "$BACKUP_DIR"

# Database backup
mysqldump -u classdojo_prod_user -p'very-secure-database-password' \
          classdojo_production > "$BACKUP_DIR/db_pre_update_$DATE.sql"
gzip "$BACKUP_DIR/db_pre_update_$DATE.sql"

# Application files backup
tar -czf "$BACKUP_DIR/app_pre_update_$DATE.tar.gz" \
    --exclude="/var/www/jamie-aale-abba/venv" \
    --exclude="/var/www/jamie-aale-abba/__pycache__" \
    /var/www/jamie-aale-abba/

echo "Pre-update backup completed:"
echo "Database: $BACKUP_DIR/db_pre_update_${DATE}.sql.gz"
echo "Application: $BACKUP_DIR/app_pre_update_${DATE}.tar.gz"
```

#### cPanel-Specific Backup Setup

**For cPanel Hosting:**
```bash
# cPanel backup script (limited permissions)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/[username]/backups"
mkdir -p "$BACKUP_DIR"

# Database backup using cPanel credentials
mysqldump -u [username]_django_user \
          -p'your-database-password' \
          [username]_classdojo_prod > "$BACKUP_DIR/db_backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Media files backup
tar -czf "$BACKUP_DIR/media_backup_$DATE.tar.gz" \
    /home/[username]/public_html/media/

# Clean old backups (keep 14 days due to space limitations)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +14 -delete

echo "cPanel backup completed: $BACKUP_DIR/"
```

**cPanel Cron Jobs for Backups:**
```bash
# Daily backup (every day at 3 AM)
0 3 * * * /home/[username]/scripts/cpanel_backup.sh >> /home/[username]/logs/backup.log 2>&1

# Weekly full backup (every Sunday at 2 AM)
0 2 * * 0 /home/[username]/scripts/cpanel_weekly_backup.sh >> /home/[username]/logs/backup.log 2>&1
```

#### Backup Restoration Procedures

**Database Restoration:**
```bash
# Restore from backup
BACKUP_FILE="/backups/jamie-aale-abba/database/daily/db_classdojo_production_20241201_030001.sql.gz"

# Decompress backup
gunzip "$BACKUP_FILE"
DECOMPRESSED_FILE="${BACKUP_FILE%.gz}"

# Stop application (prevent database writes)
sudo systemctl stop jamie-aale-abba

# Create backup of current database before restore
mysqldump -u classdojo_prod_user -p'very-secure-database-password' \
          classdojo_production > "/backups/before_restore_$(date +%Y%m%d_%H%M%S).sql"

# Drop and recreate database (optional - for complete restore)
mysql -u root -p -e "DROP DATABASE classdojo_production;"
mysql -u root -p -e "CREATE DATABASE classdojo_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON classdojo_production.* TO 'classdojo_prod_user'@'localhost'; FLUSH PRIVILEGES;"

# Restore database
mysql -u classdojo_prod_user -p'very-secure-database-password' \
      classdojo_production < "$DECOMPRESSED_FILE"

# Start application
sudo systemctl start jamie-aale-abba

echo "Database restoration completed"
```

**Media Files Restoration:**
```bash
# Restore media files
MEDIA_BACKUP="/backups/jamie-aale-abba/media/daily/media_20241201_030001.tar.gz"
APP_MEDIA_DIR="/var/www/jamie-aale-abba/media"

# Backup current media files
if [ -d "$APP_MEDIA_DIR" ]; then
    mv "$APP_MEDIA_DIR" "${APP_MEDIA_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

# Extract media backup
tar -xzf "$MEDIA_BACKUP" -C "/var/www/jamie-aale-abba/"

# Set proper permissions
chown -R www-data:www-data "$APP_MEDIA_DIR"
chmod -R 755 "$APP_MEDIA_DIR"

echo "Media files restoration completed"
```

#### Backup Monitoring and Alerts

**Backup Health Check Script:**
```bash
#!/bin/bash
# Check backup health
BACKUP_DIR="/backups/jamie-aale-abba"
TODAY=$(date +%Y%m%d)
ADMIN_EMAIL="admin@jamiaaaleabba.co.uk"

# Check if today's backup exists
DB_BACKUP=$(find "$BACKUP_DIR/database/daily" -name "*${TODAY}*.sql.gz" | head -1)
MEDIA_BACKUP=$(find "$BACKUP_DIR/media/daily" -name "*${TODAY}*.tar.gz" | head -1)

if [ ! -f "$DB_BACKUP" ]; then
    echo "WARNING: No database backup found for today" | \
    mail -s "Backup Alert - Missing Database Backup" "$ADMIN_EMAIL"
fi

if [ ! -f "$MEDIA_BACKUP" ]; then
    echo "WARNING: No media backup found for today" | \
    mail -s "Backup Alert - Missing Media Backup" "$ADMIN_EMAIL"
fi

# Check backup sizes (alert if too small)
if [ -f "$DB_BACKUP" ]; then
    DB_SIZE=$(stat -c%s "$DB_BACKUP")
    if [ "$DB_SIZE" -lt 1048576 ]; then  # Less than 1MB
        echo "WARNING: Database backup size is suspiciously small: $DB_SIZE bytes" | \
        mail -s "Backup Alert - Small Database Backup" "$ADMIN_EMAIL"
    fi
fi

# Check disk space
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "WARNING: Backup disk usage is at ${DISK_USAGE}%" | \
    mail -s "Backup Alert - Low Disk Space" "$ADMIN_EMAIL"
fi
```

#### Automated Backup Setup

**Install and Configure:**
```bash
# 1. Create scripts directory
sudo mkdir -p /home/scripts
sudo chown $USER:$USER /home/scripts

# 2. Copy backup script
sudo cp backup_jamie_aale_abba.sh /home/scripts/
chmod +x /home/scripts/backup_jamie_aale_abba.sh

# 3. Set up cron jobs
crontab -e

# Add the following lines:
# Daily backup at 3:00 AM
0 3 * * * /home/scripts/backup_jamie_aale_abba.sh

# Backup health check at 8:00 AM
0 8 * * * /home/scripts/backup_health_check.sh

# 4. Install mail utilities (for notifications)
sudo apt install mailutils
```

This comprehensive backup strategy provides multiple layers of protection with automated scheduling, verification, and monitoring for your Jamie Aale Abba application.

## 🚨 Troubleshooting

### Common Issues

1. **Static files not loading**
   - Run `python manage.py collectstatic --noinput`
   - Check nginx static file configuration

2. **Database connection errors**
   - Verify database credentials
   - Check database server status
   - Ensure database exists

3. **SSL certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate expiry: `sudo certbot certificates`

4. **Performance issues**
   - Monitor server resources
   - Check database query performance
   - Review nginx logs

5. **Email delivery issues**
   - Test email configuration: `python test_production_email.py`
   - Check email service logs: `grep -i "email" /var/log/jamie-aale-abba/django.log`
   - Verify SMTP settings in `.env` file
   - Ensure port 465 is open and accessible
   - Test manual connection: `telnet mail.jamiaaaleabba.co.uk 465`

### Service Management Commands

```bash
# Backend service
sudo systemctl status jamie-aale-abba
sudo systemctl restart jamie-aale-abba
sudo journalctl -u jamie-aale-abba -f

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Database
sudo systemctl status mysql
sudo systemctl restart mysql
```

This deployment guide should get your Jamie Aale Abba application running securely in production. Choose the deployment option that best fits your infrastructure and requirements.