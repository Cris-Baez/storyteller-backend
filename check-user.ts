import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPlan(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd
      } : 'Sin suscripción'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPlan('test@cinemaai.com');
