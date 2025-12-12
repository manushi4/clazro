/**
 * sx() - Styled System for React Native
 * Convert shorthand props to React Native styles
 *
 * Usage:
 * <View style={sx({ bg: 'primary', p: 16, radius: 'md' })} />
 */

import { ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';

type SpacingKey = keyof typeof Spacing | number;
type ColorKey = keyof typeof Colors | string;
type RadiusKey = keyof typeof BorderRadius | number;

export interface SxProps {
  // Background & Color
  bg?: ColorKey;
  bgColor?: ColorKey;

  // Padding
  p?: SpacingKey;
  padding?: SpacingKey;
  px?: SpacingKey;
  py?: SpacingKey;
  pt?: SpacingKey;
  pb?: SpacingKey;
  pl?: SpacingKey;
  pr?: SpacingKey;

  // Margin
  m?: SpacingKey;
  margin?: SpacingKey;
  mx?: SpacingKey;
  my?: SpacingKey;
  mt?: SpacingKey;
  mb?: SpacingKey;
  ml?: SpacingKey;
  mr?: SpacingKey;

  // Border Radius
  radius?: RadiusKey;
  borderRadius?: RadiusKey;

  // Flex
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: SpacingKey;

  // Size
  w?: number | string;
  width?: number | string;
  h?: number | string;
  height?: number | string;
  minW?: number;
  minWidth?: number;
  maxW?: number;
  maxWidth?: number;
  minH?: number;
  minHeight?: number;
  maxH?: number;
  maxHeight?: number;

  // Position
  position?: 'absolute' | 'relative';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  zIndex?: number;

  // Border
  borderWidth?: number;
  borderColor?: ColorKey;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRightWidth?: number;

  // Opacity
  opacity?: number;

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll';
}

const getSpacing = (value: SpacingKey): number => {
  return typeof value === 'number' ? value : Spacing[value] || 0;
};

const getColor = (value: ColorKey): string => {
  return Colors[value as keyof typeof Colors] || value;
};

const getRadius = (value: RadiusKey): number => {
  return typeof value === 'number' ? value : BorderRadius[value] || 0;
};

/**
 * Convert sx props to React Native styles
 */
export const sx = (props: SxProps): ViewStyle => {
  const style: ViewStyle = {};

  // Background
  if (props.bg || props.bgColor) {
    style.backgroundColor = getColor(props.bg || props.bgColor!);
  }

  // Padding
  if (props.p !== undefined || props.padding !== undefined) {
    style.padding = getSpacing(props.p ?? props.padding!);
  }
  if (props.px !== undefined) {
    style.paddingHorizontal = getSpacing(props.px);
  }
  if (props.py !== undefined) {
    style.paddingVertical = getSpacing(props.py);
  }
  if (props.pt !== undefined) style.paddingTop = getSpacing(props.pt);
  if (props.pb !== undefined) style.paddingBottom = getSpacing(props.pb);
  if (props.pl !== undefined) style.paddingLeft = getSpacing(props.pl);
  if (props.pr !== undefined) style.paddingRight = getSpacing(props.pr);

  // Margin
  if (props.m !== undefined || props.margin !== undefined) {
    style.margin = getSpacing(props.m ?? props.margin!);
  }
  if (props.mx !== undefined) {
    style.marginHorizontal = getSpacing(props.mx);
  }
  if (props.my !== undefined) {
    style.marginVertical = getSpacing(props.my);
  }
  if (props.mt !== undefined) style.marginTop = getSpacing(props.mt);
  if (props.mb !== undefined) style.marginBottom = getSpacing(props.mb);
  if (props.ml !== undefined) style.marginLeft = getSpacing(props.ml);
  if (props.mr !== undefined) style.marginRight = getSpacing(props.mr);

  // Border Radius
  if (props.radius !== undefined || props.borderRadius !== undefined) {
    style.borderRadius = getRadius(props.radius ?? props.borderRadius!);
  }

  // Flex
  if (props.flex !== undefined) style.flex = props.flex;
  if (props.flexDirection) style.flexDirection = props.flexDirection;
  if (props.flexWrap) style.flexWrap = props.flexWrap;
  if (props.justifyContent) style.justifyContent = props.justifyContent;
  if (props.alignItems) style.alignItems = props.alignItems;
  if (props.alignSelf) style.alignSelf = props.alignSelf;
  if (props.gap !== undefined) style.gap = getSpacing(props.gap);

  // Size
  if (props.w !== undefined || props.width !== undefined) {
    style.width = props.w ?? props.width;
  }
  if (props.h !== undefined || props.height !== undefined) {
    style.height = props.h ?? props.height;
  }
  if (props.minW !== undefined || props.minWidth !== undefined) {
    style.minWidth = props.minW ?? props.minWidth;
  }
  if (props.maxW !== undefined || props.maxWidth !== undefined) {
    style.maxWidth = props.maxW ?? props.maxWidth;
  }
  if (props.minH !== undefined || props.minHeight !== undefined) {
    style.minHeight = props.minH ?? props.minHeight;
  }
  if (props.maxH !== undefined || props.maxHeight !== undefined) {
    style.maxHeight = props.maxH ?? props.maxHeight;
  }

  // Position
  if (props.position) style.position = props.position;
  if (props.top !== undefined) style.top = props.top;
  if (props.bottom !== undefined) style.bottom = props.bottom;
  if (props.left !== undefined) style.left = props.left;
  if (props.right !== undefined) style.right = props.right;
  if (props.zIndex !== undefined) style.zIndex = props.zIndex;

  // Border
  if (props.borderWidth !== undefined) style.borderWidth = props.borderWidth;
  if (props.borderColor) style.borderColor = getColor(props.borderColor);
  if (props.borderTopWidth !== undefined) style.borderTopWidth = props.borderTopWidth;
  if (props.borderBottomWidth !== undefined) style.borderBottomWidth = props.borderBottomWidth;
  if (props.borderLeftWidth !== undefined) style.borderLeftWidth = props.borderLeftWidth;
  if (props.borderRightWidth !== undefined) style.borderRightWidth = props.borderRightWidth;

  // Opacity
  if (props.opacity !== undefined) style.opacity = props.opacity;

  // Overflow
  if (props.overflow) style.overflow = props.overflow;

  return style;
};
