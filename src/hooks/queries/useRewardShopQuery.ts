/**
 * Reward Shop Query Hook
 * Fetches reward shop items for rewards.shop-preview widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export type RewardCategory = 'avatar' | 'badge' | 'theme' | 'powerup' | 'certificate' | 'physical' | 'voucher' | 'custom';
export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type RewardItemType = 'digital' | 'physical' | 'voucher';

export interface RewardShopItem {
  id: string;
  customerId: string;
  // Item details
  nameEn: string;
  nameHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  // Pricing
  costCoins: number;
  costXp: number;
  originalCostCoins: number | null;
  discountPercent: number | null;
  // Category & type
  category: RewardCategory;
  itemType: RewardItemType;
  // Visual
  icon: string | null;
  imageUrl: string | null;
  color: string | null;
  rarity: RewardRarity | null;
  // Stock & limits
  stockAvailable: number | null;
  purchaseLimit: number | null;
  // Status
  isFeatured: boolean;
  isNew: boolean;
  isLimitedTime: boolean;
  availableUntil: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface RewardShopData {
  items: RewardShopItem[];
  featuredItems: RewardShopItem[];
  newItems: RewardShopItem[];
  limitedTimeItems: RewardShopItem[];
  totalCount: number;
  featuredCount: number;
}

export function useRewardShopQuery() {
  const customerId = useCustomerId();

  return useQuery<RewardShopData>({
    queryKey: ['reward-shop', customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('reward_shop_items')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const items: RewardShopItem[] = (data || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        nameEn: item.name_en,
        nameHi: item.name_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        costCoins: item.cost_coins,
        costXp: item.cost_xp,
        originalCostCoins: item.original_cost_coins,
        discountPercent: item.discount_percent,
        category: item.category,
        itemType: item.item_type,
        icon: item.icon,
        imageUrl: item.image_url,
        color: item.color,
        rarity: item.rarity,
        stockAvailable: item.stock_available,
        purchaseLimit: item.purchase_limit,
        isFeatured: item.is_featured,
        isNew: item.is_new,
        isLimitedTime: item.is_limited_time,
        availableUntil: item.available_until,
        isActive: item.is_active,
        sortOrder: item.sort_order,
      }));

      const featuredItems = items.filter(i => i.isFeatured);
      const newItems = items.filter(i => i.isNew);
      const limitedTimeItems = items.filter(i => i.isLimitedTime);

      return {
        items,
        featuredItems,
        newItems,
        limitedTimeItems,
        totalCount: items.length,
        featuredCount: featuredItems.length,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
