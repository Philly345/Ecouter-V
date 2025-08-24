@echo off
echo ===============================================
echo    COMPREHENSIVE AI MONITORING SYSTEM SETUP
echo ===============================================
echo.

echo [1/5] Testing Comprehensive AI Monitor...
node test-comprehensive-monitor.js
if %errorlevel% neq 0 (
    echo ERROR: Comprehensive monitoring test failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Validating Vercel Configuration...
echo Checking vercel.json for hourly cron job...
findstr "comprehensive-ai-monitor" vercel.json >nul
if %errorlevel% neq 0 (
    echo ERROR: Comprehensive monitoring cron job not found in vercel.json
    pause
    exit /b 1
)
echo ✅ Vercel cron job configured for hourly monitoring

echo.
echo [3/5] Checking API Endpoint...
if exist "pages\api\cron\comprehensive-ai-monitor.js" (
    echo ✅ Comprehensive monitoring API endpoint exists
) else (
    echo ERROR: API endpoint not found!
    pause
    exit /b 1
)

echo.
echo [4/5] Verifying Environment Variables...
if "%CRON_SECRET%"=="" (
    echo WARNING: CRON_SECRET not set - this is required for production
) else (
    echo ✅ CRON_SECRET is configured
)

if "%SMTP_SENDER%"=="" (
    echo WARNING: SMTP_SENDER not set - email notifications will fail
) else (
    echo ✅ SMTP configuration detected
)

echo.
echo [5/5] Preparing for Deployment...
echo.
echo ===============================================
echo    COMPREHENSIVE AI MONITORING SYSTEM READY
echo ===============================================
echo.
echo 🤖 SYSTEM FEATURES:
echo    ✅ Hourly comprehensive monitoring (24/7)
echo    ✅ API health checks with auto-fixing
echo    ✅ Security risk assessment
echo    ✅ Website analytics and user tracking
echo    ✅ System health monitoring
echo    ✅ File processing status checks
echo    ✅ Database connectivity monitoring
echo    ✅ Resource usage tracking
echo    ✅ External dependencies monitoring
echo    ✅ Intelligent email reports with priority levels
echo    ✅ Emergency alerts for critical failures
echo    ✅ Auto-fix capabilities for common issues
echo.
echo 📊 MONITORING SCHEDULE:
echo    - Runs every hour (0 * * * *)
echo    - Comprehensive 8-point system check
echo    - Automatic email reports after each check
echo    - Emergency alerts for critical failures
echo.
echo 📧 EMAIL NOTIFICATIONS:
echo    - ✅ ALL SYSTEMS HEALTHY (low priority)
echo    - 🔧 ISSUES AUTO-RESOLVED (normal priority)  
echo    - ⚠️ SYSTEM WARNINGS DETECTED (normal priority)
echo    - 🚨 CRITICAL SYSTEM ISSUES (high priority)
echo    - 🔥 EMERGENCY: MONITORING FAILURE (high priority)
echo.
echo 🚀 NEXT STEPS:
echo    1. Deploy to Vercel: vercel --prod
echo    2. Verify first hourly report arrives
echo    3. Monitor email notifications
echo    4. System will auto-fix issues when possible
echo.
echo 💡 BENEFITS:
echo    - Proactive issue detection and resolution
echo    - 24/7 automated monitoring without manual intervention
echo    - Intelligent auto-fixing reduces downtime
echo    - Comprehensive system visibility
echo    - Immediate alerts for critical issues
echo    - Professional monitoring reports
echo.
echo The comprehensive AI monitoring system is now ready!
echo Deploy to production to activate 24/7 monitoring.
echo.
pause