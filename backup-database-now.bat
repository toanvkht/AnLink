@echo off
REM Manual Database Backup Script
REM Creates a timestamped backup of the AnLink database

setlocal enabledelayedexpansion

REM Get current timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

REM Set backup filename
set BACKUP_FILE=database\backups\anlink_backup_%TIMESTAMP%.sql

echo ========================================
echo AnLink Database Backup
echo ========================================
echo.
echo Backing up database to: %BACKUP_FILE%
echo.

REM Create backup using pg_dump
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d anlink_dev_clone -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Backup completed successfully!
    echo File: %BACKUP_FILE%
    echo ========================================

    REM Get file size
    for %%A in ("%BACKUP_FILE%") do set SIZE=%%~zA
    echo Size: !SIZE! bytes
) else (
    echo.
    echo ========================================
    echo Backup FAILED!
    echo Error code: %ERRORLEVEL%
    echo ========================================
)

echo.
pause
