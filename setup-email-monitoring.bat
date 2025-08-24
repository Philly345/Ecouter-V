@echo off
echo ===============================================
echo         EMAIL CONFIGURATION SETUP
echo ===============================================
echo.
echo The monitoring system is working but needs email setup!
echo.
echo REQUIRED ENVIRONMENT VARIABLES FOR VERCEL:
echo.
echo 1. SMTP_SENDER=ecouter.transcribe@gmail.com
echo 2. SMTP_PASS=[your-gmail-app-password]
echo 3. CRON_SECRET=[random-secret-key]
echo.
echo ===============================================
echo              SETUP INSTRUCTIONS
echo ===============================================
echo.
echo STEP 1: Get Gmail App Password
echo ----------------------------------------
echo 1. Go to https://myaccount.google.com/security
echo 2. Enable 2-Factor Authentication if not enabled
echo 3. Go to "App passwords"
echo 4. Generate a new app password for "Mail"
echo 5. Copy the 16-character password
echo.
echo STEP 2: Set Vercel Environment Variables
echo ----------------------------------------
echo 1. Go to https://vercel.com/dashboard
echo 2. Select your "ecouter-project-final" project
echo 3. Go to Settings ^> Environment Variables
echo 4. Add these variables:
echo.
echo    Name: SMTP_SENDER
echo    Value: ecouter.transcribe@gmail.com
echo.
echo    Name: SMTP_PASS  
echo    Value: [paste your 16-character app password]
echo.
echo    Name: CRON_SECRET
echo    Value: monitoring-secret-2025
echo.
echo STEP 3: Redeploy (IMPORTANT!)
echo ----------------------------------------
echo After adding variables, you MUST redeploy:
echo.
echo    vercel --prod
echo.
echo This ensures the new environment variables are active.
echo.
echo ===============================================
echo                VERIFICATION
echo ===============================================
echo.
echo After setup, you should receive:
echo - First email at 9:00 PM (next hour)
echo - Then every hour at :00 minutes
echo - Subject: "✅ ALL SYSTEMS HEALTHY - AI Monitor - 9:00 PM"
echo.
echo If you don't receive emails after setup:
echo 1. Check spam folder
echo 2. Verify Gmail app password is correct
echo 3. Ensure variables are saved in Vercel
echo 4. Confirm redeployment completed
echo.
echo ===============================================
echo            QUICK SETUP LINKS
echo ===============================================
echo.
echo Gmail App Passwords: https://myaccount.google.com/apppasswords
echo Vercel Dashboard: https://vercel.com/dashboard
echo.
echo The monitoring system is ready - just needs email setup!
echo.
pause