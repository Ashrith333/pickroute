const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize file watching to prevent EMFILE errors
config.watchFolders = [__dirname];

// Configure watcher (watchman is optional)
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
  },
};

// Configure resolver to handle nested node_modules properly
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx'],
  // Don't block nested node_modules that Metro needs (like expo's internal deps)
  // Only block deeply nested ones that aren't needed
  blockList: [
    // Block only very deeply nested node_modules (3+ levels)
    /.*\/node_modules\/.*\/node_modules\/.*\/node_modules\/.*/,
  ],
  // Ensure Metro can resolve files in nested node_modules when needed
  nodeModulesPaths: [
    __dirname,
    ...(config.resolver?.nodeModulesPaths || []),
  ],
};

module.exports = config;

