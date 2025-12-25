@echo off
REM Automatic Database Backup Script
REM Use this with Windows Task Scheduler for automated backups

setlocal enabledelayedexpansion

REM Change to script directory
cd /d "%~dp0"

REM Configuration
set MAX_BACKUPS=7
set DB_NAME=anlink_dev_clone
set DB_USER=postgres
set BACKUP_DIR=database\backups

REM Get current timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

REM Set backup filename
set BACKUP_FILE=%BACKUP_DIR%\anlink_backup_%TIMESTAMP%.sql
set LOG_FILE=%BACKUP_DIR%\backup.log

REM Log start
echo [%date% %time%] Starting backup... >> "%LOG_FILE%"

REM Create backup
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U %DB_USER% -d %DB_NAME% -F p -f "%BACKUP_FILE%" 2>> "%LOG_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Backup successful: %BACKUP_FILE% >> "%LOG_FILE%"

    REM Clean up old backups (keep only last MAX_BACKUPS)
    for /f "skip=%MAX_BACKUPS% delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\anlink_backup_*.sql" 2^>nul') do (
        del "%BACKUP_DIR%\%%F"
        echo [%date% %time%] Deleted old backup: %%F >> "%LOG_FILE%"
    )
) else (
    echo [%date% %time%] Backup FAILED with error code: %ERRORLEVEL% >> "%LOG_FILE%"
)

echo [%date% %time%] Backup complete >> "%LOG_FILE%"
