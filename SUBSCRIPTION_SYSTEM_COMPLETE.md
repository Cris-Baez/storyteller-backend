# 💳 API de Suscripciones - StoryTeller AI Backend

Este documento describe el sistema completo de suscripciones integrado con PayPal para el backend de StoryTeller AI.

## 📋 Resumen del Sistema

El sistema de suscripciones permite a los usuarios:
- Crear suscripciones con diferentes planes (BASIC, PRO, PREMIUM, ANNUAL)
- Gestionar pagos a través de PayPal
- Cancelar y reactivar suscripciones
- Verificar límites y permisos basados en el plan
- Recibir webhooks de PayPal para actualizar estados

## 🏗️ Arquitectura

### Modelos de Base de Datos

```prisma
model Subscription {
  id                    String              @id @default(cuid())
  userId               String
  plan                 SubscriptionPlan
  status               SubscriptionStatus  @default(PENDING)
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  paypalSubscriptionId String?            @unique
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  payments             Payment[]
  
  @@map("subscriptions")
}

model Payment {
  id                String        @id @default(cuid())
  subscriptionId    String
  amount           Decimal       @db.Decimal(10,2)
  currency         String        @default("USD")
  status           PaymentStatus @default(PENDING)
  paypalPaymentId  String?
  paypalOrderId    String?
  failureReason    String?
  createdAt        DateTime      @default(now())
  subscription     Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@map("payments")
}

enum SubscriptionPlan {
  BASIC
  PRO
  PREMIUM
  ANNUAL
}

enum SubscriptionStatus {
  PENDING
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  UNPAID
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

### Servicios

1. **SubscriptionService**: Lógica de negocio para suscripciones
2. **PayPalService**: Integración con la API de PayPal
3. **ErrorHandler**: Manejo centralizado de errores

## 🔗 Endpoints de la API

### Autenticación Requerida
Todos los endpoints excepto el webhook requieren autenticación mediante JWT:
```
Authorization: Bearer <jwt-token>
```

### 1. Crear Suscripción
```http
POST /api/subscriptions
Content-Type: application/json

{
  "plan": "PRO"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Suscripción creada exitosamente",
  "data": {
    "id": "clx1234567890",
    "userId": "user123",
    "plan": "PRO",
    "status": "PENDING",
    "currentPeriodStart": "2024-01-15T10:00:00.000Z",
    "currentPeriodEnd": "2024-02-15T10:00:00.000Z",
    "paypalSubscriptionId": "I-BW452GLLEP1G",
    "cancelAtPeriodEnd": false,
    "canceledAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "payments": []
  }
}
```

### 2. Obtener Suscripción Activa
```http
GET /api/subscriptions/active
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "userId": "user123",
    "plan": "PRO",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-15T10:00:00.000Z",
    "currentPeriodEnd": "2024-02-15T10:00:00.000Z",
    "paypalSubscriptionId": "I-BW452GLLEP1G",
    "cancelAtPeriodEnd": false,
    "canceledAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "payments": [
      {
        "id": "pay123",
        "amount": 49.99,
        "currency": "USD",
        "status": "COMPLETED",
        "paypalPaymentId": "PAYID-123456",
        "paypalOrderId": null,
        "failureReason": null,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### 3. Listar Todas las Suscripciones del Usuario
```http
GET /api/subscriptions/my-subscriptions
```

### 4. Obtener Detalles de Suscripción Específica
```http
GET /api/subscriptions/:id
```

### 5. Cancelar Suscripción
```http
POST /api/subscriptions/:id/cancel
Content-Type: application/json

{
  "immediate": false
}
```

**Parámetros:**
- `immediate` (boolean, opcional): Si es `true`, cancela inmediatamente. Si es `false` o no se especifica, cancela al final del período actual.

### 6. Obtener Límites del Plan
```http
GET /api/subscriptions/plan-limits
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "videosPerMonth": 50,
    "maxDuration": 120,
    "quality": "hd"
  }
}
```

### 7. Verificar Acceso a Función
```http
GET /api/subscriptions/feature/:feature
```

**Ejemplo:**
```http
GET /api/subscriptions/feature/hd_quality
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "feature": "hd_quality",
    "canUse": true,
    "hasAccess": true
  }
}
```

### 8. Obtener URL de Aprobación PayPal
```http
GET /api/subscriptions/:id/approval-url
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "approvalUrl": "https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=...",
    "subscriptionId": "clx1234567890",
    "paypalSubscriptionId": "I-BW452GLLEP1G"
  }
}
```

### 9. Webhook PayPal
```http
POST /api/subscriptions/webhook/paypal
Content-Type: application/json
PayPal-Transmission-Id: <transmission-id>
PayPal-Cert-Id: <cert-id>
PayPal-Auth-Algo: <auth-algo>
PayPal-Transmission-Sig: <transmission-sig>
PayPal-Transmission-Time: <transmission-time>

{
  "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
  "resource": {
    "id": "I-BW452GLLEP1G",
    "status": "ACTIVE"
  }
}
```

## 📦 Planes Disponibles

### BASIC - $19.99/mes
- 20 videos por mes
- Duración máxima: 60 segundos
- Calidad: Standard (720p)
- Funciones: `basic_generation`, `standard_quality`

### PRO - $49.99/mes
- 50 videos por mes
- Duración máxima: 2 minutos
- Calidad: HD (1080p)
- Funciones: `basic_generation`, `standard_quality`, `advanced_generation`, `hd_quality`

### PREMIUM - $99.99/mes
- 200 videos por mes
- Duración máxima: 5 minutos
- Calidad: 4K
- Funciones: `basic_generation`, `standard_quality`, `advanced_generation`, `hd_quality`, `premium_features`, `4k_quality`

### ANNUAL - $599.99/año
- 500 videos por mes
- Duración máxima: 10 minutos
- Calidad: 4K
- Funciones: Todas las funciones + `annual_bonus`

## 🔧 Configuración de Variables de Entorno

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id

# PayPal Plan IDs
PAYPAL_BASIC_PLAN_ID=P-BASIC-PLAN-ID
PAYPAL_PRO_PLAN_ID=P-PRO-PLAN-ID
PAYPAL_PREMIUM_PLAN_ID=P-PREMIUM-PLAN-ID
PAYPAL_ANNUAL_PLAN_ID=P-ANNUAL-PLAN-ID

# Frontend URLs
FRONTEND_URL=https://your-frontend-domain.com
```

## 🎯 Eventos de Webhook PayPal Manejados

| Evento | Descripción | Acción |
|--------|-------------|---------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | Suscripción activada | Cambiar status a ACTIVE |
| `BILLING.SUBSCRIPTION.CANCELLED` | Suscripción cancelada | Cambiar status a CANCELED |
| `BILLING.SUBSCRIPTION.SUSPENDED` | Suscripción suspendida | Cambiar status a PAST_DUE |
| `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED` | Pago completado | Registrar pago exitoso |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | Pago falló | Registrar pago fallido, status PAST_DUE |

## 🛠️ Uso del Sistema

### Flujo Típico de Suscripción

1. **Usuario crea suscripción:** POST `/api/subscriptions` con plan deseado
2. **Sistema crea registro en BD y PayPal:** Status inicial PENDING
3. **Usuario aprueba en PayPal:** GET `/api/subscriptions/:id/approval-url` para obtener URL
4. **PayPal envía webhook ACTIVATED:** Sistema actualiza status a ACTIVE
5. **Usuario puede usar funciones:** Verificar con `/api/subscriptions/feature/:feature`

### Verificación de Permisos en el Código

```typescript
import { subscriptionService } from '../services/subscriptionService.js';

// Verificar si el usuario puede usar una función
const canUseHD = await subscriptionService.canUseFeature(userId, 'hd_quality');

if (!canUseHD) {
  throw new AppError('Tu plan no incluye calidad HD', 403);
}

// Obtener límites del plan
const limits = await subscriptionService.getUserPlanLimits(userId);
console.log(`Usuario puede generar ${limits.videosPerMonth} videos este mes`);
```

## 🚨 Manejo de Errores

El sistema incluye manejo completo de errores con códigos específicos:

- `400` - Validation errors, malformed requests
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - Subscription conflicts
- `502` - PayPal service errors
- `500` - Internal server errors

## 📊 Monitoreo y Logs

Todos los eventos importantes se loguean:
- Creación de suscripciones
- Cambios de estado
- Pagos exitosos/fallidos
- Errores de integración PayPal
- Verificaciones de permisos

## 🔐 Seguridad

- ✅ Verificación de signatures de webhooks PayPal
- ✅ Validación JWT en todas las rutas protegidas
- ✅ Verificación de ownership de recursos
- ✅ Sanitización de datos de entrada
- ✅ Rate limiting en endpoints críticos
- ✅ Logs de auditoría

## 📚 Próximos Pasos

1. Implementar notificaciones por email
2. Dashboard de administración para suscripciones
3. Métricas y analytics de suscripciones
4. Soporte para múltiples métodos de pago
5. Sistema de cupones y descuentos
6. Facturación automática y PDFs
