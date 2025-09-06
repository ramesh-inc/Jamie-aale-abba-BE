# cPanel Frontend Deployment Guide

Complete instructions for deploying the React frontend application to cPanel shared hosting.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn package manager
- cPanel hosting account with File Manager access
- Domain/subdomain configured in cPanel

## Frontend Application Overview

- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2
- **CSS**: Tailwind CSS 3.4.17
- **Routing**: React Router DOM (SPA)
- **Build Output**: `frontend/dist/`

## Step-by-Step Deployment Instructions

### 1. Environment Configuration

#### Create Production Environment File
Create `.env` in the `frontend/` directory:

```bash
# Production Environment Variables
VITE_API_BASE_URL=https://yourdomain.com/api/v1/
VITE_ENV=production
VITE_ENABLE_DEBUG=false
VITE_NODE_ENV=production
```

**Important Notes:**
- Replace `yourdomain.com` with your actual domain
- Ensure the API URL matches your Django backend deployment
- Use HTTPS for production
- Keep trailing slash in API URL

#### Backup Development Settings
Before deployment, backup your current `.env`:
```bash
cp frontend/.env frontend/.env.development
```

### 2. Build the Application

Navigate to the frontend directory and build:

```bash
cd frontend
npm install          # Ensure all dependencies are installed
npm run build        # Creates optimized production build
```

#### Verify Build Output
Check that `frontend/dist/` contains:
- `index.html` (main entry point)
- `assets/` folder with optimized CSS/JS files
- Any static assets from `public/`

### 3. cPanel Upload Process

#### Option A: File Manager (Recommended)
1. Log into your cPanel account
2. Open **File Manager**
3. Navigate to `public_html/` (or your domain's document root)
4. Delete any existing files (if this is a fresh deployment)
5. Upload the entire contents of `frontend/dist/` to `public_html/`
6. Extract/unzip if uploaded as archive

#### Option B: FTP Client
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect to your hosting account
3. Navigate to `public_html/`
4. Upload all files from `frontend/dist/` to the root directory

### 4. Configure SPA Routing

Since this is a Single Page Application with client-side routing, create `.htaccess` in `public_html/`:

```apache
RewriteEngine On

# Handle Angular/React Router
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy strict-origin-when-cross-origin
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

### 5. Domain and DNS Configuration

#### For Main Domain
- Upload files directly to `public_html/`
- Frontend will be accessible at `https://yourdomain.com`

#### For Subdomain
1. Create subdomain in cPanel (e.g., `app.yourdomain.com`)
2. Upload files to the subdomain's document root
3. Update `.env` file accordingly

### 6. SSL Configuration

#### Enable SSL in cPanel
1. Go to **SSL/TLS** in cPanel
2. Enable **Force HTTPS Redirect**
3. Install SSL certificate (Let's Encrypt is often available)
4. Verify HTTPS works for your domain

### 7. Final Configuration Checks

#### Update Backend CORS Settings
Ensure your Django backend (`settings.py`) includes your domain:

```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    # Add any other production domains
]

CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
]

# For production, disable CORS_ALLOW_ALL_ORIGINS
CORS_ALLOW_ALL_ORIGINS = False
```

#### Update Frontend API Configuration
Verify your production `.env` file has the correct backend URL:
```bash
VITE_API_BASE_URL=https://yourdomain.com/api/v1/
```

### 8. Testing Deployment

#### Basic Functionality Test
1. Visit your domain in browser
2. Check that the application loads
3. Test user registration/login
4. Verify API calls work (check browser DevTools Network tab)

#### Route Testing
Test key routes manually:
- `/login` - Login page
- `/parent/dashboard` - Parent dashboard
- `/teacher/dashboard` - Teacher dashboard  
- `/admin/dashboard` - Admin dashboard

#### Mobile Responsiveness
- Test on mobile devices
- Verify responsive design works correctly

### 9. Performance Optimization

#### Enable Compression
The `.htaccess` file above includes compression settings for better performance.

#### Monitor Loading Times
- Use browser DevTools to check load times
- Consider using CDN if loading is slow
- Monitor bundle sizes in DevTools Network tab

### 10. Maintenance and Updates

#### Development Workflow
1. Make changes in development
2. Test locally with `npm run dev`
3. Build with `npm run build`
4. Upload new `dist/` contents to cPanel

#### Backup Strategy
- Keep backups of working deployments
- Version your `.env` files
- Document any custom `.htaccess` modifications

## Troubleshooting Common Issues

### 404 Errors on Routes
- Ensure `.htaccess` is configured correctly
- Check that all React Router routes fall back to `index.html`
- Verify file permissions (755 for directories, 644 for files)

### API Connection Issues
- Check CORS settings in Django backend
- Verify `VITE_API_BASE_URL` in production `.env`
- Check browser console for CORS errors
- Ensure SSL certificates are valid

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Blank Page After Deployment
- Check browser console for JavaScript errors
- Verify all files uploaded correctly
- Check file permissions
- Ensure `.htaccess` doesn't have syntax errors

### Authentication Issues
- Check JWT token handling in browser localStorage
- Verify API endpoints are accessible
- Check for mixed content errors (HTTP/HTTPS)

## Environment Variables Reference

### Development (.env.development)
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1/
VITE_ENV=development
VITE_ENABLE_DEBUG=true
VITE_NODE_ENV=development
```

### Production (.env)
```bash
VITE_API_BASE_URL=https://yourdomain.com/api/v1/
VITE_ENV=production
VITE_ENABLE_DEBUG=false
VITE_NODE_ENV=production
```

## Security Considerations

- Never commit production `.env` files to version control
- Use HTTPS for all production deployments
- Enable security headers in `.htaccess`
- Regularly update dependencies: `npm audit fix`
- Monitor for security vulnerabilities

## File Structure After Deployment

```
public_html/
├── index.html                 # Main entry point
├── assets/
│   ├── index-[hash].css      # Compiled CSS
│   ├── index-[hash].js       # Compiled JavaScript
│   └── [other-assets]        # Fonts, images, etc.
├── .htaccess                 # Apache configuration
└── [static-files]            # Any additional static files
```

This completes the frontend deployment process. The React application will be accessible at your domain and will communicate with your Django backend API.