#!/bin/bash
# cPanel-specific backup script for Jamie Aale Abba application
# Usage: ./cpanel_backup.sh

# Configuration - UPDATE THESE VALUES FOR YOUR cPanel ENVIRONMENT
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/[username]/backups"  # Replace [username] with your cPanel username
CPANEL_USERNAME="[username]"           # Replace with your cPanel username

# Database Configuration - UPDATE THESE VALUES
DB_NAME="${CPANEL_USERNAME}_classdojo_prod"
DB_USER="${CPANEL_USERNAME}_django_user"
DB_PASSWORD="your-database-password"   # Replace with your database password

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_message "Starting cPanel backup process..."

# 1. DATABASE BACKUP
log_message "Creating database backup..."
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

mysqldump -u "$DB_USER" \
          -p"$DB_PASSWORD" \
          "$DB_NAME" > "$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$DB_BACKUP_FILE"
    log_message "Database backup completed: ${DB_BACKUP_FILE}.gz"
    
    # Get backup size
    DB_SIZE=$(du -h "${DB_BACKUP_FILE}.gz" | cut -f1)
    log_message "Database backup size: $DB_SIZE"
else
    log_message "ERROR: Database backup failed"
fi

# 2. MEDIA FILES BACKUP
log_message "Creating media files backup..."
MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_$DATE.tar.gz"

if [ -d "/home/$CPANEL_USERNAME/public_html/media" ]; then
    tar -czf "$MEDIA_BACKUP_FILE" \
        -C "/home/$CPANEL_USERNAME/public_html" \
        media/
    
    if [ $? -eq 0 ]; then
        log_message "Media files backup completed: $MEDIA_BACKUP_FILE"
        MEDIA_SIZE=$(du -h "$MEDIA_BACKUP_FILE" | cut -f1)
        log_message "Media files backup size: $MEDIA_SIZE"
    else
        log_message "ERROR: Media files backup failed"
    fi
else
    log_message "WARNING: Media directory not found"
fi

# 3. APPLICATION FILES BACKUP
log_message "Creating application files backup..."
APP_BACKUP_FILE="$BACKUP_DIR/app_backup_$DATE.tar.gz"

if [ -d "/home/$CPANEL_USERNAME/jamie-aale-abba" ]; then
    tar -czf "$APP_BACKUP_FILE" \
        --exclude="/home/$CPANEL_USERNAME/jamie-aale-abba/venv" \
        --exclude="/home/$CPANEL_USERNAME/jamie-aale-abba/__pycache__" \
        --exclude="/home/$CPANEL_USERNAME/jamie-aale-abba/*/__pycache__" \
        --exclude="/home/$CPANEL_USERNAME/jamie-aale-abba/.git" \
        -C "/home/$CPANEL_USERNAME" \
        jamie-aale-abba/
    
    if [ $? -eq 0 ]; then
        log_message "Application files backup completed: $APP_BACKUP_FILE"
        APP_SIZE=$(du -h "$APP_BACKUP_FILE" | cut -f1)
        log_message "Application files backup size: $APP_SIZE"
    else
        log_message "ERROR: Application files backup failed"
    fi
else
    log_message "WARNING: Application directory not found"
fi

# 4. CLEANUP OLD BACKUPS (keep 14 days due to space limitations in shared hosting)
log_message "Cleaning up old backups..."

# Clean old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +14 -delete

log_message "Backup cleanup completed"

# 5. BACKUP SUMMARY
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_message "Total backup directory size: $TOTAL_SIZE"
log_message "cPanel backup process completed"

# List created backups
log_message "Backups created:"
ls -la "$BACKUP_DIR"/*_$DATE.* 2>/dev/null | while read line; do
    log_message "$line"
done

echo "cPanel backup completed. Backups stored in: $BACKUP_DIR/"