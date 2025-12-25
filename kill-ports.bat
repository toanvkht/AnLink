@echo off
echo Killing processes on ports 3000 and 5000...

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO (
    echo Killing process %%P on port 3000
    taskkill /F /PID %%P 2>nul
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5000') DO (
    echo Killing process %%P on port 5000
    taskkill /F /PID %%P 2>nul
)

echo Done!
pause
