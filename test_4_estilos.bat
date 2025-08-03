@echo off
echo 🎬 ===== EJECUTOR DE TEST 4 ESTILOS CINEMAAI =====
echo.

echo 📋 Verificando entorno...

REM Verificar si Node.js está disponible
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado o no está en PATH
    echo 💡 Instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js disponible: 
node --version

echo.
echo 🔍 Verificando dependencias...

REM Verificar si existe package.json
if not exist "package.json" (
    echo ❌ Error: No se encuentra package.json
    echo 💡 Ejecuta este script desde la raíz del proyecto storyteller-backend
    pause
    exit /b 1
)

REM Verificar si existen node_modules
if not exist "node_modules" (
    echo ⚠️ node_modules no encontrado, instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
)

echo.
echo 🛠️ Compilando proyecto...

REM Compilar TypeScript
npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en compilación
    echo 💡 Revisa los errores de TypeScript arriba
    pause
    exit /b 1
)

echo ✅ Compilación exitosa

echo.
echo 🚀 Verificando servidor...

REM Verificar si el servidor está corriendo
curl -s http://localhost:3000/healthz >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Servidor no está corriendo
    echo 💡 Opciones:
    echo    1. Ejecutar en otra terminal: npm run dev
    echo    2. O presiona cualquier tecla para intentar iniciarlo automáticamente
    pause >nul
    
    echo 🔄 Intentando iniciar servidor...
    start /b npm run dev
    
    echo ⏳ Esperando que el servidor inicie... (30 segundos)
    timeout /t 30 /nobreak >nul
    
    curl -s http://localhost:3000/healthz >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ No se pudo iniciar el servidor automáticamente
        echo 💡 Inicia manualmente con: npm run dev
        pause
        exit /b 1
    )
)

echo ✅ Servidor disponible en http://localhost:3000

echo.
echo 🎬 ===== INICIANDO TEST DE 4 ESTILOS =====
echo.
echo 📝 Este test generará videos en los siguientes estilos:
echo    🎬 CINEMATIC - Astronauta en estación espacial (30s)
echo    🎌 ANIME - Guerrera anime con espada mágica (25s) 
echo    🎨 CARTOON - Detective cartoon investigando (24s)
echo    📺 COMMERCIAL - Chef presentando su creación (30s)
echo.
echo ⏱️ Tiempo estimado: 20-40 minutos total
echo 📁 Resultados se guardarán en: ./test_results_4_estilos/
echo.
echo 💡 Presiona cualquier tecla para continuar o Ctrl+C para cancelar...
pause >nul

echo.
echo 🎯 EJECUTANDO TEST...
echo.

REM Ejecutar el test
node test_4_estilos_completo.js
set TEST_RESULT=%errorlevel%

echo.
if %TEST_RESULT% equ 0 (
    echo 🎉 ===== TEST COMPLETADO EXITOSAMENTE =====
    echo ✅ Todos los estilos funcionan correctamente con audio
    echo 📋 Revisa los resultados en: ./test_results_4_estilos/
) else (
    echo ⚠️ ===== TEST COMPLETADO CON PROBLEMAS =====
    echo 📋 Revisa el reporte detallado en: ./test_results_4_estilos/
    echo 💡 Algunos estilos pueden requerir atención
)

echo.
echo 📁 Abriendo carpeta de resultados...
start explorer "test_results_4_estilos" 2>nul

echo.
echo 💻 ¿Quieres ver los logs del servidor? (s/n)
set /p SHOW_LOGS="Respuesta: "
if /i "%SHOW_LOGS%"=="s" (
    echo.
    echo 📊 Últimas líneas del log del servidor:
    echo ----------------------------------------
    tail -n 20 logs/all.log 2>nul || echo "No se encontraron logs recientes"
)

echo.
echo ✨ Test completado. Presiona cualquier tecla para salir...
pause >nul

exit /b %TEST_RESULT%
