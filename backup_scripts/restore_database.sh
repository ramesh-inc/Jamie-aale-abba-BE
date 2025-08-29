#!/bin/bash
# Database restoration script for Jamie Aale Abba application
# Usage: ./restore_database.sh <backup_file_path>

# Configuration - UPDATE THESE VALUES
DB_NAME="classdojo_production"
DB_USER="classdojo_prod_user"
DB_PASSWORD="very-secure-database-password"
DB_HOST="localhost"
APP_NAME="jamie-aale-abba"

# Function to display usage
show_usage() {
    echo "Usage: $0 <backup_file_path>"
    echo ""
    echo "Examples:"
    echo "  $0 /backups/jamie-aale-abba/database/daily/db_classdojo_production_20241201_030001.sql.gz"
    echo "  $0 /backups/jamie-aale-abba/database/weekly/db_weekly_20241201_030001.sql.gz"
    echo ""
    echo "Available backups:"
    if [ -d "/backups/jamie-aale-abba/database" ]; then
        find /backups/jamie-aale-abba/database -name "*.sql.gz" -type f | sort -r | head -10
    else
        echo "  No backup directory found at /backups/jamie-aale-abba/database"
    fi
}

# Check if backup file argument is provided
if [ $# -eq 0 ]; then
    echo "ERROR: No backup file specified"
    show_usage
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file does not exist: $BACKUP_FILE"
    show_usage
    exit 1
fi

# Log function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_message "Starting database restoration for $APP_NAME"
log_message "Backup file: $BACKUP_FILE"

# Create a restoration log
RESTORE_LOG="/tmp/restore_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$RESTORE_LOG") 2>&1

# Confirmation prompt
echo ""
echo "⚠️  WARNING: This will restore the database from the specified backup."
echo "   Current database data will be backed up before restoration."
echo ""
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_message "Restoration cancelled by user"
    exit 0
fi

# Determine if file is compressed
DECOMPRESSED_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log_message "Backup file is compressed, decompressing..."
    DECOMPRESSED_FILE="${BACKUP_FILE%.gz}"
    
    # Test compression integrity first
    gunzip -t "$BACKUP_FILE"
    if [ $? -ne 0 ]; then
        log_message "ERROR: Backup file is corrupted or not a valid gzip file"
        exit 1
    fi
    
    # Decompress
    cp "$BACKUP_FILE" "/tmp/$(basename $BACKUP_FILE)"
    gunzip "/tmp/$(basename $BACKUP_FILE)"
    DECOMPRESSED_FILE="/tmp/$(basename ${BACKUP_FILE%.gz})"
else
    DECOMPRESSED_FILE="$BACKUP_FILE"
fi

log_message "Using decompressed file: $DECOMPRESSED_FILE"

# Test database connection
log_message "Testing database connection..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    log_message "ERROR: Cannot connect to database. Check credentials."
    exit 1
fi
log_message "Database connection successful"

# Create backup of current database before restore
log_message "Creating backup of current database before restoration..."
CURRENT_BACKUP="/tmp/before_restore_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h "$DB_HOST" \
          -u "$DB_USER" \
          -p"$DB_PASSWORD" \
          --single-transaction \
          "$DB_NAME" > "$CURRENT_BACKUP"

if [ $? -eq 0 ]; then
    gzip "$CURRENT_BACKUP"
    log_message "Current database backed up to: ${CURRENT_BACKUP}.gz"
else
    log_message "WARNING: Failed to backup current database"
fi

# Stop application to prevent database writes (if systemd service exists)
if systemctl is-active --quiet "$APP_NAME"; then
    log_message "Stopping application service..."
    sudo systemctl stop "$APP_NAME"
    SERVICE_STOPPED=true
else
    log_message "Application service not running or not found"
    SERVICE_STOPPED=false
fi

# Perform database restoration
log_message "Starting database restoration..."

# Method 1: Restore to existing database (preserves users and permissions)
mysql -h "$DB_HOST" \
      -u "$DB_USER" \
      -p"$DB_PASSWORD" \
      "$DB_NAME" < "$DECOMPRESSED_FILE"

RESTORE_STATUS=$?

if [ $RESTORE_STATUS -eq 0 ]; then
    log_message "✅ Database restoration completed successfully"
    
    # Verify restoration by checking table count
    TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" | wc -l)
    log_message "Database contains $TABLE_COUNT tables after restoration"
    
else
    log_message "❌ Database restoration failed with status: $RESTORE_STATUS"
    
    # Attempt to restore from the backup we just created
    if [ -f "${CURRENT_BACKUP}.gz" ]; then
        log_message "Attempting to restore from pre-restoration backup..."
        gunzip "${CURRENT_BACKUP}.gz"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$CURRENT_BACKUP"
        if [ $? -eq 0 ]; then
            log_message "Successfully restored from pre-restoration backup"
        else
            log_message "CRITICAL: Failed to restore from pre-restoration backup!"
        fi
    fi
fi

# Restart application service if it was stopped
if [ "$SERVICE_STOPPED" = true ]; then
    log_message "Starting application service..."
    sudo systemctl start "$APP_NAME"
    
    # Wait a moment and check if service started successfully
    sleep 3
    if systemctl is-active --quiet "$APP_NAME"; then
        log_message "Application service started successfully"
    else
        log_message "WARNING: Application service failed to start"
        sudo systemctl status "$APP_NAME"
    fi
fi

# Cleanup temporary files
if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$DECOMPRESSED_FILE" ]; then
    rm -f "$DECOMPRESSED_FILE"
    log_message "Cleaned up temporary decompressed file"
fi

# Final status report
if [ $RESTORE_STATUS -eq 0 ]; then
    log_message "🎉 Database restoration completed successfully!"
    log_message "Restoration log: $RESTORE_LOG"
    log_message "Pre-restoration backup: ${CURRENT_BACKUP}.gz"
    echo ""
    echo "Next steps:"
    echo "1. Test your application functionality"
    echo "2. Check application logs for any issues"
    echo "3. Verify data integrity"
    exit 0
else
    log_message "💥 Database restoration failed!"
    log_message "Check the restoration log: $RESTORE_LOG"
    log_message "Pre-restoration backup available: ${CURRENT_BACKUP}.gz"
    exit 1
fi