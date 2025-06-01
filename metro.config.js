const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    blacklistRE: exclusionList([/node_modules\/ws\/.*/]),
    extraNodeModules: {
      ws: require.resolve('./emptyModule.js'),
    },
  },
};
