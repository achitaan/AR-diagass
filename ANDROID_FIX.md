# Android Emulator Fix Guide

## Issue
The Android emulator is having trouble connecting to the Expo development server.

## Solutions

### Method 1: Clear Expo Cache and Restart
```bash
cd mobile
npx expo start -c
```

### Method 2: Use Tunnel Connection
```bash
cd mobile
npx expo start --tunnel
```

### Method 3: Manual Port Forwarding (if using Android Emulator)
```bash
# Open a new terminal and run:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
adb reverse tcp:19001 tcp:19001

# Then start expo normally:
cd mobile
npx expo start
```

### Method 4: Update Metro Configuration
If the issue persists, the metro.config.js might need updating for the new architecture.

### Method 5: Reset Android Emulator
1. Close the emulator
2. Open Android Studio
3. Go to AVD Manager
4. Wipe Data on your emulator
5. Restart the emulator
6. Try `npx expo start` again

### Method 6: Use Physical Device
1. Install Expo Go on your Android device
2. Make sure both device and computer are on same WiFi
3. Scan the QR code from `npx expo start`

## Most Common Solution
Try Method 1 first (clearing cache), then Method 3 (port forwarding) if that doesn't work.
