/** Ensures community autolinking registers react-native-purchases on New Architecture builds. */
module.exports = {
  dependencies: {
    "react-native-purchases": {
      platforms: { ios: {}, android: {} },
    },
  },
};
