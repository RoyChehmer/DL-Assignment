@echo off
SETLOCAL

cd dm-interview-assignment

REM Step 1: Start Docker containers from subfolder
echo Starting Docker containers...
cd docker-compose
call docker-compose up -d
cd ..

REM Step 2: Install dependencies
echo Installing dependencies...
call npm install

REM Step 3: Execute consumer
npm run consumer

echo Deployment complete!
ENDLOCAL
pause
