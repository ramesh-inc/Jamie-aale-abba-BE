#!/bin/bash
# Backup health check script for Jamie Aale Abba application
# Usage: ./backup_health_check.sh

# Configuration - UPDATE THESE VALUES
BACKUP_DIR="/backups/jamie-aale-abba"
TODAY=$(date +%Y%m%d)
ADMIN_EMAIL="admin@jamiaaaleabba.co.uk"
APP_NAME="jamie-aale-abba"

# Log function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Email notification function
send_alert() {
    local subject="$1"
    local message="$2"
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ADMIN_EMAIL"
        log_message "Alert sent: $subject"
    else
        log_message "WARNING: Mail command not available. Alert not sent: $subject"
    fi
}

log_message "Starting backup health check for $APP_NAME..."

# Initialize status variables
ISSUES_FOUND=0
HEALTH_REPORT=""

# 1. CHECK IF TODAY'S DATABASE BACKUP EXISTS
log_message "Checking for today's database backup..."
DB_BACKUP=$(find "$BACKUP_DIR/database/daily" -name "*${TODAY}*.sql.gz" 2>/dev/null | head -1)

if [ -z "$DB_BACKUP" ]; then
    log_message "ERROR: No database backup found for today ($TODAY)"
    HEALTH_REPORT="$HEALTH_REPORT\n- Missing database backup for $TODAY"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    send_alert "Backup Alert - Missing Database Backup" "No database backup found for today ($TODAY). Please check the backup system."
else
    log_message "Database backup found: $DB_BACKUP"
    
    # Check database backup size
    DB_SIZE=$(stat -c%s "$DB_BACKUP" 2>/dev/null)
    if [ "$DB_SIZE" -lt 1048576 ]; then  # Less than 1MB
        log_message "WARNING: Database backup size is suspiciously small: $DB_SIZE bytes"
        HEALTH_REPORT="$HEALTH_REPORT\n- Database backup size is small: $DB_SIZE bytes"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        send_alert "Backup Alert - Small Database Backup" "Database backup size is suspiciously small: $DB_SIZE bytes. File: $DB_BACKUP"
    else
        DB_SIZE_MB=$((DB_SIZE / 1048576))
        log_message "Database backup size: ${DB_SIZE_MB}MB (OK)"
    fi
    
    # Test backup integrity
    log_message "Testing database backup integrity..."
    gunzip -t "$DB_BACKUP" 2>/dev/null
    if [ $? -ne 0 ]; then
        log_message "ERROR: Database backup integrity check failed"
        HEALTH_REPORT="$HEALTH_REPORT\n- Database backup integrity check failed"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        send_alert "Backup Alert - Corrupted Database Backup" "Database backup integrity check failed. File may be corrupted: $DB_BACKUP"
    else
        log_message "Database backup integrity: OK"
    fi
fi

# 2. CHECK IF TODAY'S MEDIA BACKUP EXISTS
log_message "Checking for today's media backup..."
MEDIA_BACKUP=$(find "$BACKUP_DIR/media/daily" -name "*${TODAY}*.tar.gz" 2>/dev/null | head -1)

if [ -z "$MEDIA_BACKUP" ]; then
    log_message "WARNING: No media backup found for today ($TODAY)"
    HEALTH_REPORT="$HEALTH_REPORT\n- Missing media backup for $TODAY"
    # Don't count as critical issue if media directory doesn't exist
    if [ -d "/var/www/jamie-aale-abba/media" ]; then
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        send_alert "Backup Alert - Missing Media Backup" "No media backup found for today ($TODAY). Please check the backup system."
    fi
else
    log_message "Media backup found: $MEDIA_BACKUP"
    
    # Check media backup size
    MEDIA_SIZE=$(stat -c%s "$MEDIA_BACKUP" 2>/dev/null)
    MEDIA_SIZE_MB=$((MEDIA_SIZE / 1048576))
    log_message "Media backup size: ${MEDIA_SIZE_MB}MB"
fi

# 3. CHECK APPLICATION FILES BACKUP
log_message "Checking for today's application files backup..."
APP_BACKUP=$(find "$BACKUP_DIR/daily" -name "*${TODAY}*.tar.gz" 2>/dev/null | head -1)

if [ -z "$APP_BACKUP" ]; then
    log_message "WARNING: No application files backup found for today ($TODAY)"
    HEALTH_REPORT="$HEALTH_REPORT\n- Missing application files backup for $TODAY"
else
    log_message "Application files backup found: $APP_BACKUP"
    APP_SIZE=$(stat -c%s "$APP_BACKUP" 2>/dev/null)
    APP_SIZE_MB=$((APP_SIZE / 1048576))
    log_message "Application files backup size: ${APP_SIZE_MB}MB"
fi

# 4. CHECK DISK SPACE
log_message "Checking backup disk space..."
if [ -d "$BACKUP_DIR" ]; then
    DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    log_message "Backup disk usage: ${DISK_USAGE}%"
    
    if [ "$DISK_USAGE" -gt 85 ]; then
        log_message "WARNING: Backup disk usage is high: ${DISK_USAGE}%"
        HEALTH_REPORT="$HEALTH_REPORT\n- High disk usage: ${DISK_USAGE}%"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        send_alert "Backup Alert - Low Disk Space" "Backup disk usage is at ${DISK_USAGE}%. Consider cleaning old backups or expanding storage."
    fi
else
    log_message "ERROR: Backup directory does not exist: $BACKUP_DIR"
    HEALTH_REPORT="$HEALTH_REPORT\n- Backup directory missing: $BACKUP_DIR"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    send_alert "Backup Alert - Backup Directory Missing" "Backup directory does not exist: $BACKUP_DIR"
fi

# 5. CHECK BACKUP AGE (ensure backups are recent)
log_message "Checking backup freshness..."
if [ ! -z "$DB_BACKUP" ]; then
    # Get backup file modification time
    BACKUP_AGE=$(find "$DB_BACKUP" -mtime +1 2>/dev/null)
    if [ ! -z "$BACKUP_AGE" ]; then
        log_message "WARNING: Database backup is more than 1 day old"
        HEALTH_REPORT="$HEALTH_REPORT\n- Database backup is old (>1 day)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# 6. CHECK WEEKLY AND MONTHLY BACKUPS
CURRENT_WEEKDAY=$(date +%u)
CURRENT_DAY=$(date +%d)

# Check for weekly backup on Monday (after Sunday backup)
if [ "$CURRENT_WEEKDAY" -eq 1 ]; then
    WEEKLY_BACKUP=$(find "$BACKUP_DIR/database/weekly" -name "*$(date -d 'yesterday' +%Y%m%d)*" 2>/dev/null | head -1)
    if [ -z "$WEEKLY_BACKUP" ]; then
        log_message "INFO: Expected weekly backup not found (checking after Sunday)"
    else
        log_message "Weekly backup found: $WEEKLY_BACKUP"
    fi
fi

# Check for monthly backup on 2nd day of month (after 1st backup)
if [ "$CURRENT_DAY" -eq 2 ]; then
    MONTHLY_BACKUP=$(find "$BACKUP_DIR/database/monthly" -name "*$(date -d 'yesterday' +%Y%m%d)*" 2>/dev/null | head -1)
    if [ -z "$MONTHLY_BACKUP" ]; then
        log_message "INFO: Expected monthly backup not found (checking after 1st)"
    else
        log_message "Monthly backup found: $MONTHLY_BACKUP"
    fi
fi

# 7. GENERATE HEALTH REPORT
log_message "Generating health report..."

if [ "$ISSUES_FOUND" -eq 0 ]; then
    log_message "✅ All backup health checks passed!"
    # Send success notification (optional - uncomment if desired)
    # send_alert "Backup Health Check - All Good" "All backup health checks passed for $APP_NAME on $TODAY."
else
    log_message "❌ Found $ISSUES_FOUND backup issues"
    FULL_REPORT="Backup health check found $ISSUES_FOUND issues for $APP_NAME on $TODAY:$HEALTH_REPORT"
    send_alert "Backup Health Check - Issues Found" "$FULL_REPORT"
fi

# 8. CLEANUP OLD HEALTH CHECK LOGS (if any)
find /tmp -name "backup_health_*.log" -mtime +7 -delete 2>/dev/null

log_message "Backup health check completed"

# Exit with error code if issues found
exit $ISSUES_FOUND