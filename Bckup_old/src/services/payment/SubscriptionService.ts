import { supabase } from '../../lib/supabase';
import { 
  SubscriptionPlan, 
  UserSubscription, 
  SubscriptionUsage, 
  PlanComparison,
  DiscountCoupon,
  BillingCycle,
  SubscriptionStatus 
} from '../../types/payment';
import { razorpayService } from './RazorpayService';

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    try {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Failed to fetch user subscription:', error);
      throw error;
    }
  }

  /**
   * Create new subscription
   */
  async createSubscription(
    userId: string, 
    planId: string, 
    couponCode?: string,
    trialDays?: number
  ): Promise<UserSubscription> {
    try {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      // Calculate pricing with coupon if provided
      let finalPrice = plan.price;
      let discountAmount = 0;

      if (couponCode) {
        const coupon = await this.validateCoupon(couponCode, planId, finalPrice);
        if (coupon) {
          discountAmount = this.calculateDiscount(coupon, finalPrice);
          finalPrice = Math.max(0, finalPrice - discountAmount);
        }
      }

      // Calculate trial and billing dates
      const now = new Date();
      const trialStart = trialDays ? now : null;
      const trialEnd = trialDays ? new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000)) : null;
      const periodStart = trialEnd || now;
      const periodEnd = this.calculatePeriodEnd(periodStart, plan.billing_cycle);

      // Create customer in Razorpay if needed
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Create Razorpay subscription
      const razorpaySubscription = await razorpayService.createSubscription(
        planId,
        userId,
        {
          name: profile.full_name,
          email: profile.email,
          contact: profile.phone,
        }
      );

      // Create subscription record
      const subscriptionData: Partial<UserSubscription> = {
        user_id: userId,
        plan_id: planId,
        status: trialDays ? 'active' : 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        trial_start: trialStart?.toISOString(),
        trial_end: trialEnd?.toISOString(),
        razorpay_subscription_id: razorpaySubscription.id,
        metadata: {
          original_price: plan.price,
          discount_amount: discountAmount,
          final_price: finalPrice,
          coupon_code: couponCode,
        }
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Update coupon usage if applied
      if (couponCode) {
        await this.incrementCouponUsage(couponCode);
      }

      // Initialize usage tracking
      await this.initializeUsageTracking(data.id, userId, periodStart, periodEnd);

      return data;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string, 
    cancelAtPeriodEnd: boolean = true,
    reason?: string
  ): Promise<UserSubscription> {
    try {
      // Get current subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Cancel in Razorpay
      if (subscription.razorpay_subscription_id) {
        await razorpayService.cancelSubscription(
          subscription.razorpay_subscription_id,
          cancelAtPeriodEnd
        );
      }

      // Update subscription record
      const updates: Partial<UserSubscription> = {
        cancel_at_period_end: cancelAtPeriodEnd,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          cancellation_reason: reason,
        }
      };

      if (!cancelAtPeriodEnd) {
        updates.status = 'cancelled';
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async changeSubscription(
    subscriptionId: string, 
    newPlanId: string,
    prorated: boolean = true
  ): Promise<UserSubscription> {
    try {
      // Get current subscription and new plan
      const [currentSub, newPlan] = await Promise.all([
        this.getSubscriptionById(subscriptionId),
        this.getPlanById(newPlanId)
      ]);

      if (!currentSub || !newPlan) {
        throw new Error('Subscription or plan not found');
      }

      // Calculate proration if needed
      let prorationAmount = 0;
      if (prorated) {
        prorationAmount = this.calculateProration(currentSub, newPlan);
      }

      // Update subscription in Razorpay
      if (currentSub.razorpay_subscription_id) {
        await razorpayService.updateSubscription(
          currentSub.razorpay_subscription_id,
          { plan_id: newPlanId }
        );
      }

      // Update subscription record
      const updates: Partial<UserSubscription> = {
        plan_id: newPlanId,
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentSub.metadata,
          previous_plan_id: currentSub.plan_id,
          change_date: new Date().toISOString(),
          proration_amount: prorationAmount,
        }
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to change subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription usage for current period
   */
  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Failed to fetch subscription usage:', error);
      throw error;
    }
  }

  /**
   * Update subscription usage
   */
  async updateUsage(
    subscriptionId: string, 
    updates: Partial<Pick<SubscriptionUsage, 
      'students_count' | 'classes_conducted' | 'storage_used_gb' | 'class_minutes_used'>>
  ): Promise<SubscriptionUsage> {
    try {
      const { data, error } = await supabase
        .from('subscription_usage')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update subscription usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform action based on plan limits
   */
  async checkPlanLimits(userId: string, action: string, value: number = 1): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('limits')
        .eq('id', subscription.plan_id)
        .single();

      const usage = await this.getSubscriptionUsage(subscription.id);
      if (!usage || !plan) return false;

      const limits = plan.limits;

      switch (action) {
        case 'add_student':
          return (usage.students_count + value) <= limits.max_students;
        case 'conduct_class':
          return (usage.classes_conducted + value) <= limits.max_classes_per_month;
        case 'use_storage':
          return (usage.storage_used_gb + value) <= limits.max_storage_gb;
        case 'class_duration':
          return (usage.class_minutes_used + value) <= limits.max_class_duration_minutes;
        case 'live_class':
          return limits.live_classes;
        case 'recording_access':
          return limits.recording_access;
        case 'analytics':
          return limits.analytics_access;
        default:
          return true;
      }
    } catch (error) {
      console.error('Failed to check plan limits:', error);
      return false;
    }
  }

  /**
   * Get plan comparison for upgrade/downgrade
   */
  async comparePlans(currentPlanId: string, targetPlanId: string): Promise<PlanComparison> {
    try {
      const [currentPlan, targetPlan] = await Promise.all([
        this.getPlanById(currentPlanId),
        this.getPlanById(targetPlanId)
      ]);

      if (!currentPlan || !targetPlan) {
        throw new Error('Plans not found');
      }

      const priceDifference = targetPlan.price - currentPlan.price;
      const isUpgrade = priceDifference > 0;
      const isDowngrade = priceDifference < 0;

      return {
        plan: targetPlan,
        currentPlan,
        isUpgrade,
        isDowngrade,
        priceDifference: Math.abs(priceDifference),
      };
    } catch (error) {
      console.error('Failed to compare plans:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  private async getSubscriptionById(subscriptionId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  private async validateCoupon(code: string, planId?: string, amount?: number): Promise<DiscountCoupon | null> {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) return null;

      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);

      // Check validity period
      if (now < validFrom || now > validUntil) return null;

      // Check usage limits
      if (data.max_uses && data.used_count >= data.max_uses) return null;

      // Check applicable plans
      if (planId && data.applicable_plans && !data.applicable_plans.includes(planId)) return null;

      // Check minimum amount
      if (amount && data.min_amount && amount < data.min_amount) return null;

      return data;
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      return null;
    }
  }

  private calculateDiscount(coupon: DiscountCoupon, amount: number): number {
    if (coupon.type === 'percentage') {
      return (amount * coupon.value) / 100;
    } else {
      return coupon.value;
    }
  }

  private async incrementCouponUsage(code: string): Promise<void> {
    await supabase.rpc('increment_coupon_usage', { coupon_code: code });
  }

  private calculatePeriodEnd(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  private calculateProration(currentSub: UserSubscription, newPlan: SubscriptionPlan): number {
    const now = new Date();
    const periodEnd = new Date(currentSub.current_period_end);
    const periodStart = new Date(currentSub.current_period_start);

    const totalPeriod = periodEnd.getTime() - periodStart.getTime();
    const remainingPeriod = periodEnd.getTime() - now.getTime();
    const remainingRatio = remainingPeriod / totalPeriod;

    // Get current plan price
    // This would need to be fetched from database in real implementation
    const currentPlanPrice = 0; // Placeholder

    const currentCredit = currentPlanPrice * remainingRatio;
    const newCharge = newPlan.price * remainingRatio;

    return newCharge - currentCredit;
  }

  private async initializeUsageTracking(
    subscriptionId: string, 
    userId: string, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<void> {
    const usageData: Partial<SubscriptionUsage> = {
      user_id: userId,
      subscription_id: subscriptionId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      students_count: 0,
      classes_conducted: 0,
      storage_used_gb: 0,
      class_minutes_used: 0,
    };

    await supabase
      .from('subscription_usage')
      .insert(usageData);
  }
}

export const subscriptionService = SubscriptionService.getInstance();