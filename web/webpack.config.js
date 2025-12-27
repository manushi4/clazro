const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname, '../');
const webDirectory = path.resolve(__dirname);

// Packages that need transpilation
const compileNodeModules = [
  'react-native-vector-icons',
  'react-native-paper',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation',
  'react-native-chart-kit',
  'react-native-svg',
  'react-native-url-polyfill',
  '@gorhom/bottom-sheet',
  'react-native-animatable',
  'react-native-modal',
].map(moduleName => path.resolve(appDirectory, 'node_modules', moduleName));

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx|mjs)$/,
  include: [
    path.resolve(webDirectory, 'src'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'App.tsx'),
    ...compileNodeModules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['@babel/preset-env', {
          targets: { browsers: ['last 2 versions'] },
          modules: false,
        }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        'react-native-reanimated/plugin',
        '@babel/plugin-proposal-export-namespace-from',
      ],
    },
  },
};

module.exports = {
  entry: path.resolve(webDirectory, 'src/index.tsx'),

  output: {
    path: path.resolve(webDirectory, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs'],

    // Important: check web node_modules first, then parent
    modules: [
      path.resolve(webDirectory, 'node_modules'),
      path.resolve(appDirectory, 'node_modules'),
      'node_modules',
    ],

    alias: {
      // React Native Web - handle all react-native imports including subpaths
      'react-native': 'react-native-web',

      // Vector icons aliases for react-native-paper
      '@react-native-vector-icons/material-design-icons': path.resolve(webDirectory, 'src/platform/vectorIcons.ts'),
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(webDirectory, 'src/platform/vectorIcons.ts'),
      '@expo/vector-icons': path.resolve(webDirectory, 'src/platform/vectorIcons.ts'),

      // MaskedView for react-navigation
      '@react-native-masked-view/masked-view': path.resolve(webDirectory, 'src/platform/maskedView.ts'),

      // Platform-specific module replacements
      '@react-native-async-storage/async-storage': path.resolve(webDirectory, 'src/platform/storage.ts'),
      '@react-native-community/netinfo': path.resolve(webDirectory, 'src/platform/network.ts'),
      'react-native-image-picker': path.resolve(webDirectory, 'src/platform/imagePicker.ts'),
      'react-native-image-crop-picker': path.resolve(webDirectory, 'src/platform/imagePicker.ts'),
      'react-native-fs': path.resolve(webDirectory, 'src/platform/filesystem.ts'),
      'react-native-blob-util': path.resolve(webDirectory, 'src/platform/blobUtil.ts'),
      '@react-native-firebase/messaging': path.resolve(webDirectory, 'src/platform/firebaseMessaging.ts'),
      '@react-native-firebase/app': path.resolve(webDirectory, 'src/platform/firebaseApp.ts'),
      'react-native-push-notification': path.resolve(webDirectory, 'src/platform/pushNotification.ts'),
      '@notifee/react-native': path.resolve(webDirectory, 'src/platform/notifee.ts'),
      'react-native-keychain': path.resolve(webDirectory, 'src/platform/keychain.ts'),
      'react-native-permissions': path.resolve(webDirectory, 'src/platform/permissions.ts'),
      'react-native-vision-camera': path.resolve(webDirectory, 'src/platform/visionCamera.ts'),
      'react-native-video': path.resolve(webDirectory, 'src/platform/video.ts'),
      'react-native-pdf': path.resolve(webDirectory, 'src/platform/pdf.ts'),
      '@stream-io/video-react-native-sdk': path.resolve(webDirectory, 'src/platform/streamVideo.ts'),
      '@stream-io/react-native-webrtc': path.resolve(webDirectory, 'src/platform/webrtc.ts'),
      '@stripe/stripe-react-native': path.resolve(webDirectory, 'src/platform/stripe.ts'),
      'react-native-razorpay': path.resolve(webDirectory, 'src/platform/razorpay.ts'),

      // Additional native modules that need stubs
      'react-native-device-info': path.resolve(webDirectory, 'src/platform/deviceInfo.ts'),
      'react-native-linear-gradient': path.resolve(webDirectory, 'src/platform/linearGradient.ts'),
      'react-native-fast-image': path.resolve(webDirectory, 'src/platform/fastImage.ts'),

      // Shared source
      '@shared': path.resolve(appDirectory, 'src'),
    },
  },

  module: {
    rules: [
      babelLoaderConfiguration,
      // Fix ESM module resolution for node_modules
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(webDirectory, 'public/index.html'),
    }),
    // Define process.env for browser compatibility
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Supabase
        EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        EXPO_PUBLIC_DEMO_CUSTOMER_ID: process.env.EXPO_PUBLIC_DEMO_CUSTOMER_ID || '',
        // Sentry
        SENTRY_DSN: process.env.SENTRY_DSN || '',
        SENTRY_ENV: process.env.SENTRY_ENV || '',
        SENTRY_RELEASE: process.env.SENTRY_RELEASE || '',
      }),
    }),
    // Provide process global for libraries that check process.env at runtime
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],

  devServer: {
    port: 3001,
    historyApiFallback: true,
    hot: true,
    open: true,
  },

  // Suppress source-map warnings from node_modules
  ignoreWarnings: [/Failed to parse source map/],
};
