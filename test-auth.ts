import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuth(email: string) {
  try {
    // Simular lo que hace el middleware
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        usage: true,
        profile: true,
        preferences: true
      }
    });
    
    console.log('🔍 Usuario desde Prisma:');
    console.log({
      id: user?.id,
      email: user?.email,
      name: user?.name,
      plan: user?.plan,
      subscription: user?.subscription ? {
        id: user.subscription.id,
        plan: user.subscription.plan,
        status: user.subscription.status
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth('test@cinemaai.com');
