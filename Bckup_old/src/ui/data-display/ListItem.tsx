/**
 * ListItem Component
 * Reusable list item with support for avatar, title, subtitle, and actions
 *
 * Usage:
 * <ListItem
 *   title="John Doe"
 *   subtitle="Student ID: STU-001"
 *   caption="Class 10-A"
 *   left={<Avatar.Text size={48} label="JD" />}
 *   right={<Badge label="Present" variant="success" />}
 *   onPress={() => navigate('StudentDetails', { studentId: '123' })}
 * />
 */

import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Row, Col, T, sx, elevation } from '..';

interface ListItemProps {
  /** Main title text */
  title: string;

  /** Optional subtitle text */
  subtitle?: string;

  /** Optional caption text (smaller, tertiary) */
  caption?: string;

  /** Left content (avatar, icon, etc.) */
  left?: React.ReactNode;

  /** Right content (badge, icon, chevron, etc.) */
  right?: React.ReactNode;

  /** On press handler */
  onPress?: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Custom style */
  style?: ViewStyle;

  /** Show divider below */
  showDivider?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  caption,
  left,
  right,
  onPress,
  disabled = false,
  style,
  showDivider = false,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <>
      <Wrapper
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={0.7}
        style={[
          sx({ bg: 'surface', mb: 'sm', radius: 'md' }),
          elevation(1),
          style,
        ]}
      >
        <Row
          gap="base"
          centerV
          sx={{ p: 'base', minH: 64 }}
        >
          {/* Left content */}
          {left}

          {/* Text content */}
          <Col flex={1} gap={4}>
            <T variant="body" weight="medium" numberOfLines={1}>
              {title}
            </T>
            {subtitle && (
              <T variant="caption" color="textSecondary" numberOfLines={1}>
                {subtitle}
              </T>
            )}
            {caption && (
              <T variant="tiny" color="textTertiary" numberOfLines={1}>
                {caption}
              </T>
            )}
          </Col>

          {/* Right content */}
          {right}
        </Row>
      </Wrapper>

      {/* Optional divider */}
      {showDivider && (
        <View style={sx({ h: 1, bg: 'outline', mx: 'base' })} />
      )}
    </>
  );
};
