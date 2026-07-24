const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// expo-av alarm loop — Metro ships mp3/wav but not ogg by default.
config.resolver.assetExts.push("ogg");

// Explicit alias — avoids Windows Metro resolution misses on @/ paths.
config.resolver.alias = {
  "@": projectRoot,
};

module.exports = withNativewind(config);
