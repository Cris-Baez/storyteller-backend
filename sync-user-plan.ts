import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncUserPlan(email: string) {
  try {
    console.log('🔍 Verificando usuario:', email);
    
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
    
    console.log('📊 Estado actual:');
    console.log('  User.plan:', user.plan);
    console.log('  Subscription.plan:', user.subscription?.plan);
    console.log('  Subscription.status:', user.subscription?.status);
    
    // Si hay inconsistencia, sincronizar
    if (user.subscription && user.plan !== user.subscription.plan) {
      console.log('⚠️  Inconsistencia detectada. Sincronizando...');
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          plan: user.subscription.plan
        }
      });
      
      console.log('✅ Usuario sincronizado:');
      console.log('  Nuevo User.plan:', updatedUser.plan);
    } else {
      console.log('✅ Todo está sincronizado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserPlan('test@cinemaai.com');
