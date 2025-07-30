@echo off
echo 🔧 Quick Vercel Environment Variable Fix
echo.

echo 📋 Copy these commands and run them one by one:
echo.
echo npx vercel env rm R2_BUCKET_NAME
echo npx vercel env add R2_BUCKET_NAME
echo [When prompted, enter: ecouter-transcribe-uploads]
echo.
echo npx vercel env rm R2_ACCOUNT_ID  
echo npx vercel env add R2_ACCOUNT_ID
echo [When prompted, enter: 0cb8b90d786657878cff12ff5186cae3]
echo.
echo npx vercel env rm R2_ACCESS_KEY_ID
echo npx vercel env add R2_ACCESS_KEY_ID  
echo [When prompted, enter: 15d9d7bf6c6fb498908250206b545aac]
echo.
echo npx vercel env rm R2_SECRET_ACCESS_KEY
echo npx vercel env add R2_SECRET_ACCESS_KEY
echo [When prompted, enter: 70365fc158770b17d9af0e69a7807ebce4ce6e67f89b5b5e5fd833d895f5ddee]
echo.
echo npx vercel env rm R2_PUBLIC_URL
echo npx vercel env add R2_PUBLIC_URL
echo [When prompted, enter: https://pub-fe451437d54e4dd4aff023756dc57637.r2.dev]
echo.
echo npx vercel --prod
echo.
echo ✅ After running all commands above, your app should work!
pause
