const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize file watching to prevent EMFILE errors
config.watchFolders = [__dirname];

// Exclude node_modules from watching (except for symlinked packages)
config.watcher = {
  ...config.watcher,
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: true,
  },
};

// Reduce the number of files watched
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
  blockList: [
    // Exclude large directories from watching
    /.*\/node_modules\/.*\/node_modules\/.*/,
  ],
};

module.exports = config;

