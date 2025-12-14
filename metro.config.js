const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const os = require('os');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    inlineRequires: true,
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    blockList: [
      /android\/build\/.*/,
      /android\/app\/build\/.*/,
      /android\/\.gradle\/.*/,
      /android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
      /node_modules\/.*\/android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/\.gradle\/.*/,
    ],
  },
  maxWorkers: 8,
  cacheStores: [
    new (require('metro-cache').FileStore)({
      root: path.join(os.tmpdir(), 'metro-cache'),
    }),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
