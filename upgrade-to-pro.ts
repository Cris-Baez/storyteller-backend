import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeUserToPro(email: string) {
  try {
    // Primero actualizar el plan del usuario
    const user = await prisma.user.update({
      where: { email },
      data: {
        plan: 'STUDIO_PRO'
      }
    });
    
    console.log('✅ Plan de usuario actualizado:', user);
    
    // Luego crear o actualizar la suscripción
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: 'STUDIO_PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      },
      update: {
        plan: 'STUDIO_PRO',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      }
    });
    
    console.log('✅ Suscripción actualizada:', subscription);
    
    return { user, subscription };
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Email de la cuenta de test
const EMAIL = 'test@cinemaai.com';

upgradeUserToPro(EMAIL);
