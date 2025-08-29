#!/bin/bash
# Comprehensive backup script for Jamie Aale Abba application
# Usage: ./backup_jamie_aale_abba.sh

# Configuration - UPDATE THESE VALUES FOR YOUR ENVIRONMENT
APP_NAME="jamie-aale-abba"
BACKUP_BASE_DIR="/backups/$APP_NAME"
APP_DIR="/var/www/$APP_NAME"
DATE=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)
LOG_FILE="$BACKUP_BASE_DIR/logs/backup_$DATE_ONLY.log"

# Database Configuration - UPDATE THESE VALUES
DB_NAME="classdojo_production"
DB_USER="classdojo_prod_user"
DB_PASSWORD="very-secure-database-password"
DB_HOST="localhost"

# Email Configuration (for notifications) - UPDATE THIS
ADMIN_EMAIL="admin@jamiaaaleabba.co.uk"

# Create backup directories if they don't exist
mkdir -p "$BACKUP_BASE_DIR"/{database/{daily,weekly,monthly},media/{daily,weekly},logs,daily}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to send notification email
send_notification() {
    local subject="$1"
    local message="$2"
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ADMIN_EMAIL"
    else
        log_message "WARNING: Mail command not available. Install mailutils for notifications."
    fi
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
    --exclude="$APP_DIR/frontend/node_modules" \
    --exclude="$APP_DIR/frontend/dist" \
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