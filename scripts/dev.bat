@echo off
set "PATH=%Path%"
cd /d "%~dp0.."
npm run dev -- --host 127.0.0.1
