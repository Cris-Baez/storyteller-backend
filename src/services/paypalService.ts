import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  scope: string;
}

interface PayPalSubscriptionRequest {
  plan_id: string;
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    shipping_preference?: string;
    user_action?: string;
    payment_method?: {
      payer_selected?: string;
      payee_preferred?: string;
    };
    return_url?: string;
    cancel_url?: string;
  };
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  shipping_amount: {
    currency_code: string;
    value: string;
  };
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    final_payment_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: string;
      interval_count: number;
    };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action: string;
    payment_failure_threshold: number;
  };
  taxes: {
    percentage: string;
    inclusive: boolean;
  };
}

class PayPalService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0;

  constructor() {
    const baseURL = env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  /**
   * Obtener token de acceso de PayPal
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Si tenemos un token válido, lo devolvemos
    if (this.accessToken && now < this.tokenExpiration) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post(
        `${this.client.defaults.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const data: PayPalTokenResponse = response.data;
      this.accessToken = data.access_token;
      this.tokenExpiration = now + (data.expires_in * 1000) - 60000; // 1 minuto de buffer

      return this.accessToken;
    } catch (error) {
      console.error('Error obteniendo token de PayPal:', error);
      throw new AppError('Error de autenticación con PayPal', 500);
    }
  }

  /**
   * Configurar headers con token de autorización
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Crear una suscripción en PayPal
   */
  async createSubscription(data: PayPalSubscriptionRequest): Promise<PayPalSubscriptionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const subscriptionData = {
        ...data,
        application_context: {
          brand_name: 'StoryTeller AI',
          locale: 'es-ES',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${env.FRONTEND_URL}/subscription/success`,
          cancel_url: `${env.FRONTEND_URL}/subscription/cancel`,
          ...data.application_context
        }
      };

      const response = await this.client.post('/v1/billing/subscriptions', subscriptionData, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error creando suscripción PayPal:', error.response?.data || error.message);
      throw new AppError('Error al crear suscripción en PayPal', 500);
    }
  }

  /**
   * Obtener detalles de una suscripción
   */
  async getSubscription(subscriptionId: string): Promise<PayPalSubscriptionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.client.get(`/v1/billing/subscriptions/${subscriptionId}`, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo suscripción PayPal:', error.response?.data || error.message);
      throw new AppError('Error al obtener suscripción de PayPal', 500);
    }
  }

  /**
   * Cancelar una suscripción
   */
  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const cancelData = {
        reason: immediate ? 'User requested immediate cancellation' : 'User requested cancellation at period end'
      };

      await this.client.post(
        `/v1/billing/subscriptions/${subscriptionId}/cancel`, 
        cancelData, 
        { headers }
      );
    } catch (error: any) {
      console.error('Error cancelando suscripción PayPal:', error.response?.data || error.message);
      throw new AppError('Error al cancelar suscripción en PayPal', 500);
    }
  }

  /**
   * Activar una suscripción suspendida
   */
  async activateSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const activateData = {
        reason: reason || 'Reactivating subscription'
      };

      await this.client.post(
        `/v1/billing/subscriptions/${subscriptionId}/activate`, 
        activateData, 
        { headers }
      );
    } catch (error: any) {
      console.error('Error activando suscripción PayPal:', error.response?.data || error.message);
      throw new AppError('Error al activar suscripción en PayPal', 500);
    }
  }

  /**
   * Suspender una suscripción
   */
  async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const suspendData = {
        reason: reason || 'Suspending subscription'
      };

      await this.client.post(
        `/v1/billing/subscriptions/${subscriptionId}/suspend`, 
        suspendData, 
        { headers }
      );
    } catch (error: any) {
      console.error('Error suspendiendo suscripción PayPal:', error.response?.data || error.message);
      throw new AppError('Error al suspender suscripción en PayPal', 500);
    }
  }

  /**
   * Crear un producto en PayPal
   */
  async createProduct(name: string, description: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const productData = {
        name,
        description,
        type: 'SERVICE',
        category: 'SOFTWARE',
        image_url: `${env.FRONTEND_URL}/logo.png`,
        home_url: env.FRONTEND_URL
      };

      const response = await this.client.post('/v1/catalogs/products', productData, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error creando producto PayPal:', error.response?.data || error.message);
      throw new AppError('Error al crear producto en PayPal', 500);
    }
  }

  /**
   * Crear un plan de suscripción en PayPal
   */
  async createPlan(planData: {
    product_id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    interval: 'MONTH' | 'YEAR';
  }): Promise<PayPalPlan> {
    try {
      const headers = await this.getAuthHeaders();
      
      const plan = {
        product_id: planData.product_id,
        name: planData.name,
        description: planData.description,
        billing_cycles: [
          {
            frequency: {
              interval_unit: planData.interval,
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // 0 = infinito
            pricing_scheme: {
              fixed_price: {
                value: planData.price,
                currency_code: planData.currency
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: planData.currency
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: '0',
          inclusive: false
        }
      };

      const response = await this.client.post('/v1/billing/plans', plan, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error creando plan PayPal:', error.response?.data || error.message);
      throw new AppError('Error al crear plan en PayPal', 500);
    }
  }

  /**
   * Verificar webhook signature
   */
  async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string,
    webhookId: string
  ): Promise<boolean> {
    try {
      const authHeaders = await this.getAuthHeaders();
      
      const verifyData = {
        transmission_id: headers['paypal-transmission-id'],
        cert_id: headers['paypal-cert-id'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      };

      const response = await this.client.post(
        '/v1/notifications/verify-webhook-signature', 
        verifyData, 
        { headers: authHeaders }
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error: any) {
      console.error('Error verificando webhook signature:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Obtener transacciones de una suscripción
   */
  async getSubscriptionTransactions(
    subscriptionId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      let url = `/v1/billing/subscriptions/${subscriptionId}/transactions`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_time', startDate);
      if (endDate) params.append('end_time', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.client.get(url, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo transacciones PayPal:', error.response?.data || error.message);
      throw new AppError('Error al obtener transacciones de PayPal', 500);
    }
  }
}

export const paypalService = new PayPalService();
