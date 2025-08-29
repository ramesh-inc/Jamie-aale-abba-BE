# Backup Scripts for Jamie Aale Abba Application

This directory contains comprehensive backup and restoration scripts for the Jamie Aale Abba nursery management system.

## Scripts Overview

### 1. `backup_jamie_aale_abba.sh`
**Main automated backup script**
- Creates daily backups of database, media files, and application code
- Implements weekly and monthly backup rotation
- Includes compression and verification
- Sends email notifications on success/failure
- Automatic cleanup of old backups

### 2. `cpanel_backup.sh`
**cPanel-specific backup script**
- Designed for shared hosting environments with limited permissions
- Lighter resource usage suitable for shared hosting
- Shorter retention period (14 days) to conserve space

### 3. `backup_health_check.sh`
**Backup monitoring and health verification**
- Checks if daily backups were created successfully
- Verifies backup file integrity and size
- Monitors disk space usage
- Sends alerts for missing or corrupted backups

### 4. `restore_database.sh`
**Database restoration utility**
- Interactive database restoration from backup files
- Creates safety backup before restoration
- Handles compressed and uncompressed backup files
- Includes service management (stop/start application)

## Setup Instructions

### 1. Make Scripts Executable
```bash
chmod +x backup_scripts/*.sh
```

### 2. Configure Scripts
Edit each script and update the configuration section at the top:

**For VPS/Dedicated Server (`backup_jamie_aale_abba.sh`):**
```bash
# Update these values:
DB_NAME="classdojo_production"
DB_USER="classdojo_prod_user" 
DB_PASSWORD="your-database-password"
ADMIN_EMAIL="admin@jamiaaaleabba.co.uk"
```

**For cPanel (`cpanel_backup.sh`):**
```bash
# Update these values:
CPANEL_USERNAME="your_cpanel_username"
DB_PASSWORD="your-database-password"
```

### 3. Create Backup Directories
```bash
# For VPS/Dedicated Server
sudo mkdir -p /backups/jamie-aale-abba/{database/{daily,weekly,monthly},media/{daily,weekly},logs,daily}
sudo chown $USER:$USER /backups/jamie-aale-abba
chmod 755 /backups/jamie-aale-abba

# For cPanel
mkdir -p /home/[username]/backups
```

### 4. Install Mail Utilities (for notifications)
```bash
# Ubuntu/Debian
sudo apt install mailutils

# CentOS/RHEL
sudo yum install mailx
```

## Usage

### Automated Backups

**Set up daily automated backups:**
```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 3:00 AM
0 3 * * * /path/to/backup_scripts/backup_jamie_aale_abba.sh

# Health check at 8:00 AM  
0 8 * * * /path/to/backup_scripts/backup_health_check.sh
```

**For cPanel:**
```bash
# In cPanel → Cron Jobs, add:
0 3 * * * /home/[username]/backup_scripts/cpanel_backup.sh >> /home/[username]/logs/backup.log 2>&1
```

### Manual Operations

**Create immediate backup:**
```bash
./backup_scripts/backup_jamie_aale_abba.sh
```

**Check backup health:**
```bash
./backup_scripts/backup_health_check.sh
```

**Restore database from backup:**
```bash
# List available backups
ls -la /backups/jamie-aale-abba/database/daily/

# Restore from specific backup
./backup_scripts/restore_database.sh /backups/jamie-aale-abba/database/daily/db_classdojo_production_20241201_030001.sql.gz
```

## Backup Strategy

### Retention Policy
- **Daily backups**: 7 days
- **Weekly backups**: 4 weeks (28 days)
- **Monthly backups**: 12 months (365 days)

### What's Backed Up
1. **Database**: Complete MySQL dump with routines, triggers, and events
2. **Media files**: User-uploaded files (images, documents)
3. **Application code**: Source code and configurations (excluding venv, cache)

### Backup Types
- **Full backup**: Database + Media + Application files
- **Incremental cleanup**: Automatic removal of old backups
- **Verification**: Integrity checks on compressed files

## Monitoring and Alerts

### Email Notifications
Scripts send email alerts for:
- ✅ Successful backup completion
- ❌ Backup failures
- ⚠️ Missing or corrupted backups
- 💾 Low disk space warnings
- 🔍 Backup integrity issues

### Health Checks
- Daily verification of backup creation
- File size and integrity validation
- Disk space monitoring
- Backup age verification

## Troubleshooting

### Common Issues

**1. Permission Errors**
```bash
# Fix script permissions
chmod +x backup_scripts/*.sh

# Fix backup directory permissions
sudo chown -R $USER:$USER /backups/jamie-aale-abba
```

**2. Database Connection Errors**
```bash
# Test database connection
mysql -u classdojo_prod_user -p -e "SELECT 1;"

# Check database credentials in scripts
```

**3. Mail Notifications Not Working**
```bash
# Install mail utilities
sudo apt install mailutils

# Test mail command
echo "Test" | mail -s "Test Subject" admin@jamiaaaleabba.co.uk
```

**4. Backup Files Too Large**
```bash
# Check backup sizes
du -sh /backups/jamie-aale-abba/

# Adjust retention periods in scripts if needed
```

### Log Files

**Check backup logs:**
```bash
# Main backup logs
tail -f /backups/jamie-aale-abba/logs/backup_$(date +%Y%m%d).log

# cPanel backup logs
tail -f /home/[username]/logs/backup.log

# Restoration logs
ls -la /tmp/restore_*.log
```

## Security Considerations

1. **Password Security**: Database passwords are stored in script files - ensure proper file permissions (600)
2. **Backup Encryption**: Consider encrypting sensitive backups for additional security
3. **Access Control**: Limit access to backup directories and scripts
4. **Network Security**: Ensure backup storage is secure and access is restricted

## Backup Testing

### Regular Testing Schedule
- **Monthly**: Test database restoration on development environment
- **Quarterly**: Full disaster recovery simulation
- **Annually**: Review and update backup procedures

### Testing Procedure
```bash
# 1. Create test restoration environment
# 2. Run restoration script with recent backup
./backup_scripts/restore_database.sh /path/to/test/backup.sql.gz

# 3. Verify data integrity and application functionality
# 4. Document any issues or improvements needed
```

## Support

For issues with these backup scripts:
1. Check the troubleshooting section above
2. Review script logs for error details
3. Verify configuration settings
4. Test components individually (database connection, file permissions, etc.)

Remember to test your backup and restoration procedures regularly to ensure they work when needed!