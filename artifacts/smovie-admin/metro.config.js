const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block Metro from watching temporary native module directories created by
// expo config plugins at startup (they may not be fully set up yet).
config.resolver.blockList = [
  /.*_tmp_\d+.*/,
];

module.exports = config;
