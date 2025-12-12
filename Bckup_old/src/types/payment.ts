export interface PaymentOptions {
  userId: string;
  amount: number;
  currency?: string;
  description: string;
  userEmail: string;
  userPhone: string;
  userName: string;
  merchantName?: string;
  logo?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'razorpay' | 'stripe' | 'upi' | 'card' | 'netbanking';
  transaction_id: string;
  order_id?: string;
  subscription_id?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  limits: PlanLimits;
  is_popular?: boolean;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface PlanLimits {
  max_students: number;
  max_classes_per_month: number;
  max_storage_gb: number;
  max_class_duration_minutes: number;
  live_classes: boolean;
  recording_access: boolean;
  analytics_access: boolean;
  priority_support: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
  razorpay_subscription_id?: string;
  stripe_subscription_id?: string;
  metadata?: Record<string, any>;
}

export interface BillingInvoice {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoice_number: string;
  issue_date: string;
  due_date: string;
  paid_at?: string;
  items: InvoiceItem[];
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate?: number;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  last_four?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
  razorpay_payment_method_id?: string;
  stripe_payment_method_id?: string;
}

export interface SubscriptionUsage {
  id: string;
  user_id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  students_count: number;
  classes_conducted: number;
  storage_used_gb: number;
  class_minutes_used: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency?: string;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  applicable_plans?: string[];
  min_amount?: number;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
  refund_id?: string;
}

export interface PaymentConfig {
  razorpay: {
    key_id: string;
    key_secret: string;
    webhook_secret: string;
  };
  stripe: {
    publishable_key: string;
    secret_key: string;
    webhook_secret: string;
  };
  supported_currencies: string[];
  min_amounts: Record<string, number>;
  max_amounts: Record<string, number>;
  tax_rates: Record<string, number>;
}

export interface BusinessMetrics {
  total_revenue: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  active_subscriptions: number;
  churned_subscriptions: number;
  new_subscriptions: number;
  average_revenue_per_user: number;
  customer_lifetime_value: number;
  payment_success_rate: number;
  refund_rate: number;
  period_start: string;
  period_end: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  provider: 'razorpay' | 'stripe';
  data: any;
  processed: boolean;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

// Utility types for API responses
export interface PaymentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form types for UI components
export interface PaymentFormData {
  amount: number;
  description: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  couponCode?: string;
  paymentMethod?: 'card' | 'upi' | 'netbanking' | 'wallet';
}

export interface SubscriptionFormData {
  planId: string;
  couponCode?: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface PlanComparison {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  isUpgrade: boolean;
  isDowngrade: boolean;
  priceDifference: number;
  prorationAmount?: number;
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum PaymentProvider {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}
