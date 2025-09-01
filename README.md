# Jamie Aale Abba - LMS SAAS - Nursery Management Platform

A full-stack web application for managing nursery operations, featuring a Django REST API backend and React.js frontend. The platform enables parents, teachers, and administrators to manage students, track activities, communicate, and monitor learning progress.

## 🚀 Features

### **Backend (Django REST API)**
- **User Management**: Role-based authentication for Parents, Teachers, and Admins
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Email Verification**: Automated email verification for new accounts
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: API throttling for security
- **Multi-language Support**: English, Sinhala, Tamil

### **Frontend (React.js)**
- **Parent Registration**: Secure account creation with real-time validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG compliant with screen reader support
- **Form Validation**: Client-side and server-side validation
- **Modern UI/UX**: Clean, intuitive interface

## 🛠️ Tech Stack

### **Backend**
- **Framework**: Django 5.2+ with Django REST Framework
- **Database**: MySQL 8.0+ (with SQLite fallback for development)
- **Authentication**: JWT with SimpleJWT
- **Task Queue**: Celery with Redis (optional)
- **Email**: SMTP with HTML templates
- **API Docs**: drf-yasg (Swagger/OpenAPI)

### **Frontend**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **State Management**: React Hooks

## 📋 Prerequisites

Before setting up the project, ensure you have:

### **Cross-Platform Requirements**
- **Python**: 3.13+ 
- **Node.js**: 18+ and npm
- **Git**: Version control
- **MySQL**: 8.0+ (optional, SQLite fallback available)

### **Platform-Specific Requirements**
- **macOS**: macOS 10.15+ (for Homebrew compatibility)
- **Windows**: Windows 10+ with PowerShell or Windows Subsystem for Linux (WSL2)

## 🍺 Initial System Setup

### macOS Setup

#### Install Homebrew and Dependencies

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install system dependencies
brew install python node mysql redis pkg-config git

# Start services (optional for development)
brew services start mysql
brew services start redis

# Verify installations
python3 --version  # Should be 3.13+
node --version      # Should be 18+
npm --version
mysql --version
```

### Windows Setup

#### Option 1: Windows with PowerShell (Recommended)

```powershell
# Install Chocolatey package manager (if not already installed)
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install system dependencies
choco install python nodejs mysql git redis-64 -y

# Verify installations
python --version   # Should be 3.13+
node --version     # Should be 18+
npm --version
mysql --version

# Start MySQL service
net start mysql
```

#### Option 2: Manual Installation (Windows)

1. **Python 3.13+**: Download from [python.org](https://www.python.org/downloads/)
   - ✅ Check "Add Python to PATH" during installation
   - ✅ Choose "Install for all users"

2. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
   - LTS version recommended
   - npm is included automatically

3. **Git**: Download from [git-scm.com](https://git-scm.com/download/win)
   - Choose "Git Bash" during installation

4. **MySQL 8.0+**: Download from [mysql.com](https://dev.mysql.com/downloads/installer/)
   - Choose "Developer Default" installation
   - Remember your root password

5. **Redis** (optional): Download from [redis.io](https://redis.io/download) or use [Windows version](https://github.com/microsoftarchive/redis/releases)

#### Option 3: Windows Subsystem for Linux (WSL2)

```bash
# Install WSL2 (if not already installed)
# Run in PowerShell as Administrator
wsl --install -d Ubuntu

# Once in Ubuntu terminal:
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3.13 python3-pip python3-venv nodejs npm mysql-server redis-server git pkg-config -y

# Start services
sudo service mysql start
sudo service redis-server start

# Verify installations
python3 --version
node --version
npm --version
mysql --version
```

## 🏗️ Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Jamie-aale-abba-BE.git
cd Jamie-aale-abba-BE
```

### 2. Backend Setup (Django)

#### macOS/Linux Commands:
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file (optional - fallback configurations are provided)
touch .env
```

#### Windows Commands:
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (PowerShell)
venv\Scripts\Activate.ps1

# OR activate in Command Prompt
venv\Scripts\activate.bat

# OR activate in Git Bash
source venv/Scripts/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file (optional)
New-Item .env -ItemType File
# OR in Command Prompt: type nul > .env
```

**Optional `.env` file configuration:**
```bash
# Database Configuration (MySQL - optional, defaults to SQLite)
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=classdojo_db
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Django Configuration
DEBUG=True
SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:5173

# Email Configuration (Development - defaults to console)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Redis Configuration (optional - fallback to sync mode)
CELERY_BROKER_URL=redis://localhost:6379/0
REDIS_URL=redis://127.0.0.1:6379/1
```

#### Database Setup (All Platforms):
```bash
# Verify configuration
python manage.py check

# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user (interactive)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver               # Runs on http://localhost:8000
```

### 3. Frontend Setup (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev                              # Runs on http://localhost:5173
```

**Frontend `.env` configuration:**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENV=development
VITE_ENABLE_DEBUG=true
```

### 4. Database Setup (Optional - MySQL)

If you want to use MySQL instead of SQLite:

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE classdojo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'django_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON classdojo_db.* TO 'django_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update .env file with MySQL credentials
# Then run migrations again
python manage.py migrate
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Backend Server:

**macOS/Linux:**
```bash
cd Jamie-aale-abba-BE
source venv/bin/activate
python manage.py runserver
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/swagger/
# Admin Panel: http://localhost:8000/admin/
```

**Windows (PowerShell):**
```powershell
cd Jamie-aale-abba-BE
venv\Scripts\Activate.ps1
python manage.py runserver
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/swagger/
# Admin Panel: http://localhost:8000/admin/
```

**Windows (Command Prompt):**
```cmd
cd Jamie-aale-abba-BE
venv\Scripts\activate.bat
python manage.py runserver
```

#### Frontend Server:

**All Platforms:**
```bash
cd Jamie-aale-abba-BE/frontend
npm run dev
# Frontend App: http://localhost:5173
```

### Quick Start Guide

#### For Impatient Developers 🚀

**Prerequisites**: Python 3.13+, Node.js 18+, Git

```bash
# 1. Clone and setup
git clone https://github.com/your-username/Jamie-aale-abba-BE.git
cd Jamie-aale-abba-BE

# 2. Backend setup (5 minutes)
python3 -m venv venv                    # Windows: python -m venv venv
source venv/bin/activate                # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser        # Create admin account
python manage.py runserver &            # Windows: Start in separate terminal

# 3. Frontend setup (2 minutes)
cd frontend
npm install
npm run dev

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/swagger/
# Admin Panel: http://localhost:8000/admin/
```

#### Multi-Terminal Setup

**Terminal 1 - Backend:**
```bash
# macOS/Linux:
cd Jamie-aale-abba-BE
source venv/bin/activate

# Windows (PowerShell):
cd Jamie-aale-abba-BE
venv\Scripts\Activate.ps1

# All platforms:
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd Jamie-aale-abba-BE/frontend
npm run dev
```

### Production Mode

```bash
# Backend
pip install gunicorn
python manage.py collectstatic --noinput
gunicorn classdojo_project.wsgi:application --bind 0.0.0.0:8000

# Frontend
npm run build
npm run preview  # Or serve the dist/ folder with a web server
```

## 📂 Project Structure

```
Jamie-aale-abba-BE/
├── classdojo_project/                   # Django project settings
│   ├── __init__.py
│   ├── settings.py                     # Django configuration
│   ├── urls.py                         # Main URL routing
│   ├── wsgi.py                         # WSGI application
│   └── asgi.py                         # ASGI application
├── core/                               # Main Django app
│   ├── __init__.py
│   ├── accounts/                       # Authentication module
│   │   ├── __init__.py
│   │   ├── admin.py                   # Django admin config
│   │   ├── apps.py                    # App configuration
│   │   ├── email_service.py           # Email functionality
│   │   ├── management/                # Custom management commands
│   │   │   └── commands/
│   │   │       └── cleanup_unverified_users.py
│   │   ├── messages.py                # User messages
│   │   ├── models.py                  # Account models
│   │   ├── permissions.py             # Custom permissions
│   │   ├── serializers.py             # API serializers
│   │   ├── services.py                # Business logic
│   │   ├── tests.py                   # Unit tests
│   │   ├── timezone_utils.py          # Timezone utilities
│   │   ├── urls.py                    # Account URLs
│   │   ├── utils.py                   # Utility functions
│   │   ├── validators.py              # Custom validators
│   │   └── views.py                   # API views
│   ├── admin.py                       # Core admin config
│   ├── apps.py                        # App configuration
│   ├── middleware.py                  # Custom middleware
│   ├── migrations/                    # Database migrations
│   ├── models.py                      # Core database models
│   ├── serializers.py                # Core serializers
│   ├── tests.py                       # Core tests
│   ├── urls.py                        # Core URL routing
│   └── views.py                       # Core views
├── frontend/                           # React application
│   ├── dist/                          # Built frontend files
│   ├── node_modules/                  # npm dependencies
│   ├── public/                        # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/                    # Images and static files
│   │   │   ├── logo.png
│   │   │   ├── page_images/
│   │   │   └── react.svg
│   │   ├── components/                # React components
│   │   │   ├── auth/                 # Authentication components
│   │   │   │   ├── ParentRegistrationForm.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── RegistrationSuccess.tsx
│   │   │   │   └── TeacherPasswordChangeForm.tsx
│   │   │   └── ui/                   # Reusable UI components
│   │   │       ├── FormField.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── pages/                    # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EmailVerificationPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── RegistrationSuccessPage.tsx
│   │   │   ├── TeacherDashboardPage.tsx
│   │   │   └── TeacherPasswordChangePage.tsx
│   │   ├── services/                 # API services
│   │   │   └── api.ts
│   │   ├── types/                    # TypeScript types
│   │   │   ├── auth.ts
│   │   │   └── auth-backup.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── auth.ts
│   │   │   └── validation.ts
│   │   ├── App.css                   # App styles
│   │   ├── App.tsx                   # Main app component
│   │   ├── index.css                 # Global styles
│   │   ├── main.tsx                  # App entry point
│   │   └── vite-env.d.ts            # Vite type definitions
│   ├── .gitignore                    # Frontend git ignore
│   ├── README.md                     # Frontend documentation
│   ├── eslint.config.js              # ESLint configuration
│   ├── index.html                    # HTML template
│   ├── package-lock.json             # npm lock file
│   ├── package.json                  # npm dependencies
│   ├── postcss.config.js             # PostCSS configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── tsconfig.app.json             # TypeScript app config
│   ├── tsconfig.json                 # TypeScript base config
│   ├── tsconfig.node.json            # TypeScript node config
│   └── vite.config.ts                # Vite configuration
├── manual testing/                    # API testing files
│   ├── ClassDojo_Auth_API.postman_collection.json
│   ├── ClassDojo_Auth_Local.postman_environment.json
│   ├── Teacher_Auth_API.postman_collection.json
│   ├── Teacher_Auth_Environment.postman_environment.json
│   ├── Teacher_Auth_Testing_Guide.md
│   ├── TeacherManagement_API.postman_collection.json
│   └── shell admin creation.txt
├── templates/                         # Django HTML templates
│   ├── base.html
│   ├── core/
│   │   ├── dashboard.html
│   │   └── home.html
│   ├── emails/
│   │   └── email_verification.html
│   └── registration/
│       └── login.html
├── static/                           # Django static files
│   ├── css/
│   └── js/
├── media/                            # User uploads
├── logs/                             # Application logs
│   ├── django.log
│   └── error.log
├── venv/                             # Python virtual environment
├── backup.sql                       # Database backup
├── db.sqlite3                       # SQLite database (development)
├── IMPLEMENTATION_SUMMARY.md         # Implementation documentation
├── manage.py                         # Django management script
├── requirements.txt                  # Python dependencies
├── .env                              # Environment variables (optional)
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/v1/auth/register/parent/           # Parent registration
POST /api/v1/auth/verify-email/              # Email verification
POST /api/v1/auth/resend-verification/       # Resend verification
POST /api/v1/auth/login/                     # User login (parents & teachers)
POST /api/v1/auth/refresh/                   # JWT token refresh
GET  /api/v1/auth/health/                    # Health check
```

### Teacher Endpoints
```
POST /api/v1/auth/teacher/change-password/   # Teacher password change (first login)
GET  /api/v1/admin/teachers/                 # List all teachers (admin only)
POST /api/v1/admin/teachers/register/        # Register new teacher (admin only)
GET  /api/v1/admin/teachers/{id}/            # Get teacher details (admin only)
PUT  /api/v1/admin/teachers/{id}/            # Update teacher (admin only)
DELETE /api/v1/admin/teachers/{id}/          # Deactivate teacher (admin only)
POST /api/v1/admin/teachers/{id}/reset-password/ # Reset teacher password (admin only)
```

### API Documentation
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **OpenAPI Schema**: http://localhost:8000/swagger.json

### API Testing with Postman
The project includes Postman collections for comprehensive API testing:

**Files Location**: `/manual testing/`
- `Teacher_Auth_API.postman_collection.json` - Teacher authentication tests
- `Teacher_Auth_Environment.postman_environment.json` - Environment variables
- `Teacher_Auth_Testing_Guide.md` - Detailed testing guide

**Import Instructions**:
1. Open Postman
2. Import both collection and environment files
3. Update environment variables with your test data
4. Run individual tests or complete workflows

**Test Coverage**:
- ✅ Teacher login flow
- ✅ Password change requirements
- ✅ First login workflow
- ✅ Error handling
- ✅ JWT token management

## 🧪 Testing

### Backend Tests
```bash
cd ClassDojo-Parent-Portal
source venv/bin/activate

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test core

# Run with coverage
coverage run manage.py test
coverage report
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

## 🔧 Development Tools

### PyCharm Configuration
Debug configurations are pre-configured in `.idea/runConfigurations/`:
- **Django Debug Server**: Debug the Django development server
- **Django Tests**: Run and debug tests
- **Django Migrate**: Run database migrations
- **Django Shell**: Interactive Django shell
- **Celery Worker**: Debug Celery background tasks

### VS Code Configuration
Launch configurations are available in `.vscode/launch.json`:
- **Django: Debug Server**: Debug Django with breakpoints
- **Django: Debug Tests**: Debug test execution

### Available Commands

**Backend:**
```bash
# Database
python manage.py makemigrations       # Create migrations
python manage.py migrate              # Apply migrations
python manage.py createsuperuser      # Create admin user
python manage.py shell               # Django shell
python manage.py dbshell              # Database shell

# Development
python manage.py runserver            # Start dev server
python manage.py collectstatic        # Collect static files
python manage.py check               # Check for issues
```

**Frontend:**
```bash
# Development
npm run dev                          # Start dev server
npm run build                        # Build for production
npm run preview                      # Preview production build
npm run lint                         # Lint code (if configured)
npm run type-check                   # TypeScript check (if configured)
```

## 🐛 Troubleshooting

### Platform-Specific Issues

#### macOS/Linux Issues

**1. Backend Won't Start:**
```bash
# Check virtual environment
source venv/bin/activate
which python  # Should point to venv/bin/python

# Check Django installation
python -c "import django; print(django.get_version())"

# Check for migration issues
python manage.py showmigrations
python manage.py migrate
```

**2. Permission Issues:**
```bash
# Fix Django permissions
chmod +x manage.py

# Fix directory permissions
chmod -R 755 static/ media/ templates/
```

**3. MySQL Service Issues (macOS):**
```bash
# Check if MySQL is running
brew services list | grep mysql
brew services start mysql

# Restart if needed
brew services restart mysql
```

#### Windows-Specific Issues

**1. Virtual Environment Activation Issues:**
```powershell
# If PowerShell execution policy prevents activation
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Alternative activation methods
# PowerShell
venv\Scripts\Activate.ps1

# Command Prompt
venv\Scripts\activate.bat

# Git Bash
source venv/Scripts/activate
```

**2. Python/pip Not Found:**
```powershell
# Add Python to PATH manually
# Go to: System Properties > Environment Variables > PATH
# Add: C:\Users\YourName\AppData\Local\Programs\Python\Python313\
# Add: C:\Users\YourName\AppData\Local\Programs\Python\Python313\Scripts\

# Verify installation
python --version
pip --version
```

**3. MySQL Connection Issues (Windows):**
```powershell
# Check if MySQL service is running
Get-Service MySQL*

# Start MySQL service
net start mysql

# Or using services.msc GUI
services.msc
```

**4. Port Already in Use (Windows):**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /PID {PID} /F
```

**5. Long Path Issues (Windows):**
```powershell
# Enable long paths in Windows 10/11
# Run as Administrator
New-ItemProperty -Path "HKLM:SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Common Cross-Platform Issues

**1. Frontend Won't Start:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
# Linux/macOS:
rm -rf node_modules package-lock.json

# Windows:
rmdir /s node_modules
del package-lock.json

# Reinstall
npm install

# Check Node/npm versions
node --version  # Should be 18+
npm --version
```

**2. Database Connection Issues:**
```bash
# For SQLite (default): No setup needed
# Test Django database connection
python manage.py dbshell

# Check database settings
python manage.py check --database
```

**3. API Connection Issues:**
```bash
# Check if backend is running
# Linux/macOS:
curl http://localhost:8000/api/v1/auth/health/

# Windows (PowerShell):
Invoke-WebRequest -Uri http://localhost:8000/api/v1/auth/health/

# Check CORS settings in Django settings.py
# Ensure frontend URL is in CORS_ALLOWED_ORIGINS
```

**4. Module Not Found Errors:**
```bash
# Ensure virtual environment is activated
# Reinstall requirements
pip install -r requirements.txt

# Force reinstall if needed
pip install -r requirements.txt --force-reinstall

# Clear pip cache
pip cache purge
```

**5. SSL/TLS Certificate Issues:**
```bash
# Upgrade pip and certificates
python -m pip install --upgrade pip
pip install --upgrade certifi

# For corporate networks, disable SSL verification (temporary)
pip install -r requirements.txt --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org
```

### Environment-Specific Issues

**Development:**
- Ensure both Django (port 8000) and React (port 5173) servers are running
- Check that API URLs in frontend `.env` match backend URLs
- Verify CORS settings allow frontend domain

**Production:**
- Set `DEBUG=False` in Django settings
- Configure proper `ALLOWED_HOSTS`
- Use production database credentials
- Set up proper web server (nginx/Apache)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Validation**: Strong password requirements
- **Rate Limiting**: API request throttling
- **CORS Configuration**: Controlled cross-origin requests
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM safety
- **XSS Protection**: React's built-in XSS prevention
- **Email Verification**: Secure account activation

## 🌐 Deployment

### Environment Variables for Production

**Backend (.env):**
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
MYSQL_USER=production_user
MYSQL_PASSWORD=secure_production_password
MYSQL_DATABASE=production_db
MYSQL_HOST=your_db_host
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourdomain.com
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your_email_password
```

**Frontend (.env.production):**
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENV=production
VITE_ENABLE_DEBUG=false
```

## 📱 Features Demo

### Parent Registration Flow
1. **Visit**: http://localhost:5173
2. **Fill Form**: Complete all required fields with validation
3. **Submit**: Account created with email verification
4. **Verify**: Check console for verification email (development mode)
5. **Activate**: Click verification link to activate account

### API Testing
1. **Health Check**: GET http://localhost:8000/api/v1/auth/health/
2. **API Docs**: Visit http://localhost:8000/swagger/
3. **Admin Panel**: Visit http://localhost:8000/admin/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@classdojo.com or create an issue in the GitHub repository.

---

**Made with ❤️ by the ClassDojo Team**

