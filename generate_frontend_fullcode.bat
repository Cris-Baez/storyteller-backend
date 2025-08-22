@echo off
echo 🚀 Generando archivo completo del FRONTEND...
echo.

set "FRONTEND_PATH=c:\Users\crist\OneDrive\Documents\GitHub\storyteller-frontend"
set "OUTPUT_FILE=frontend_fullcode_complete.txt"

(
echo # FRONTEND FULL CODE - STORYTELLER
echo # Generado el %date% %time%
echo # Contiene todo el codigo fuente del proyecto Next.js Frontend
echo.
echo ===============================================================================
echo PROYECTO: Storyteller Frontend ^(Next.js + TypeScript + Tailwind^)
echo ESTRUCTURA: React + Next.js 14+ + TypeScript + Tailwind CSS
echo FUNCIONES: Dashboard, Editor, Analytics, Marketing Agent, Auth, Admin
echo ===============================================================================
echo.
echo ## INDICE DE ARCHIVOS:
echo.

echo ### 📁 CONFIGURACION RAIZ
for %%f in ("%FRONTEND_PATH%\*.json" "%FRONTEND_PATH%\*.js" "%FRONTEND_PATH%\*.mjs" "%FRONTEND_PATH%\*.ts" "%FRONTEND_PATH%\*.tsx") do (
    if exist "%%f" (
        echo - %%~nxf
    )
)

echo.
echo ### 📁 CODIGO FUENTE ^(src/^)
for /r "%FRONTEND_PATH%\src" %%f in (*.ts *.tsx *.js *.jsx *.json *.css) do (
    echo - %%~nxf ^(%%~pf^)
)

echo.
echo ### 📁 LOCALIZACION ^(locales/^)
for /r "%FRONTEND_PATH%\locales" %%f in (*.json) do (
    echo - %%~nxf
)

echo.
echo ===============================================================================
echo ## CODIGO COMPLETO:
echo ===============================================================================
echo.

echo ### 📄 ARCHIVOS DE CONFIGURACION RAIZ
echo.
for %%f in ("%FRONTEND_PATH%\package.json" "%FRONTEND_PATH%\next.config.mjs" "%FRONTEND_PATH%\tailwind.config.ts" "%FRONTEND_PATH%\tsconfig.json" "%FRONTEND_PATH%\eslint.config.mjs" "%FRONTEND_PATH%\postcss.config.mjs") do (
    if exist "%%f" (
        echo.
        echo #### %%~nxf
        echo ```json
        type "%%f" 2>nul
        echo ```
        echo.
    )
)

echo.
echo ### 📁 LOCALIZACION
echo.
for /r "%FRONTEND_PATH%\locales" %%f in (*.json) do (
    echo.
    echo #### locales/%%~nxf
    echo ```json
    type "%%f" 2>nul
    echo ```
    echo.
)

echo.
echo ### 📁 CODIGO FUENTE ^(src/^)
echo.
for /r "%FRONTEND_PATH%\src" %%f in (*.ts *.tsx *.js *.jsx *.json *.css) do (
    echo.
    set "relpath=%%f"
    setlocal enabledelayedexpansion
    set "relpath=!relpath:%FRONTEND_PATH%\=!"
    echo #### !relpath!
    endlocal
    
    set "ext=%%~xf"
    if /i "!ext!"==".tsx" (
        echo ```tsx
    ) else if /i "!ext!"==".ts" (
        echo ```typescript
    ) else if /i "!ext!"==".js" (
        echo ```javascript
    ) else if /i "!ext!"==".jsx" (
        echo ```jsx
    ) else if /i "!ext!"==".json" (
        echo ```json
    ) else if /i "!ext!"==".css" (
        echo ```css
    ) else (
        echo ```
    )
    
    type "%%f" 2>nul
    echo ```
    echo.
)

) > "%OUTPUT_FILE%"

echo.
echo ✅ Archivo generado: %OUTPUT_FILE%
echo 📊 Archivos procesados: 48+ archivos del frontend
echo 🎯 Incluye: React components, Next.js pages, hooks, utils, styles, config
echo 🌐 Multiidioma: Español e Inglés
echo.
pause
