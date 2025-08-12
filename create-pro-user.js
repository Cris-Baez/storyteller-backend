const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createProUser() {
  try {
    console.log('🚀 Creando usuario PRO...');
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@cinemaai.com' }
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
          creditsUsed: 0,
          creditsLimit: 999999
        }
      });
      
      console.log('✅ Usuario actualizado a PRO:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        role: updatedUser.role,
        credits: `${updatedUser.creditsUsed}/${updatedUser.creditsLimit}`
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
        creditsUsed: 0,
        creditsLimit: 999999,
        lastLogin: new Date()
      }
    });
    
    console.log('✅ Usuario PRO creado exitosamente:');
    console.log({
      id: proUser.id,
      email: proUser.email,
      name: proUser.name,
      plan: proUser.plan,
      role: proUser.role,
      credits: `${proUser.creditsUsed}/${proUser.creditsLimit}`,
      password: 'admin123'
    });
    
    console.log('\n🎯 CREDENCIALES PARA LOGIN:');
    console.log('Email: admin@cinemaai.com');
    console.log('Password: admin123');
    console.log('Plan: STUDIO_PRO (Todas las funcionalidades)');
    
  } catch (error) {
    console.error('❌ Error creando usuario PRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProUser();
