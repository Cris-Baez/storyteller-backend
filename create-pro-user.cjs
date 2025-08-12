const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createProUser() {
  try {
    console.log('🚀 Creando usuario PRO...');
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@cinemaai.com' },
      include: { usage: true, subscription: true }
    });
    
    if (existingUser) {
      console.log('❌ El usuario admin@cinemaai.com ya existe');
      console.log('🔄 Actualizando a plan PRO...');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'admin@cinemaai.com' },
        data: {
          plan: 'STUDIO_PRO',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
          usage: {
            upsert: {
              create: {
                videosThisWeek: 0,
                storageUsedMB: 0,
                editorUsage: 0,
                agentGenerations: 0
              },
              update: {
                videosThisWeek: 0,
                storageUsedMB: 0
              }
            }
          },
          subscription: {
            upsert: {
              create: {
                plan: 'STUDIO_PRO',
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
              },
              update: {
                plan: 'STUDIO_PRO',
                status: 'ACTIVE'
              }
            }
          }
        },
        include: { usage: true, subscription: true }
      });
      
      console.log('✅ Usuario actualizado a PRO:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        role: updatedUser.role,
        credits: updatedUser.usage ? `Videos: ${updatedUser.usage.videosThisWeek} | Storage: ${updatedUser.usage.storageUsedMB}MB` : 'N/A'
      });
      
      return;
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear nuevo usuario PRO
    const proUser = await prisma.user.create({
      data: {
        email: 'admin@cinemaai.com',
        password: hashedPassword,
        name: 'Admin CinemaAI',
        role: 'ADMIN',
        plan: 'STUDIO_PRO',
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        usage: {
          create: {
            videosThisWeek: 0,
            storageUsedMB: 0,
            editorUsage: 0,
            agentGenerations: 0
          }
        },
        subscription: {
          create: {
            plan: 'STUDIO_PRO',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
          }
        }
      },
      include: { usage: true, subscription: true }
    });
    
    console.log('✅ Usuario PRO creado exitosamente:');
    console.log({
      id: proUser.id,
      email: proUser.email,
      name: proUser.name,
      plan: proUser.plan,
      role: proUser.role,
      videosThisWeek: proUser.usage.videosThisWeek,
      storageUsedMB: proUser.usage.storageUsedMB,
      subscription: proUser.subscription.status
    });
    
    console.log('\n🎯 CREDENCIALES PARA LOGIN:');
    console.log('Email: admin@cinemaai.com');
    console.log('Password: admin123');
    console.log('Plan: STUDIO_PRO (Todas las funcionalidades)');
    console.log('Videos disponibles: Sin límite');
    
  } catch (error) {
    console.error('❌ Error creando usuario PRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProUser();
