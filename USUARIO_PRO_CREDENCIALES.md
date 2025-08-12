# 🎯 USUARIO PRO CREADO - CREDENCIALES DE ACCESO

## 👨‍💻 CREDENCIALES PARA TESTING

### 🔐 Datos de Login
```
Email: admin@cinemaai.com
Password: admin123
```

### 🏆 Características del Usuario PRO
- **Plan**: STUDIO_PRO
- **Role**: ADMIN
- **Status**: ACTIVE
- **Email Verificado**: ✅ Sí
- **Límites**: Sin restricciones

### 🚀 Funcionalidades Disponibles

#### ✅ Generación de Videos
- Videos ilimitados por semana
- Acceso a todos los estilos visuales
- Calidad máxima de renderizado
- Sin marcas de agua

#### ✅ Redes Sociales (NUEVO)
- Conexión de múltiples cuentas
- Publicación multi-plataforma
- Programación de posts
- Historial completo

#### ✅ Editor Avanzado
- Todas las herramientas de edición
- Export en múltiples formatos
- Efectos premium
- Audio profesional

#### ✅ Agente IA
- Generación automática
- Configuraciones avanzadas
- Análisis de tendencias
- Optimización de contenido

## 🔄 TESTING WORKFLOW

### 1. Login
```
1. Ir a http://localhost:3000/login
2. Usar credenciales: admin@cinemaai.com / admin123
3. Verificar que aparece plan STUDIO_PRO
```

### 2. Redes Sociales
```
1. Ir a http://localhost:3000/social
2. Conectar cuenta social (usar tokens de prueba)
3. Publicar video de prueba
4. Verificar historial
```

### 3. Generación de Videos
```
1. Ir a http://localhost:3000/dashboard
2. Crear nuevo proyecto
3. Generar video con IA
4. Verificar que no hay límites
```

## 🛠️ COMANDOS DE DESARROLLO

### Backend
```bash
cd storyteller-backend
npm start
# → API en http://localhost:5000
```

### Frontend
```bash
cd storyteller-frontend
npm run dev
# → App en http://localhost:3000
```

## 📊 Base de Datos

### Verificar Usuario
```sql
-- Conectar a Railway PostgreSQL
SELECT id, email, name, plan, role, "emailVerified" 
FROM users 
WHERE email = 'admin@cinemaai.com';
```

### Verificar Usage
```sql
SELECT * FROM usage 
WHERE "userId" = (SELECT id FROM users WHERE email = 'admin@cinemaai.com');
```

### Verificar Subscription  
```sql
SELECT * FROM subscriptions
WHERE "userId" = (SELECT id FROM users WHERE email = 'admin@cinemaai.com');
```

## 🔍 TROUBLESHOOTING

### Si el login no funciona:
1. Verificar que el backend está corriendo
2. Verificar conexión a base de datos
3. Limpiar localStorage del navegador
4. Verificar que el usuario existe en DB

### Si las redes sociales no cargan:
1. Verificar que los endpoints /api/social/* responden
2. Verificar token JWT en las requests
3. Verificar logs del servidor

### Para recrear el usuario:
```bash
node create-pro-user.cjs
```

---

**✅ USUARIO PRO LISTO PARA TESTING COMPLETO**
