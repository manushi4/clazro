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
  },
};
