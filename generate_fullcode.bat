@echo off
echo Generando archivo completo del backend...
echo.

(
echo # BACKEND FULL CODE - STORYTELLER
echo # Generado el %date% %time%
echo # Contiene todo el codigo fuente de la carpeta src/
echo.
echo ===============================================================================

for /r "src" %%f in (*.ts *.js *.json) do (
    echo.
    echo ### %%~nxf
    echo ```typescript
    type "%%f" 2>nul
    echo ```
    echo.
)

) > backend_fullcode_complete.txt

echo.
echo ✅ Archivo generado: backend_fullcode_complete.txt
echo ℹ️  Contiene todos los archivos de src/ organizados
pause
