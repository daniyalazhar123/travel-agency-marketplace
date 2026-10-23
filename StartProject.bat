@echo off
echo Starting Travel Agency Project...

:: Backend Window
start cmd /k "cd /d D:\Desktop\websites\travel agency\backend && echo BACKEND STARTED... && python -m uvicorn main:app --reload --port 8000"

:: Frontend Window
start cmd /k "cd /d D:\Desktop\websites\travel agency\frontend && echo FRONTEND STARTED... && npm run dev"

echo Both servers are starting in new windows!
timeout /t 5