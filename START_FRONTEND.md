# How to Start Frontend (Fixed EMFILE Error)

## ✅ Solution: Set File Limit Before Starting

The EMFILE error happens because macOS has a low default file limit. Here's how to fix it:

### Quick Fix (Run this every time):

```bash
# Step 1: Increase file limit in your current terminal
ulimit -n 4096

# Step 2: Start the frontend
cd frontend
npm start
```

### Permanent Fix (Do this once):

Add this to your `~/.zshrc` file:

```bash
# Add to ~/.zshrc
echo 'ulimit -n 4096' >> ~/.zshrc

# Reload your shell config
source ~/.zshrc
```

Now every new terminal will have the higher limit.

### Alternative: Install Watchman (Recommended for React Native)

Watchman is Facebook's file watching service, much better than Node's file watcher:

```bash
# Install Watchman
brew install watchman

# Then start normally
cd frontend
npm start
```

Watchman handles file watching more efficiently and reduces the number of open files needed.

## 🚀 After Fixing:

1. Set the limit: `ulimit -n 4096`
2. Start frontend: `cd frontend && npm start`
3. Press `i` for iOS or `a` for Android
4. App should start without EMFILE errors!

## 📝 What Was Fixed:

- ✅ Created `start.sh` wrapper script
- ✅ Updated `metro.config.js` to optimize file watching
- ✅ Updated `.watchmanconfig` to ignore unnecessary directories
- ✅ All npm scripts now use the wrapper

The wrapper script should work, but the most reliable solution is setting `ulimit -n 4096` in your shell before starting.
