import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createProUser() {
  try {
    console.log('🔄 Creando usuario PRO...');
    
    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@cinemaai.com' }
    });
    
    if (existingUser) {
      console.log('❌ El usuario ya existe. Actualizando a PRO...');
      
      // Actualizar usuario existente a PRO
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          plan: 'STUDIO_PRO',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true
        },
        include: {
          subscription: true,
          usage: true
        }
      });
      
      console.log('✅ Usuario actualizado a PRO:', {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.plan,
        role: updatedUser.role
      });
      
    } else {
      console.log('🆕 Creando nuevo usuario PRO...');
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Crear el usuario PRO
      const proUser = await prisma.user.create({
        data: {
          email: 'admin@cinemaai.com',
          password: hashedPassword,
          name: 'Admin PRO',
          plan: 'STUDIO_PRO',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
          
          // Crear suscripción PRO activa
          subscription: {
            create: {
              plan: 'STUDIO_PRO',
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
            }
          },
          
          // Crear usage con límites PRO
          usage: {
            create: {
              videosThisWeek: 0,
              weekResetDate: new Date(),
              storageUsedMB: 0,
              editorUsage: 0,
              agentGenerations: 0
            }
          },
          
          // Crear perfil
          profile: {
            create: {
              company: 'CinemaAI'
            }
          },
          
          // Crear preferencias
          preferences: {
            create: {
              emailNotifications: true,
              marketingEmails: false
            }
          }
        },
        include: {
          subscription: true,
          usage: true,
          profile: true,
          preferences: true
        }
      });
      
      console.log('✅ Usuario PRO creado exitosamente:');
      console.log({
        id: proUser.id,
        email: proUser.email,
        name: proUser.name,
        plan: proUser.plan,
        role: proUser.role,
        subscription: {
          plan: proUser.subscription?.plan,
          status: proUser.subscription?.status
        }
      });
    }
    
    console.log('');
    console.log('🎉 CREDENCIALES DEL USUARIO PRO:');
    console.log('📧 Email: admin@cinemaai.com');
    console.log('🔐 Password: admin123');
    console.log('🚀 Plan: STUDIO_PRO (Sin límites)');
    console.log('👑 Role: ADMIN');
    
  } catch (error) {
    console.error('❌ Error creando usuario PRO:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProUser()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
