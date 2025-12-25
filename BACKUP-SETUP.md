# Database Backup Setup Guide

## Overview
This guide explains how to use the automated backup system for the AnLink database.

## Quick Start

### 1. Manual Backup (Run Anytime)
```bash
# Create a backup right now
backup-database-now.bat
```
This creates a timestamped backup in `database/backups/`

### 2. Restore from Backup
```bash
# See list of backups and restore one
restore-from-backup.bat
```

## Automated Backups

### Setup Windows Task Scheduler (Recommended)

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create New Task**
   - Click "Create Basic Task"
   - Name: "AnLink Database Backup"
   - Description: "Daily backup of AnLink database"

3. **Set Trigger**
   - Trigger: Daily
   - Start time: 2:00 AM (or your preferred time)
   - Recur every: 1 day

4. **Set Action**
   - Action: Start a program
   - Program/script: Browse to `backup-database-auto.bat`
   - Start in: `D:\IT\COMP1682 - Đồ án\AnLink`

5. **Settings**
   - ✅ Allow task to be run on demand
   - ✅ Run task as soon as possible after scheduled start is missed
   - ✅ If task fails, restart every: 1 minute

6. **Security Options**
   - Run whether user is logged on or not (optional)
   - Run with highest privileges

### Configuration

Edit `backup-database-auto.bat` to customize:
```batch
set MAX_BACKUPS=7              # Keep last 7 backups (adjust as needed)
set DB_NAME=anlink_dev_clone   # Database name
set DB_USER=postgres           # PostgreSQL user
```

## Backup Retention

The automatic backup script keeps the last **7 backups** by default and deletes older ones automatically.

To keep more or fewer backups, edit the `MAX_BACKUPS` value in `backup-database-auto.bat`.

## Backup Locations

All backups are stored in:
```
database/backups/anlink_backup_YYYY-MM-DD_HH-MM-SS.sql
```

Example:
```
database/backups/anlink_backup_2025-12-12_14-30-00.sql
```

## Testing Your Setup

1. **Test manual backup:**
   ```bash
   backup-database-now.bat
   ```

2. **Verify backup was created:**
   ```bash
   dir database\backups
   ```

3. **Test restore (CAUTION):**
   ```bash
   restore-from-backup.bat
   ```

## PostgreSQL Password Setup

If prompted for password every time, you can create a `.pgpass` file:

**Windows:** `%APPDATA%\postgresql\pgpass.conf`
```
localhost:5432:anlink_dev_clone:postgres:YOUR_PASSWORD
```

**Permissions:** Right-click → Properties → Security → Advanced → Set to allow only your user

## Logs

Automatic backups log to:
```
database/backups/backup.log
```

View recent backup activity:
```bash
type database\backups\backup.log
```

## Troubleshooting

### "pg_dump is not recognized"
Add PostgreSQL to PATH or use full path in scripts.

### "Authentication failed"
1. Set PostgreSQL password in environment variable:
   ```bash
   set PGPASSWORD=your_password
   ```
2. Or create `.pgpass` file (see above)

### Backup fails silently
Check `database/backups/backup.log` for errors.

## Best Practices

1. **Test restores regularly** - Backups are useless if they can't be restored
2. **Store backups off-site** - Copy to cloud storage or external drive weekly
3. **Monitor backup size** - Growing size indicates data growth
4. **Keep backup schedule** - Daily backups are recommended for active development

## Git Integration

The `database/backups/` directory is in `.gitignore` - backups are **not** committed to Git.

This is intentional because:
- Backup files are large
- They contain sensitive data
- Git is for code, not data

Always maintain backups separately from Git.
