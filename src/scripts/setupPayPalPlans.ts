/**
 * 🎯 UTILIDAD PARA CREAR PLANES EN PAYPAL
 * Crea productos y planes con precios exactos según flujo.txt
 */

import { paypalService } from '../services/paypalService.js';
import { PLAN_CONFIGS } from '../config/plans.js';

export async function setupPayPalPlans() {
  console.log('🏗️ Configurando planes de PayPal...');

  try {
    // Crear producto base de StoryTeller AI
    const product = await paypalService.createProduct(
      'StoryTeller AI',
      'Generador de videos cinematográficos con IA'
    );

    console.log('✅ Producto creado:', product.id);

    // Crear planes según configuración
    for (const [planKey, config] of Object.entries(PLAN_CONFIGS)) {
      // Solo crear planes pagados (STARTER es gratis)
      if (config.price > 0) {
        try {
          const plan = await paypalService.createPlan({
            product_id: product.id,
            name: config.name,
            description: `Plan ${config.name} - ${config.videosPerWeek === Infinity ? 'Videos ilimitados' : config.videosPerWeek + ' videos'} por semana`,
            price: config.price.toString(),
            currency: config.currency,
            interval: config.interval
          });

          console.log(`✅ Plan ${planKey} creado:`, plan.id);
          console.log(`   💰 Precio: $${config.price}/mes`);
          console.log(`   📹 Límite: ${config.videosPerWeek === Infinity ? 'Ilimitado' : config.videosPerWeek} videos/semana`);
          console.log(`   🎨 Características: ${config.features.join(', ')}`);
          console.log('');

        } catch (error) {
          console.error(`❌ Error creando plan ${planKey}:`, error);
        }
      } else {
        console.log(`⚡ Plan ${planKey}: GRATUITO (sin PayPal)`);
      }
    }

    console.log('✅ Configuración de planes completada');

  } catch (error) {
    console.error('❌ Error configurando PayPal:', error);
    throw error;
  }
}

/**
 * 🎯 SCRIPT PARA EJECUTAR SETUP DE PLANES
 * Ejecutar con: npm run setup-paypal-plans
 */
if (require.main === module) {
  setupPayPalPlans()
    .then(() => {
      console.log('🎉 Setup completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Setup falló:', error);
      process.exit(1);
    });
}
