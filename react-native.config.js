module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // disable auto-linking for iOS if not needed
      },
    },
    'react-native-document-picker': {
      platforms: {
        android: null, // disable auto-linking - incompatible with RN 0.80
        ios: null,
      },
    },
  },
};
