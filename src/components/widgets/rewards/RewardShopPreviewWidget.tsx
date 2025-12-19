/**
 * Reward Shop Preview Widget (rewards.shop-preview)
 * Displays featured reward shop items with coins/XP costs
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useRewardShopQuery, RewardShopItem, RewardRarity } from "../../../hooks/queries/useRewardShopQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "rewards.shop-preview";

export const RewardShopPreviewWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useRewardShopQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showFeaturedOnly = config?.showFeaturedOnly === true;
  const showPrice = config?.showPrice !== false;
  const showDiscount = config?.showDiscount !== false;
  const showRarity = config?.showRarity !== false;
  const showStock = config?.showStock !== false;
  const showBadges = config?.showBadges !== false;
  const layoutStyle = (config?.layoutStyle as string) || "cards";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;

  // Rarity colors using theme
  const getRarityColor = (rarity: RewardRarity | null) => {
    const rarityColors: Record<RewardRarity, string> = {
      common: colors.onSurfaceVariant,
      uncommon: colors.success,
      rare: colors.info,
      epic: colors.tertiary,
      legendary: colors.warning,
    };
    return rarity ? rarityColors[rarity] : colors.onSurfaceVariant;
  };

  const getRarityLabel = (rarity: RewardRarity | null) => {
    if (!rarity) return null;
    const labels: Record<RewardRarity, string> = {
      common: t("widgets.rewardShop.rarity.common", "Common"),
      uncommon: t("widgets.rewardShop.rarity.uncommon", "Uncommon"),
      rare: t("widgets.rewardShop.rarity.rare", "Rare"),
      epic: t("widgets.rewardShop.rarity.epic", "Epic"),
      legendary: t("widgets.rewardShop.rarity.legendary", "Legendary"),
    };
    return labels[rarity];
  };

  const getItemColor = (colorKey: string | null) => {
    if (!colorKey) return colors.primary;
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      avatar: "account-circle",
      badge: "shield-star",
      theme: "palette",
      powerup: "lightning-bolt",
      certificate: "certificate",
      physical: "package-variant",
      voucher: "ticket-percent",
      custom: "star",
    };
    return icons[category] || "gift";
  };

  const getLocalizedName = (item: RewardShopItem) => {
    return getLocalizedField({ name_en: item.nameEn, name_hi: item.nameHi }, 'name');
  };

  const getLocalizedDescription = (item: RewardShopItem) => {
    return getLocalizedField({ description_en: item.descriptionEn, description_hi: item.descriptionHi }, 'description');
  };

  const handleItemPress = (item: RewardShopItem) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", itemId: item.id, category: item.category });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { itemId: item.id } });
    onNavigate?.("reward-shop-item", { itemId: item.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("reward-shop");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.rewardShop.states.loading", "Loading rewards...")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>
          {t("widgets.rewardShop.states.error", "Couldn't load rewards")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.rewardShop.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="store" size={32} color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.rewardShop.states.empty", "No rewards available")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.rewardShop.states.emptyHint", "Check back soon for new items!")}
        </AppText>
      </View>
    );
  }

  // Filter items based on config
  const displayItems = showFeaturedOnly ? data.featuredItems : data.items;
  const itemsToShow = displayItems.slice(0, maxItems);


  const renderItem = (item: RewardShopItem, index: number) => {
    const itemColor = getItemColor(item.color);
    const rarityColor = getRarityColor(item.rarity);
    const hasDiscount = item.discountPercent && item.discountPercent > 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          layoutStyle === "list" ? styles.listItem : styles.cardItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handleItemPress(item)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Badges */}
        {showBadges && (item.isFeatured || item.isNew || item.isLimitedTime) && (
          <View style={styles.badgesRow}>
            {item.isFeatured && (
              <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                <Icon name="star" size={10} color={colors.onWarning} />
                {!compactMode && <AppText style={[styles.badgeText, { color: colors.onWarning }]}>
                  {t("widgets.rewardShop.badges.featured", "Featured")}
                </AppText>}
              </View>
            )}
            {item.isNew && (
              <View style={[styles.badge, { backgroundColor: colors.success }]}>
                <AppText style={[styles.badgeText, { color: colors.onSuccess }]}>
                  {t("widgets.rewardShop.badges.new", "New")}
                </AppText>
              </View>
            )}
            {item.isLimitedTime && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Icon name="clock-outline" size={10} color={colors.onError} />
                {!compactMode && <AppText style={[styles.badgeText, { color: colors.onError }]}>
                  {t("widgets.rewardShop.badges.limited", "Limited")}
                </AppText>}
              </View>
            )}
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${itemColor}15` }]}>
          <Icon name={item.icon || getCategoryIcon(item.category)} size={layoutStyle === "list" ? 24 : 28} color={itemColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "list" ? styles.listContent : styles.cardContent}>
          <AppText style={[styles.itemName, { color: colors.onSurface }]} numberOfLines={layoutStyle === "list" ? 1 : 2}>
            {getLocalizedName(item)}
          </AppText>

          {/* Rarity badge */}
          {showRarity && item.rarity && !compactMode && (
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}15` }]}>
              <AppText style={[styles.rarityText, { color: rarityColor }]}>
                {t(`widgets.rewardShop.rarity.${item.rarity}`, item.rarity)}
              </AppText>
            </View>
          )}

          {/* Price */}
          {showPrice && (
            <View style={styles.priceRow}>
              {item.costCoins > 0 && (
                <View style={styles.priceItem}>
                  <Icon name="circle-multiple" size={14} color={colors.warning} />
                  <AppText style={[styles.priceText, { color: colors.onSurface }]}>
                    {item.costCoins}
                  </AppText>
                  {showDiscount && hasDiscount && item.originalCostCoins && (
                    <AppText style={[styles.originalPrice, { color: colors.onSurfaceVariant }]}>
                      {item.originalCostCoins}
                    </AppText>
                  )}
                </View>
              )}
              {item.costXp > 0 && (
                <View style={styles.priceItem}>
                  <Icon name="star-four-points" size={14} color={colors.tertiary} />
                  <AppText style={[styles.priceText, { color: colors.onSurface }]}>
                    {item.costXp} XP
                  </AppText>
                </View>
              )}
              {showDiscount && hasDiscount && (
                <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
                  <AppText style={[styles.discountText, { color: colors.onError }]}>
                    -{item.discountPercent}%
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Stock */}
          {showStock && item.stockAvailable !== null && !compactMode && (
            <AppText style={[styles.stockText, { color: item.stockAvailable < 10 ? colors.error : colors.onSurfaceVariant }]}>
              {item.stockAvailable === 0 
                ? t("widgets.rewardShop.labels.soldOut", "Sold Out")
                : t("widgets.rewardShop.labels.stockLeft", "{{count}} left", { count: item.stockAvailable })
              }
            </AppText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Items */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {itemsToShow.map((item, index) => renderItem(item, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {itemsToShow.map((item, index) => renderItem(item, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && displayItems.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <Icon name="store" size={16} color={colors.primary} />
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.rewardShop.actions.viewAll", "Browse All Rewards ({{count}})", { count: data.totalCount })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  emptyHint: { fontSize: 11, marginTop: 4, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  
  // Layout containers
  listContainer: { gap: 10 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  
  // List item
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, position: "relative" },
  listContent: { flex: 1, gap: 4 },
  
  // Card item
  cardItem: { width: 140, padding: 12, alignItems: "center", gap: 8, position: "relative" },
  cardContent: { alignItems: "center", gap: 4, width: "100%" },
  
  // Badges
  badgesRow: { position: "absolute", top: 6, left: 6, right: 6, flexDirection: "row", gap: 4, flexWrap: "wrap", zIndex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "600" },
  
  // Icon
  iconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  
  // Item details
  itemName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  rarityText: { fontSize: 10, fontWeight: "500", textTransform: "capitalize" },
  
  // Price
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  priceItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceText: { fontSize: 13, fontWeight: "700" },
  originalPrice: { fontSize: 11, textDecorationLine: "line-through" },
  discountBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  discountText: { fontSize: 10, fontWeight: "700" },
  
  // Stock
  stockText: { fontSize: 10, fontWeight: "500" },
  
  // View All
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
