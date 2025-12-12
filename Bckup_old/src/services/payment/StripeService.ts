/**
 * Stripe Integration Service
 * Manushi Coaching Platform - Phase 74
 * Complete Stripe payment gateway integration for international payments
 */

import { 
  useStripe, 
  useConfirmPayment, 
  StripeProvider,
  initPaymentSheet,
  presentPaymentSheet
} from '@stripe/stripe-react-native';
import { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentApiResponse, 
  StripeConfig,
  PaymentError,
  SubscriptionPlan,
  UserSubscription,
  Currency
} from '../../types/payment';
import { ErrorHandler } from '../utils/ErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StripeService {
  private config: StripeConfig | null = null;
  private isInitialized = false;
  private stripe: any = null;

  constructor() {
    this.initializeConfig();
  }

  /**
   * Initialize Stripe configuration
   */
  private async initializeConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem('stripe_config');
      if (configStr) {
        this.config = JSON.parse(configStr);
        this.isInitialized = true;
      }
    } catch (error) {
      ErrorHandler.handle(error as Error, 'StripeService.initializeConfig');
    }
  }

  /**
   * Set Stripe configuration and initialize SDK
   */
  public async setConfig(config: StripeConfig): Promise<void> {
    try {
      this.config = config;
      await AsyncStorage.setItem('stripe_config', JSON.stringify(config));
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to set Stripe config: ${error}`);
    }
  }

  /**
   * Initialize Stripe SDK
   */
  public async initializeStripe(): Promise<void> {
    try {
      if (!this.config?.publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      // The actual initialization would be done in the React component
      // This method is for service-level initialization
    } catch (error) {
      throw new Error(`Failed to initialize Stripe: ${error}`);
    }
  }

  /**
   * Create payment intent
   */
  public async createPaymentIntent(request: PaymentRequest): Promise<PaymentApiResponse<any>> {
    try {
      if (!this.isInitialized || !this.config) {
        throw new Error('Stripe not initialized');
      }

      const paymentIntentData = {
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: {
          user_id: request.userId,
          order_id: request.orderId || '',
          ...request.metadata
        },
        customer: await this.getOrCreateCustomer(request.customerInfo),
        automatic_payment_methods: {
          enabled: true,
        },
      };

      const response = await this.callBackendAPI('/payments/stripe/payment-intents', {
        method: 'POST',
        body: JSON.stringify(paymentIntentData)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Process payment with Payment Sheet
   */
  public async processPaymentWithSheet(request: PaymentRequest): Promise<PaymentApiResponse<PaymentResponse>> {
    try {
      if (!this.isInitialized || !this.config) {
        throw new Error('Stripe not initialized');
      }

      // Create payment intent
      const intentResponse = await this.createPaymentIntent(request);
      if (!intentResponse.success) {
        return intentResponse;
      }

      const { client_secret, id: paymentIntentId } = intentResponse.data;

      // Initialize payment sheet
      const initResponse = await initPaymentSheet({
        merchantDisplayName: 'Manushi Coaching Platform',
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          name: request.customerInfo.name,
          email: request.customerInfo.email,
          phone: request.customerInfo.phone,
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'manushi://payment-return',
      });

      if (initResponse.error) {
        throw new Error(initResponse.error.message);
      }

      // Present payment sheet
      const paymentResponse = await presentPaymentSheet();
      
      if (paymentResponse.error) {
        if (paymentResponse.error.code === 'Canceled') {
          return {
            success: false,
            error: {
              code: 'PAYMENT_CANCELLED',
              message: 'Payment was cancelled by user'
            }
          };
        }
        throw new Error(paymentResponse.error.message);
      }

      // Confirm payment on backend
      const confirmationResponse = await this.confirmPayment(paymentIntentId);
      
      if (confirmationResponse.success) {
        const paymentResult: PaymentResponse = {
          paymentId: paymentIntentId,
          orderId: request.orderId || paymentIntentId,
          signature: '', // Stripe doesn't use signatures like Razorpay
          status: 'completed',
          amount: request.amount,
          currency: request.currency,
          gateway: 'stripe',
          gatewayTransactionId: paymentIntentId,
          metadata: request.metadata,
          createdAt: new Date().toISOString()
        };

        return {
          success: true,
          data: paymentResult
        };
      }

      return confirmationResponse;
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Process card payment directly
   */
  public async processCardPayment(
    request: PaymentRequest,
    cardDetails: any
  ): Promise<PaymentApiResponse<PaymentResponse>> {
    try {
      if (!this.isInitialized || !this.config) {
        throw new Error('Stripe not initialized');
      }

      // Create payment intent
      const intentResponse = await this.createPaymentIntent(request);
      if (!intentResponse.success) {
        return intentResponse;
      }

      const { client_secret } = intentResponse.data;

      // This would be handled in the React component with useConfirmPayment hook
      // For now, return the client secret to be used by the UI component
      return {
        success: true,
        data: {
          clientSecret: client_secret,
          paymentIntentId: intentResponse.data.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Confirm payment on backend
   */
  private async confirmPayment(paymentIntentId: string): Promise<PaymentApiResponse<any>> {
    try {
      const response = await this.callBackendAPI(`/payments/stripe/payment-intents/${paymentIntentId}/confirm`, {
        method: 'POST'
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateCustomer(customerInfo: any): Promise<string> {
    try {
      const response = await this.callBackendAPI('/payments/stripe/customers', {
        method: 'POST',
        body: JSON.stringify({
          email: customerInfo.email,
          name: customerInfo.name,
          phone: customerInfo.phone
        })
      });

      return response.id;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }
  }

  /**
   * Create subscription product and price
   */
  public async createSubscriptionPlan(plan: SubscriptionPlan): Promise<PaymentApiResponse<any>> {
    try {
      if (!this.isInitialized || !this.config) {
        throw new Error('Stripe not initialized');
      }

      // Create product
      const productData = {
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_type: plan.type,
          features: JSON.stringify(plan.features),
          limits: JSON.stringify(plan.limits)
        }
      };

      const productResponse = await this.callBackendAPI('/payments/stripe/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      // Create price
      const priceData = {
        product: productResponse.id,
        unit_amount: Math.round(plan.price * 100),
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: this.getStripeInterval(plan.billingCycle),
          interval_count: this.getIntervalCount(plan.billingCycle)
        },
        metadata: {
          plan_id: plan.id
        }
      };

      const priceResponse = await this.callBackendAPI('/payments/stripe/prices', {
        method: 'POST',
        body: JSON.stringify(priceData)
      });

      return {
        success: true,
        data: {
          product: productResponse,
          price: priceResponse
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Create subscription
   */
  public async createSubscription(
    priceId: string,
    customerId: string,
    trialDays?: number
  ): Promise<PaymentApiResponse<UserSubscription>> {
    try {
      if (!this.isInitialized || !this.config) {
        throw new Error('Stripe not initialized');
      }

      const subscriptionData: any = {
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const response = await this.callBackendAPI('/payments/stripe/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Cancel subscription
   */
  public async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<PaymentApiResponse<any>> {
    try {
      const cancelData = cancelAtPeriodEnd 
        ? { cancel_at_period_end: true }
        : { cancel_at_period_end: false };

      const response = await this.callBackendAPI(`/payments/stripe/subscriptions/${subscriptionId}`, {
        method: 'POST',
        body: JSON.stringify(cancelData)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Update subscription
   */
  public async updateSubscription(
    subscriptionId: string, 
    updates: { priceId?: string; quantity?: number }
  ): Promise<PaymentApiResponse<any>> {
    try {
      const updateData: any = {};

      if (updates.priceId) {
        // Get current subscription to update items
        const currentSub = await this.callBackendAPI(`/payments/stripe/subscriptions/${subscriptionId}`);
        updateData.items = [
          {
            id: currentSub.items.data[0].id,
            price: updates.priceId,
          },
        ];
      }

      if (updates.quantity) {
        updateData.quantity = updates.quantity;
      }

      updateData.proration_behavior = 'create_prorations';

      const response = await this.callBackendAPI(`/payments/stripe/subscriptions/${subscriptionId}`, {
        method: 'POST',
        body: JSON.stringify(updateData)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Process refund
   */
  public async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentApiResponse<any>> {
    try {
      const refundData: any = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      if (reason) {
        refundData.reason = reason;
      }

      const response = await this.callBackendAPI('/payments/stripe/refunds', {
        method: 'POST',
        body: JSON.stringify(refundData)
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Handle webhook events
   */
  public async handleWebhook(
    signature: string,
    payload: string
  ): Promise<PaymentApiResponse<any>> {
    try {
      if (!this.config?.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Verify webhook signature (would be done on backend)
      const response = await this.callBackendAPI('/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature
        }
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Get payment details
   */
  public async getPaymentDetails(paymentIntentId: string): Promise<PaymentApiResponse<any>> {
    try {
      const response = await this.callBackendAPI(`/payments/stripe/payment-intents/${paymentIntentId}`);

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Get subscription details
   */
  public async getSubscriptionDetails(subscriptionId: string): Promise<PaymentApiResponse<any>> {
    try {
      const response = await this.callBackendAPI(`/payments/stripe/subscriptions/${subscriptionId}`);

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error as Error)
      };
    }
  }

  /**
   * Convert billing cycle to Stripe interval
   */
  private getStripeInterval(cycle: string): 'day' | 'week' | 'month' | 'year' {
    const mapping: { [key: string]: 'day' | 'week' | 'month' | 'year' } = {
      'monthly': 'month',
      'quarterly': 'month',
      'half_yearly': 'month',
      'yearly': 'year'
    };
    return mapping[cycle] || 'month';
  }

  /**
   * Get interval count for billing cycle
   */
  private getIntervalCount(cycle: string): number {
    const mapping: { [key: string]: number } = {
      'monthly': 1,
      'quarterly': 3,
      'half_yearly': 6,
      'yearly': 1
    };
    return mapping[cycle] || 1;
  }

  /**
   * Call backend API
   */
  private async callBackendAPI(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const baseUrl = 'https://your-api-domain.com/api'; // Replace with your API base URL
      const token = await AsyncStorage.getItem('auth_token');

      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options?.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: Error): PaymentError {
    return {
      code: 'STRIPE_ERROR',
      message: error.message,
      description: 'An error occurred while processing the payment',
      action: 'Please try again or contact support'
    };
  }

  /**
   * Check if Stripe is available and configured
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Get supported currencies
   */
  public getSupportedCurrencies(): Currency[] {
    return ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'INR'];
  }

  /**
   * Get supported payment methods
   */
  public getSupportedPaymentMethods(): string[] {
    return [
      'card',
      'apple_pay',
      'google_pay',
      'sepa_debit',
      'sofort',
      'ideal'
    ];
  }

  /**
   * Get test mode status
   */
  public isTestMode(): boolean {
    return this.config?.publishableKey?.startsWith('pk_test_') || false;
  }
}

// Export singleton instance
export const stripeService = new StripeService();