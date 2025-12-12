/**
 * Card Component Library - Coaching Management Platform
 * Complete Material Design 3 Card Implementation
 * 
 * Based on coaching research design specifications
 * Implements Dashboard, Statistics, and specialized card variants
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../context/ThemeContext';
import {TitleText, BodyText, CardTitle, HeadlineText} from './Typography';
import {IconButton} from './Button';

// Design tokens from coaching research
const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
};

const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
};

const ELEVATION = {
  Level0: 0,
  Level1: 1,
  Level2: 3,
  Level3: 6,
};

// Semantic colors from coaching research
const SEMANTIC_COLORS = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

// Base Card Props
interface BaseCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
  disabled?: boolean;
  testID?: string;
}

// Base Card Component
const Card: React.FC<BaseCardProps> = ({
  children,
  onPress,
  style,
  elevation = ELEVATION.Level1,
  disabled = false,
  testID,
}) => {
  const {theme} = useTheme();

  const cardStyle = [
    styles.baseCard,
    {
      backgroundColor: theme.Surface,
      elevation: disabled ? 0 : elevation,
      shadowColor: theme.Shadow || '#000',
      shadowOffset: {width: 0, height: elevation / 2},
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        testID={testID}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
};

// Dashboard Card Props
interface DashboardCardProps extends BaseCardProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  contentPadding?: boolean;
}

// Dashboard Card Component
const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  contentPadding = true,
  ...cardProps
}) => {
  const {theme} = useTheme();

  return (
    <Card {...cardProps}>
      <View style={styles.cardHeader}>
        <View style={styles.headerContent}>
          <CardTitle color={theme.OnSurface}>
            {title}
          </CardTitle>
          {subtitle && (
            <BodyText 
              size="small" 
              color={theme.OnSurfaceVariant}
              style={styles.subtitle}>
              {subtitle}
            </BodyText>
          )}
        </View>
        {headerAction && (
          <View style={styles.headerAction}>
            {headerAction}
          </View>
        )}
      </View>
      
      <View style={contentPadding ? styles.cardContent : undefined}>
        {children}
      </View>
    </Card>
  );
};

// Statistics Card Props
interface StatisticsCardProps extends BaseCardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: string;
  color?: string;
}

// Statistics Card Component
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  ...cardProps
}) => {
  const {theme} = useTheme();
  const iconColor = color || theme.primary;

  const changeColor = change 
    ? (change.type === 'increase' ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.error)
    : undefined;

  const changeIcon = change 
    ? (change.type === 'increase' ? 'trending-up' : 'trending-down')
    : undefined;

  return (
    <Card {...cardProps}>
      <View style={styles.statisticsContent}>
        <View style={styles.statisticsHeader}>
          <View style={[styles.iconContainer, {backgroundColor: iconColor + '20'}]}>
            <Icon name={icon} size={24} color={iconColor} />
          </View>
          <BodyText 
            size="small" 
            color={theme.OnSurfaceVariant}
            style={styles.statisticsTitle}>
            {title}
          </BodyText>
        </View>
        
        <HeadlineText 
          size="medium" 
          color={theme.OnSurface}
          style={styles.statisticsValue}>
          {value}
        </HeadlineText>
        
        {change && (
          <View style={styles.changeContainer}>
            <Icon name={changeIcon} size={16} color={changeColor} />
            <BodyText size="small" color={changeColor} style={styles.changeText}>
              {Math.abs(change.value)}%
            </BodyText>
          </View>
        )}
      </View>
    </Card>
  );
};

// Action Card Props
interface ActionCardProps extends BaseCardProps {
  title: string;
  description?: string;
  icon: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

// Action Card Component
const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  variant = 'default',
  ...cardProps
}) => {
  const {theme} = useTheme();
  
  const variantColors = {
    default: theme.primary,
    success: SEMANTIC_COLORS.success,
    warning: SEMANTIC_COLORS.warning,
    error: SEMANTIC_COLORS.error,
  };

  const accentColor = variantColors[variant];

  return (
    <Card {...cardProps}>
      <View style={styles.actionCardContent}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconContainer, {backgroundColor: accentColor + '20'}]}>
            <Icon name={icon} size={32} color={accentColor} />
          </View>
          <View style={styles.actionCardText}>
            <TitleText size="medium" color={theme.OnSurface}>
              {title}
            </TitleText>
            {description && (
              <BodyText 
                size="small" 
                color={theme.OnSurfaceVariant}
                style={styles.actionDescription}>
                {description}
              </BodyText>
            )}
          </View>
        </View>
        
        {actionText && onAction && (
          <TouchableOpacity 
            style={[styles.actionButton, {borderColor: accentColor}]}
            onPress={onAction}
            activeOpacity={0.7}>
            <BodyText size="medium" color={accentColor} style={styles.actionButtonText}>
              {actionText}
            </BodyText>
            <Icon name="arrow-forward" size={16} color={accentColor} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

// List Card Props
interface ListCardProps extends BaseCardProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
  }>;
  showDividers?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

// List Card Component
const ListCard: React.FC<ListCardProps> = ({
  title,
  items,
  showDividers = true,
  maxItems,
  onViewAll,
  ...cardProps
}) => {
  const {theme} = useTheme();
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  return (
    <DashboardCard
      title={title}
      headerAction={hasMore && onViewAll ? (
        <TouchableOpacity onPress={onViewAll}>
          <BodyText size="small" color={theme.primary}>
            View All
          </BodyText>
        </TouchableOpacity>
      ) : undefined}
      contentPadding={false}
      {...cardProps}>
      
      <ScrollView style={styles.listContainer}>
        {displayItems.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}>
              
              <View style={styles.listItemContent}>
                {item.icon && (
                  <Icon 
                    name={item.icon} 
                    size={24} 
                    color={theme.OnSurfaceVariant}
                    style={styles.listItemIcon} 
                  />
                )}
                
                <View style={styles.listItemText}>
                  <BodyText color={theme.OnSurface}>
                    {item.title}
                  </BodyText>
                  {item.subtitle && (
                    <BodyText 
                      size="small" 
                      color={theme.OnSurfaceVariant}
                      style={styles.listItemSubtitle}>
                      {item.subtitle}
                    </BodyText>
                  )}
                </View>
                
                {item.trailing && (
                  <View style={styles.listItemTrailing}>
                    {item.trailing}
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {showDividers && index < displayItems.length - 1 && (
              <View style={[styles.divider, {backgroundColor: theme.Outline + '20'}]} />
            )}
          </View>
        ))}
      </ScrollView>
    </DashboardCard>
  );
};

// Styles
const styles = StyleSheet.create({
  baseCard: {
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  
  headerContent: {
    flex: 1,
  },
  
  subtitle: {
    marginTop: SPACING.xs,
  },
  
  headerAction: {
    marginLeft: SPACING.sm,
  },
  
  cardContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  
  statisticsContent: {
    padding: SPACING.md,
  },
  
  statisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  
  statisticsTitle: {
    flex: 1,
  },
  
  statisticsValue: {
    marginBottom: SPACING.xs,
  },
  
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  changeText: {
    marginLeft: SPACING.xs,
  },
  
  actionCardContent: {
    padding: SPACING.md,
  },
  
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  actionCardText: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  
  actionDescription: {
    marginTop: SPACING.xs,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  actionButtonText: {
    marginRight: SPACING.xs,
    fontWeight: '500',
  },
  
  listContainer: {
    maxHeight: 300,
  },
  
  listItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  listItemIcon: {
    marginRight: SPACING.sm,
  },
  
  listItemText: {
    flex: 1,
  },
  
  listItemSubtitle: {
    marginTop: SPACING.xs,
  },
  
  listItemTrailing: {
    marginLeft: SPACING.sm,
  },
  
  divider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
});

export default Card;