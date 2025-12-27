// Web stub for react-native-vector-icons / @expo/vector-icons
import React from 'react';
import { Text } from 'react-native-web';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Material Community Icons component
const MaterialCommunityIcons: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Use CSS-based icon fonts or fallback to text
  return React.createElement(Text, {
    style: [
      {
        fontFamily: 'Material Design Icons',
        fontSize: size,
        color: color,
      },
      style,
    ],
    selectable: false,
  }, getIconChar(name));
};

// Map icon names to characters (subset of most common icons)
function getIconChar(name: string): string {
  const iconMap: Record<string, string> = {
    'check': '\u2713',
    'close': '\u2715',
    'menu': '\u2630',
    'arrow-left': '\u2190',
    'arrow-right': '\u2192',
    'arrow-up': '\u2191',
    'arrow-down': '\u2193',
    'chevron-left': '\u2039',
    'chevron-right': '\u203A',
    'chevron-up': '\u2303',
    'chevron-down': '\u2304',
    'plus': '+',
    'minus': '-',
    'search': '\u26B2',
    'home': '\u2302',
    'settings': '\u2699',
    'account': '\u263A',
    'email': '\u2709',
    'phone': '\u260E',
    'calendar': '\u{1F4C5}',
    'clock': '\u{1F550}',
    'star': '\u2605',
    'star-outline': '\u2606',
    'heart': '\u2665',
    'heart-outline': '\u2661',
    'eye': '\u{1F441}',
    'eye-off': '\u{1F648}',
    'lock': '\u{1F512}',
    'lock-open': '\u{1F513}',
    'pencil': '\u270E',
    'delete': '\u{1F5D1}',
    'refresh': '\u27F3',
    'download': '\u2B07',
    'upload': '\u2B06',
    'share': '\u{1F517}',
    'copy': '\u{1F4CB}',
    'check-circle': '\u2714',
    'alert-circle': '\u26A0',
    'information': '\u2139',
    'help-circle': '?',
  };
  return iconMap[name] || '\u25A1'; // Default to empty square
}

// Static methods
MaterialCommunityIcons.loadFont = () => Promise.resolve();
MaterialCommunityIcons.hasIcon = (name: string) => true;
MaterialCommunityIcons.getRawGlyphMap = () => ({});
MaterialCommunityIcons.getFontFamily = () => 'Material Design Icons';

export default MaterialCommunityIcons;
export { MaterialCommunityIcons };
