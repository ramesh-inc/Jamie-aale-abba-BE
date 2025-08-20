# ClassDojo SAAS - Nursery Management Platform

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

- **macOS**: macOS 10.15+ (for Homebrew compatibility)
- **Python**: 3.13+ 
- **Node.js**: 18+ and npm
- **MySQL**: 8.0+ (optional, SQLite fallback available)
- **Git**: Version control
- **Homebrew**: Package manager for macOS

## 🍺 Initial System Setup (macOS)

### Install Homebrew and Dependencies

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

## 🏗️ Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/ramesh-inc/ClassDojo-SAAS.git
cd ClassDojo-SAAS
```

### 2. Backend Setup (Django)

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file (optional - fallback configurations are provided)
touch .env
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

```bash
# Database setup
python manage.py check                    # Verify configuration
python manage.py makemigrations          # Create migrations
python manage.py migrate                 # Apply migrations
python manage.py createsuperuser         # Create admin user

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

**Terminal 1 - Backend:**
```bash
cd ClassDojo-Parent-Portal
source venv/bin/activate
python manage.py runserver
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/swagger/
# Admin Panel: http://localhost:8000/admin/
```

**Terminal 2 - Frontend:**
```bash
cd ClassDojo-Parent-Portal/frontend
npm run dev
# Frontend App: http://localhost:5173
```

### Quick Start (Single Terminal)

```bash
# Terminal 1: Start backend
cd ClassDojo-Parent-Portal
source venv/bin/activate
python manage.py runserver &

# Terminal 2: Start frontend
cd frontend
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
ClassDojo-Parent-Portal/
├── classdojo_project/                   # Django project settings
│   ├── settings.py                     # Django configuration
│   ├── urls.py                         # Main URL routing
│   └── wsgi.py                         # WSGI application
├── core/                               # Main Django app
│   ├── accounts/                       # Authentication module
│   │   ├── views.py                   # API views
│   │   ├── serializers.py             # API serializers
│   │   ├── email_service.py           # Email functionality
│   │   ├── permissions.py             # Custom permissions
│   │   ├── utils.py                   # Utility functions
│   │   └── validators.py              # Custom validators
│   ├── models.py                      # Database models
│   └── urls.py                        # App URL routing
├── frontend/                           # React application
│   ├── src/
│   │   ├── components/                # React components
│   │   │   ├── auth/                 # Authentication components
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API services
│   │   ├── types/                    # TypeScript types
│   │   ├── utils/                    # Utility functions
│   │   └── App.tsx                   # Main app component
│   ├── public/                       # Static assets
│   ├── package.json                  # npm dependencies
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── vite.config.ts                # Vite configuration
│   └── .env                          # Environment variables
├── templates/                          # Django email templates
├── static/                            # Static files
├── media/                             # User uploads
├── logs/                              # Application logs
├── .vscode/                           # VS Code settings
├── .idea/                             # PyCharm settings
├── requirements.txt                   # Python dependencies
├── manage.py                          # Django management
├── .env                               # Environment variables (optional)
├── .gitignore                         # Git ignore rules
└── README.md                          # This file
```

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/v1/auth/register/parent/     # Parent registration
POST /api/v1/auth/verify-email/        # Email verification
POST /api/v1/auth/resend-verification/ # Resend verification
POST /api/v1/auth/login/               # User login
GET  /api/v1/auth/profile/             # User profile
GET  /api/v1/auth/health/              # Health check
```

### API Documentation
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **OpenAPI Schema**: http://localhost:8000/swagger.json

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

### Common Issues

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

**2. Frontend Won't Start:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node/npm versions
node --version  # Should be 18+
npm --version
```

**3. Database Connection Issues:**
```bash
# For SQLite (default): No setup needed
# For MySQL: Check if MySQL is running
brew services list | grep mysql
brew services start mysql

# Test Django database connection
python manage.py dbshell
```

**4. API Connection Issues:**
```bash
# Check if backend is running
curl http://localhost:8000/api/v1/auth/health/

# Check CORS settings in Django settings.py
# Ensure frontend URL is in CORS_ALLOWED_ORIGINS
```

**5. Permission Issues:**
```bash
# Fix Django permissions
chmod +x manage.py

# Fix directory permissions
chmod -R 755 static/ media/ templates/
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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@classdojo.com or create an issue in the GitHub repository.

---

**Made with ❤️ by the ClassDojo Team**