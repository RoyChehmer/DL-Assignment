@echo off
SETLOCAL

REM Step 1: Start Docker containers from subfolder
echo Starting Docker containers...
cd dockers
call docker-compose up -d
cd ..

REM Step 2: Install dependencies
echo Installing dependencies...
call npm install

echo Explanation:
echo If you want to execute the producer, execute: npm run producer XXXX (XXX for the name of the city)
echo If you want to execute the consumer, execute: npm run consumer

echo Deployment complete!
ENDLOCAL
pause
