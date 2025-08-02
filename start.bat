@echo off
title Storyteller AI Backend - Servidor
echo ========================================
echo    STORYTELLER AI BACKEND
echo    Iniciando servidor...
echo ========================================
echo.

cd /d "%~dp0"
node dist\index.js
