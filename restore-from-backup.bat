@echo off
REM Restore Database from Backup
REM Lists available backups and restores the selected one

setlocal enabledelayedexpansion

echo ========================================
echo AnLink Database Restoration
echo ========================================
echo.
echo Available backups:
echo.

REM List backups with numbers
set COUNT=0
for /f "delims=" %%F in ('dir /b /o-d "database\backups\anlink_backup_*.sql" 2^>nul') do (
    set /a COUNT+=1
    echo !COUNT!. %%F
    set "BACKUP_!COUNT!=%%F"
)

if %COUNT% EQU 0 (
    echo No backups found in database\backups\
    echo.
    pause
    exit /b 1
)

echo.
set /p CHOICE="Enter backup number to restore (or 0 to cancel): "

if "%CHOICE%"=="0" (
    echo Cancelled.
    pause
    exit /b 0
)

REM Validate choice
if %CHOICE% GTR %COUNT% (
    echo Invalid choice!
    pause
    exit /b 1
)

REM Get selected backup
call set SELECTED_BACKUP=%%BACKUP_%CHOICE%%%

echo.
echo ========================================
echo WARNING: This will OVERWRITE your current database!
echo Selected backup: %SELECTED_BACKUP%
echo ========================================
echo.
set /p CONFIRM="Type 'YES' to confirm: "

if not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1/3] Dropping existing database...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS anlink_dev_clone;"

echo [2/3] Creating fresh database...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE anlink_dev_clone;"

echo [3/3] Restoring from backup...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d anlink_dev_clone -f "database\backups\%SELECTED_BACKUP%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database restored successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Restoration FAILED!
    echo ========================================
)

echo.
pause
