import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '../../lib/supabase';
import { PaymentTransaction, SubscriptionPlan, PaymentOptions } from '../../types/payment';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../../config/env.config';

export class RazorpayService {
  private static instance: RazorpayService;
  private keyId: string;
  private keySecret: string;

  private constructor() {
    // Read from environment variables - these will be configured in .env file
    this.keyId = RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER';
    this.keySecret = RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET';

    // Validate Razorpay credentials
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.warn('⚠️ Razorpay credentials not found in .env file - using placeholder values');
    } else {
      console.log('✅ Razorpay service initialized');
    }
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Create Razorpay order for payment
   */
  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: amount * 100, // Convert to paise
          currency,
          receipt: receipt || `order_${Date.now()}`,
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Process one-time payment
   */
  async processPayment(options: PaymentOptions): Promise<PaymentTransaction> {
    try {
      // Create order first
      const order = await this.createOrder(options.amount, options.currency);

      // Prepare Razorpay options
      const razorpayOptions = {
        description: options.description,
        image: options.logo || 'https://your-logo-url.com/logo.png',
        currency: options.currency || 'INR',
        key: this.keyId,
        amount: options.amount * 100,
        order_id: order.id,
        name: options.merchantName || 'Manushi Coaching',
        prefill: {
          email: options.userEmail,
          contact: options.userPhone,
          name: options.userName,
        },
        theme: {
          color: '#6750A4'
        },
        modal: {
          backdropclose: false,
          escape: false,
          handleback: false,
        },
      };

      // Open Razorpay checkout
      const paymentResult = await RazorpayCheckout.open(razorpayOptions);

      // Verify payment on backend
      const verificationResult = await this.verifyPayment({
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_signature: paymentResult.razorpay_signature,
      });

      // Create transaction record
      const transaction: PaymentTransaction = {
        id: paymentResult.razorpay_payment_id,
        user_id: options.userId,
        amount: options.amount,
        currency: options.currency || 'INR',
        status: verificationResult.verified ? 'completed' : 'failed',
        payment_method: 'razorpay',
        transaction_id: paymentResult.razorpay_payment_id,
        order_id: paymentResult.razorpay_order_id,
        created_at: new Date().toISOString(),
        metadata: {
          description: options.description,
          order_receipt: order.receipt,
        }
      };

      // Save transaction
      await this.saveTransaction(transaction);

      return transaction;
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Handle user cancellation
      if (error.code === 'PAYMENT_CANCELLED') {
        throw new Error('Payment was cancelled by user');
      }
      
      throw error;
    }
  }

  /**
   * Create subscription with recurring payments
   */
  async createSubscription(planId: string, userId: string, customerDetails: any) {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: {
          plan_id: planId,
          user_id: userId,
          customer_details: customerDetails,
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-razorpay-subscription', {
        body: {
          subscription_id: subscriptionId,
          cancel_at_cycle_end: cancelAtCycleEnd,
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature
   */
  private async verifyPayment(paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: paymentData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Save transaction to database
   */
  private async saveTransaction(transaction: PaymentTransaction) {
    try {
      // Map to your existing payments table structure
      const paymentRecord = {
        student_id: transaction.user_id, // Assuming user is a student
        amount: transaction.amount,
        payment_date: transaction.created_at,
        payment_method: transaction.payment_method,
        transaction_id: transaction.transaction_id,
        status: transaction.status,
        metadata: transaction.metadata
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentRecord);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save transaction:', error);
      throw error;
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(full_name, student_id)')
        .eq('student_id', userId)
        .order('payment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, notes?: any) {
    try {
      const { data, error } = await supabase.functions.invoke('process-razorpay-refund', {
        body: {
          payment_id: paymentId,
          amount: amount ? amount * 100 : undefined, // Convert to paise if specified
          notes: notes || {},
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('get-razorpay-subscription', {
        body: { subscription_id: subscriptionId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, updates: any) {
    try {
      const { data, error } = await supabase.functions.invoke('update-razorpay-subscription', {
        body: {
          subscription_id: subscriptionId,
          updates,
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }
}

export const razorpayService = RazorpayService.getInstance();