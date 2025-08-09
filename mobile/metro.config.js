const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver options for TensorFlow.js
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-fs': require.resolve('react-native-fs'),
};

// Ensure the file extensions are properly resolved
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'js',
  'json',
  'ts',
  'tsx',
  'jsx',
];

// Add asset extensions if needed
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
];

module.exports = config;
