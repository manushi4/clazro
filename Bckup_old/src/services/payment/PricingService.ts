/**
 * Pricing Service
 * Manushi Coaching Platform - Phase 74
 * Dynamic pricing, discount management, and promotional campaigns
 */

import { 
  PricingRule, 
  DiscountCode, 
  SubscriptionPlan, 
  Currency, 
  PaymentApiResponse,
  PlanType
} from '../../types/payment';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { ErrorHandler } from '../utils/ErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class PricingService {
  private readonly STORAGE_KEYS = {
    PRICING_CACHE: 'pricing_cache',
    DISCOUNT_CACHE: 'discount_cache',
    LOCATION_RATES: 'location_rates_cache'
  };

  /**
   * Get dynamic pricing for a plan based on user location and conditions
   */
  public async getDynamicPricing(
    planId: string,
    userId?: string,
    location?: string,
    userType?: string
  ): Promise<PaymentApiResponse<{ originalPrice: number; finalPrice: number; discounts: any[] }>> {
    try {
      // Get base plan
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        throw error;
      }

      const basePlan = plan as SubscriptionPlan;
      let finalPrice = basePlan.price;
      const appliedDiscounts = [];

      // Apply location-based pricing
      if (location) {
        const locationDiscount = await this.getLocationDiscount(location, basePlan.price);
        if (locationDiscount > 0) {
          finalPrice -= locationDiscount;
          appliedDiscounts.push({
            type: 'location',
            description: `Location discount for ${location}`,
            amount: locationDiscount
          });
        }
      }

      // Apply user type discounts
      if (userType) {
        const userTypeDiscount = await this.getUserTypeDiscount(userType, basePlan.price);
        if (userTypeDiscount > 0) {
          finalPrice -= userTypeDiscount;
          appliedDiscounts.push({
            type: 'user_type',
            description: `${userType} discount`,
            amount: userTypeDiscount
          });
        }
      }

      // Apply bulk pricing if applicable
      if (userId) {
        const bulkDiscount = await this.getBulkDiscount(userId, basePlan.price);
        if (bulkDiscount > 0) {
          finalPrice -= bulkDiscount;
          appliedDiscounts.push({
            type: 'bulk',
            description: 'Bulk purchase discount',
            amount: bulkDiscount
          });
        }
      }

      // Apply seasonal discounts
      const seasonalDiscount = await this.getSeasonalDiscount(basePlan.price);
      if (seasonalDiscount > 0) {
        finalPrice -= seasonalDiscount;
        appliedDiscounts.push({
          type: 'seasonal',
          description: 'Seasonal discount',
          amount: seasonalDiscount
        });
      }

      // Ensure final price is not negative
      finalPrice = Math.max(finalPrice, 0);

      return {
        success: true,
        data: {
          originalPrice: basePlan.price,
          finalPrice: Math.round(finalPrice * 100) / 100,
          discounts: appliedDiscounts
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRICING_CALCULATION_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Validate and apply discount code
   */
  public async applyDiscountCode(
    code: string,
    planId: string,
    userId: string,
    amount: number
  ): Promise<PaymentApiResponse<{ discountAmount: number; finalAmount: number; discountDetails: DiscountCode }>> {
    try {
      // Get discount code details
      const { data: discountData, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'INVALID_DISCOUNT_CODE',
            message: 'Invalid or expired discount code'
          }
        };
      }

      const discount = discountData as DiscountCode;

      // Check if discount is still valid
      if (!this.isDiscountValid(discount)) {
        return {
          success: false,
          error: {
            code: 'DISCOUNT_EXPIRED',
            message: 'This discount code has expired'
          }
        };
      }

      // Check usage limits
      if (discount.currentUses >= discount.maxUses) {
        return {
          success: false,
          error: {
            code: 'DISCOUNT_LIMIT_REACHED',
            message: 'This discount code has reached its usage limit'
          }
        };
      }

      // Check if plan is applicable
      if (discount.applicablePlans.length > 0 && !discount.applicablePlans.includes(planId)) {
        return {
          success: false,
          error: {
            code: 'DISCOUNT_NOT_APPLICABLE',
            message: 'This discount code is not applicable to the selected plan'
          }
        };
      }

      // Check restrictions
      if (discount.restrictions.minAmount && amount < discount.restrictions.minAmount) {
        return {
          success: false,
          error: {
            code: 'MINIMUM_AMOUNT_NOT_MET',
            message: `Minimum amount of ${discount.restrictions.minAmount} required for this discount`
          }
        };
      }

      if (discount.restrictions.maxAmount && amount > discount.restrictions.maxAmount) {
        return {
          success: false,
          error: {
            code: 'MAXIMUM_AMOUNT_EXCEEDED',
            message: `Maximum amount of ${discount.restrictions.maxAmount} exceeded for this discount`
          }
        };
      }

      // Check if first-time user only
      if (discount.restrictions.firstTimeOnly) {
        const isFirstTime = await this.isFirstTimeUser(userId);
        if (!isFirstTime) {
          return {
            success: false,
            error: {
              code: 'NOT_FIRST_TIME_USER',
              message: 'This discount is only valid for first-time users'
            }
          };
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.type === 'percentage') {
        discountAmount = (amount * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }

      // Apply maximum discount limit if set
      if (discount.restrictions.maxAmount && discountAmount > discount.restrictions.maxAmount) {
        discountAmount = discount.restrictions.maxAmount;
      }

      const finalAmount = Math.max(amount - discountAmount, 0);

      // Update usage count
      await supabase
        .from('discount_codes')
        .update({ current_uses: discount.currentUses + 1 })
        .eq('id', discount.id);

      // Log discount usage
      await this.logDiscountUsage(discount.id, userId, discountAmount);

      return {
        success: true,
        data: {
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalAmount: Math.round(finalAmount * 100) / 100,
          discountDetails: discount
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_APPLICATION_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Create new discount code
   */
  public async createDiscountCode(
    discountData: Omit<DiscountCode, 'id' | 'currentUses' | 'createdAt'>
  ): Promise<PaymentApiResponse<DiscountCode>> {
    try {
      const discountCode = {
        ...discountData,
        code: discountData.code.toUpperCase(),
        current_uses: 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('discount_codes')
        .insert(discountCode)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear discount cache
      await AsyncStorage.removeItem(this.STORAGE_KEYS.DISCOUNT_CACHE);

      return {
        success: true,
        data: data as DiscountCode
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_CREATE_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get all active discount codes
   */
  public async getActiveDiscountCodes(): Promise<PaymentApiResponse<DiscountCode[]>> {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('is_active', true)
        .gte('valid_to', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data as DiscountCode[]
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_FETCH_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get pricing recommendations based on user data
   */
  public async getPricingRecommendations(
    userId: string,
    planType: PlanType
  ): Promise<PaymentApiResponse<any>> {
    try {
      // Get user profile and usage history
      const userProfile = await this.getUserProfile(userId);
      const usageHistory = await this.getUserUsageHistory(userId);

      // Get similar users' plans
      const similarUsersPlans = await this.getSimilarUsersPlans(userProfile);

      // Get current active promotions
      const activePromotions = await this.getActivePromotions(planType);

      const recommendations = {
        recommendedPlan: null,
        alternativePlans: [],
        promotions: activePromotions,
        reasoning: []
      };

      // Add recommendation logic here based on user data
      
      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RECOMMENDATIONS_ERROR',
          message: (error as Error).message
        }
      };
    }
  }

  /**
   * Get location-based discount
   */
  private async getLocationDiscount(location: string, basePrice: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('type', 'location')
        .eq('is_active', true)
        .contains('conditions', { location: [location] });

      if (error || !data || data.length === 0) {
        return 0;
      }

      const rule = data[0] as PricingRule;
      return this.calculateDiscountAmount(rule, basePrice);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get user type discount
   */
  private async getUserTypeDiscount(userType: string, basePrice: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('type', 'user_type')
        .eq('is_active', true)
        .contains('conditions', { userType: [userType] });

      if (error || !data || data.length === 0) {
        return 0;
      }

      const rule = data[0] as PricingRule;
      return this.calculateDiscountAmount(rule, basePrice);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get bulk purchase discount
   */
  private async getBulkDiscount(userId: string, basePrice: number): Promise<number> {
    try {
      // Get user's previous purchases or current subscription count
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return 0;
      }

      const subscriptionCount = data.length;

      const { data: rules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('type', 'bulk')
        .eq('is_active', true)
        .lte('conditions->minQuantity', subscriptionCount);

      if (rulesError || !rules || rules.length === 0) {
        return 0;
      }

      // Get the best bulk discount
      const bestRule = rules.reduce((best, current) => 
        current.value > best.value ? current : best
      );

      return this.calculateDiscountAmount(bestRule, basePrice);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get seasonal discount
   */
  private async getSeasonalDiscount(basePrice: number): Promise<number> {
    try {
      const currentDate = new Date().toISOString();

      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('type', 'seasonal')
        .eq('is_active', true)
        .lte('conditions->validFrom', currentDate)
        .gte('conditions->validTo', currentDate);

      if (error || !data || data.length === 0) {
        return 0;
      }

      const rule = data[0] as PricingRule;
      return this.calculateDiscountAmount(rule, basePrice);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate discount amount based on rule
   */
  private calculateDiscountAmount(rule: PricingRule, basePrice: number): number {
    if (rule.type === 'percentage') {
      return (basePrice * rule.value) / 100;
    } else {
      return rule.value;
    }
  }

  /**
   * Check if discount code is valid
   */
  private isDiscountValid(discount: DiscountCode): boolean {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);

    return now >= validFrom && now <= validTo;
  }

  /**
   * Check if user is first-time user
   */
  private async isFirstTimeUser(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) {
        return true; // Assume first-time if error
      }

      return (count || 0) === 0;
    } catch (error) {
      return true;
    }
  }

  /**
   * Log discount usage for analytics
   */
  private async logDiscountUsage(
    discountId: string,
    userId: string,
    discountAmount: number
  ): Promise<void> {
    try {
      await supabase
        .from('discount_usage_log')
        .insert({
          discount_id: discountId,
          user_id: userId,
          discount_amount: discountAmount,
          used_at: new Date().toISOString()
        });
    } catch (error) {
      ErrorHandler.handle(error as Error, 'PricingService.logDiscountUsage');
    }
  }

  /**
   * Get user profile for pricing recommendations
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return error ? {} : data;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get user usage history
   */
  private async getUserUsageHistory(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return error ? [] : data;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get similar users' plans
   */
  private async getSimilarUsersPlans(userProfile: any): Promise<any> {
    // Implementation would analyze similar users and their plan choices
    return [];
  }

  /**
   * Get active promotions for plan type
   */
  private async getActivePromotions(planType: PlanType): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true)
        .contains('applicable_plans', [planType])
        .gte('conditions->validTo', new Date().toISOString());

      return error ? [] : data;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear pricing cache
   */
  public async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.PRICING_CACHE,
        this.STORAGE_KEYS.DISCOUNT_CACHE,
        this.STORAGE_KEYS.LOCATION_RATES
      ]);
    } catch (error) {
      // Ignore cache clearing errors
    }
  }
}

// Export singleton instance
export const pricingService = new PricingService();