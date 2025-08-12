import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullSystemDiagnosis() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
  console.log('==========================================\n');

  try {
    // 1. VERIFICAR USUARIOS EN BASE DE DATOS
    console.log('1️⃣ USUARIOS EN BASE DE DATOS:');
    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        usage: true
      }
    });
    
    users.forEach((user, index) => {
      console.log(`   Usuario ${index + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Nombre: ${user.name}`);
      console.log(`   📋 Plan en User: ${user.plan}`);
      console.log(`   ✅ Activo: ${user.isActive}`);
      console.log(`   📧✅ Email verificado: ${user.emailVerified}`);
      if (user.subscription) {
        console.log(`   💳 Suscripción:`);
        console.log(`      Plan: ${user.subscription.plan}`);
        console.log(`      Estado: ${user.subscription.status}`);
        console.log(`      Expira: ${user.subscription.currentPeriodEnd}`);
      } else {
        console.log(`   ❌ Sin suscripción`);
      }
      if (user.usage) {
        console.log(`   📊 Uso: ${user.usage.videosThisWeek} videos esta semana`);
      }
      console.log(`   ⏰ Creado: ${user.createdAt}`);
      console.log(`   🔄 Actualizado: ${user.updatedAt}`);
      console.log('   ---\n');
    });

    // 2. VERIFICAR INCONSISTENCIAS
    console.log('2️⃣ VERIFICAR INCONSISTENCIAS:');
    const inconsistencies = users.filter(user => 
      user.subscription && user.plan !== user.subscription.plan
    );
    
    if (inconsistencies.length > 0) {
      console.log('   ⚠️  INCONSISTENCIAS ENCONTRADAS:');
      inconsistencies.forEach(user => {
        console.log(`   👤 ${user.email}:`);
        console.log(`      User.plan: ${user.plan}`);
        console.log(`      Subscription.plan: ${user.subscription?.plan}`);
      });
    } else {
      console.log('   ✅ No hay inconsistencias entre User.plan y Subscription.plan');
    }

    // 3. VERIFICAR SCHEMA
    console.log('\n3️⃣ VERIFICAR SCHEMA DE BASE DE DATOS:');
    const userFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    console.log('   Campos en tabla users:', userFields);

    // 4. TEST DE AUTENTICACIÓN SIMULADO
    console.log('\n4️⃣ TEST DE AUTENTICACIÓN:');
    for (const user of users) {
      console.log(`   Simulando login para ${user.email}:`);
      
      // Simular lo que hace el middleware de auth
      const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subscription: true,
          usage: true,
          profile: true,
          preferences: true
        }
      });
      
      console.log(`   ✅ Usuario encontrado: ${foundUser ? 'SÍ' : 'NO'}`);
      if (foundUser) {
        console.log(`   📋 Plan: ${foundUser.plan}`);
        console.log(`   💳 Tiene suscripción: ${foundUser.subscription ? 'SÍ' : 'NO'}`);
        if (foundUser.subscription) {
          console.log(`   💳 Estado suscripción: ${foundUser.subscription.status}`);
        }
      }
      console.log('   ---');
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullSystemDiagnosis();
