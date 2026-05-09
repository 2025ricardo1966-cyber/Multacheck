@echo off
setlocal

echo [dev-reset] Killing any running node.exe processes...
taskkill /F /IM node.exe >nul 2>&1

echo [dev-reset] Freeing port 3000 (npx kill-port if available)...
call npx --yes kill-port 3000 >nul 2>&1

echo [dev-reset] Freeing port 3000 (fallback netstat)...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  taskkill /F /PID %%P >nul 2>&1
)

echo [dev-reset] Starting backend...
cd backend
start cmd /k npm run dev

echo [dev-reset] Starting ACTIVE frontend (Vite)...
cd ..
cd frontend
start cmd /k npm run dev
