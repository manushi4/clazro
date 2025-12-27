/**
 * BreadcrumbNav - Breadcrumb navigation for admin screens
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useNavigation } from '@react-navigation/native';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  params?: Record<string, any>;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  style?: object;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  style,
}) => {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();

  const handlePress = (item: BreadcrumbItem) => {
    if (item.route) {
      navigation.navigate(item.route, item.params);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !isLast && item.route;

        return (
          <React.Fragment key={item.label}>
            {isClickable ? (
              <Pressable
                onPress={() => handlePress(item)}
                style={styles.item}
              >
                <AppText
                  style={[
                    styles.text,
                    styles.clickable,
                    { color: colors.primary },
                  ]}
                >
                  {item.label}
                </AppText>
              </Pressable>
            ) : (
              <View style={styles.item}>
                <AppText
                  style={[
                    styles.text,
                    { color: isLast ? colors.onSurface : colors.onSurfaceVariant },
                    isLast && styles.currentText,
                  ]}
                >
                  {item.label}
                </AppText>
              </View>
            )}

            {!isLast && (
              <Icon
                name="chevron-right"
                size={16}
                color={colors.onSurfaceVariant}
                style={styles.separator}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
  },
  clickable: {
    // @ts-ignore - Web specific
    cursor: 'pointer',
  },
  currentText: {
    fontWeight: '500',
  },
  separator: {
    marginHorizontal: 2,
  },
});

export default BreadcrumbNav;
