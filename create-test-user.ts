import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@cinemaai.com' }
    });

    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe:', existingUser.email);
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Crear usuario de prueba
    const testUser = await prisma.user.create({
      data: {
        email: 'test@cinemaai.com',
        password: hashedPassword,
        name: 'Usuario de Prueba',
        role: 'USER',
        plan: 'STARTER',
        isActive: true,
        emailVerified: true,
        profile: {
          create: {
            avatar: null,
            company: 'CinemaAI Test',
            phone: null
          }
        },
        usage: {
          create: {
            videosThisWeek: 0,
            weekResetDate: new Date()
          }
        }
      },
      include: {
        profile: true,
        usage: true
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Contraseña: 123456');
    console.log('👤 Nombre:', testUser.name);

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
