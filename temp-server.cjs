// Servidor temporal simple para pruebas de login
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

// Usuario de prueba
const testUser = {
  id: 1,
  email: 'test@cinemaai.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: '$2a$10$8K1p/a0dClAmy9GqEBGoC.aGd8bQqF9q5aEf7QMPfH7Xp8K7XKQKC', // password: "123456"
  plan: 'FREE',
  isEmailVerified: true,
  usage: {
    videosGenerated: 5,
    storageUsed: 1024000,
    apiCalls: 25
  }
};

// JWT Secret
const JWT_SECRET = 'your-secret-key-for-testing';

// Rutas
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: password ? '***' : 'missing' });

    // Verificar usuario
    if (email !== testUser.email) {
      console.log('Usuario no encontrado:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, testUser.password);
    console.log('Contraseña válida:', isValid);
    
    if (!isValid) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const accessToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: testUser.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Usuario sin contraseña
    const { password: _, ...userWithoutPassword } = testUser;
    
    console.log('Login exitoso para:', email);
    
    res.json({
      message: 'Login exitoso',
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60 // 7 días en segundos
      },
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;
    console.log('Register attempt:', { email, username });

    // Simular registro exitoso
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      ...testUser,
      email,
      username: username || email.split('@')[0],
      firstName: firstName || 'Usuario',
      lastName: lastName || 'Nuevo'
    };

    // Generar token
    const accessToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Usuario sin contraseña
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60
      },
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { password: _, ...userWithoutPassword } = testUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor temporal corriendo en puerto ${PORT}`);
  console.log(`📧 Usuario de prueba: test@cinemaai.com`);
  console.log(`🔑 Contraseña: 123456`);
});
