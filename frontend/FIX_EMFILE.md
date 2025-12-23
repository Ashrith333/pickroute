# Fixing EMFILE Error (Too Many Open Files)

## Quick Fix - Run This First:

```bash
# In your terminal, run this BEFORE starting npm:
ulimit -n 4096

# Then start the app:
cd frontend
npm start
```

## Permanent Fix Options:

### Option 1: Add to ~/.zshrc (Recommended)
```bash
echo 'ulimit -n 4096' >> ~/.zshrc
source ~/.zshrc
```

### Option 2: System-wide Fix (Requires sudo)
```bash
# Edit system limits
sudo launchctl limit maxfiles 65536 200000

# Or edit /etc/sysctl.conf
echo 'kern.maxfiles=65536' | sudo tee -a /etc/sysctl.conf
echo 'kern.maxfilesperproc=65536' | sudo tee -a /etc/sysctl.conf
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536
```

### Option 3: Use the Wrapper Script
The `start.sh` script should handle this automatically, but if it doesn't work, use Option 1.

## Alternative: Use Watchman (Better File Watching)

Install Watchman for better file watching:
```bash
brew install watchman
```

Then restart the app.

## If Still Having Issues:

1. Close other applications that might be using many file handles
2. Restart your terminal
3. Try using `npx expo start --no-dev` for production mode (watches fewer files)
4. Check current limit: `ulimit -n`
