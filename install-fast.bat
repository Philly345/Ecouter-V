@echo off
echo Starting fast installation...
echo.

REM Clean npm cache
echo Cleaning npm cache...
npm cache clean --force

REM Copy the fast package.json
echo Switching to minimal dependencies...
copy package-fast.json package.json

REM Set npm to use faster settings
echo Configuring npm for faster installation...
npm config set audit false
npm config set fund false
npm config set optional false

REM Install with faster options
echo Installing dependencies (this may take a few minutes)...
npm install --prefer-offline --no-audit --no-fund --legacy-peer-deps

echo.
echo Installation complete!
echo You can now run: npm run dev
pause
