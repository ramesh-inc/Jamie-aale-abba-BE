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

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-specific-password
DEFAULT_FROM_EMAIL=Jamie Aale Abba <noreply@yourdomain.com>

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

### Option 3: Cloud Platform Deployment

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

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/jamie-aale-abba"

# Database backup
mysqldump -u classdojo_prod_user -p'very-secure-database-password' classdojo_production > $BACKUP_DIR/db_backup_$DATE.sql

# Media files backup
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/jamie-aale-abba/media/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

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