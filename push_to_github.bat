@echo off
echo ===================================================
echo   TopBoost Pro - Push to GitHub Helper
echo ===================================================
echo.
echo Please make sure you have created a new empty repository 
echo on github.com first.
echo.
set /p giturl="Enter your GitHub Repository URL (e.g., https://github.com/username/repo.git): "

if "%giturl%"=="" (
    echo.
    echo Error: GitHub URL cannot be empty.
    pause
    exit /b
)

echo.
echo [1/4] Initializing Git...
git init

echo.
echo [2/4] Adding files...
git add .

echo.
echo [3/4] Creating initial commit...
git commit -m "Initial commit of full-stack TopBoost Pro clone"

echo.
echo [4/4] Pushing to GitHub...
git branch -M main
git remote add origin %giturl%
git push -u origin main

echo.
echo ===================================================
echo   Done! Your code is now uploaded to GitHub.
echo   You can now go to Render.com to deploy it!
echo ===================================================
pause
