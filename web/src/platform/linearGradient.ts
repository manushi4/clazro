// Web stub for react-native-linear-gradient
import React from 'react';
import { View } from 'react-native-web';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: any;
  children?: React.ReactNode;
}

const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  children,
}) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
  const gradientColors = colors.join(', ');

  return React.createElement(View, {
    style: [
      style,
      {
        backgroundImage: `linear-gradient(${angle}deg, ${gradientColors})`,
      },
    ],
  }, children);
};

export default LinearGradient;
