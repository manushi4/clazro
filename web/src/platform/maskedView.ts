// Web stub for @react-native-masked-view/masked-view
import React from 'react';
import { View } from 'react-native-web';

interface MaskedViewProps {
  maskElement: React.ReactElement;
  children: React.ReactNode;
  style?: any;
}

// MaskedView is used for header back button animations in react-navigation
// On web, we can use CSS mask-image for similar effect, but for simplicity
// we just render children directly
const MaskedView: React.FC<MaskedViewProps> = ({ children, style }) => {
  return React.createElement(View, { style }, children);
};

export default MaskedView;
