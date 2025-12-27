// Web stub for react-native-fast-image
import React from 'react';
import { Image } from 'react-native-web';

interface FastImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  onLoadStart?: () => void;
  onProgress?: (event: any) => void;
  onLoad?: (event: any) => void;
  onError?: (event: any) => void;
  onLoadEnd?: () => void;
  fallback?: boolean;
  defaultSource?: number;
}

const FastImage: React.FC<FastImageProps> = (props) => {
  return React.createElement(Image, props);
};

FastImage.resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
};

FastImage.priority = {
  low: 'low',
  normal: 'normal',
  high: 'high',
};

FastImage.cacheControl = {
  immutable: 'immutable',
  web: 'web',
  cacheOnly: 'cacheOnly',
};

FastImage.preload = (sources: Array<{ uri: string }>) => {
  sources.forEach(({ uri }) => {
    const img = new window.Image();
    img.src = uri;
  });
};

FastImage.clearMemoryCache = () => Promise.resolve();
FastImage.clearDiskCache = () => Promise.resolve();

export default FastImage;
