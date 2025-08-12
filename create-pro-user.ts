import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createProUser() {
  try {
    console.log('🚀 Creando usuario PRO desde el inicio...');
    
    const email = 'pro@cinemaai.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario con plan PRO directamente
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Usuario PRO',
        plan: 'STUDIO_PRO',
        emailVerified: true,
        isActive: true
      }
    });
    
    console.log('✅ Usuario PRO creado:', {
      id: user.id,
      email: user.email,
      plan: user.plan
    });
    
    // Crear suscripción PRO activa
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'STUDIO_PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      }
    });
    
    console.log('✅ Suscripción PRO creada:', {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status
    });
    
    // Crear usage record
    await prisma.usage.create({
      data: {
        userId: user.id,
        videosThisWeek: 0
      }
    });
    
    console.log('✅ Usuario PRO completo creado!');
    console.log('📧 Email:', email);
    console.log('🔐 Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProUser();
