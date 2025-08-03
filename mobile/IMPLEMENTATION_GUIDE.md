# Expo React Native AR Muscle Overlay Implementation

This implementation adds real-time pose detection and muscle visualization to your existing AR application.

## What's Implemented

### 1. **Pose Detection** (`hooks/usePoseDetection.ts`)
- Uses TensorFlow.js with MoveNet model for real-time pose detection
- Efficiently tracks 17 key body points (shoulders, elbows, wrists, hips, knees, ankles, etc.)
- Optimized for mobile performance with the Lightning variant

### 2. **Body Segmentation** (`hooks/useBodySegmentation.ts`) 
- Uses TensorFlow.js BodyPix model to segment the person into 15 body parts
- Identifies specific regions: face, arms, hands, torso, legs, feet
- Real-time pixel-level body part classification

### 3. **Muscle Overlay** (`components/PoseOverlay.tsx`)
- Draws semi-transparent muscle shapes between detected joints
- Muscles include: biceps, forearms, thighs, calves (left and right)
- Automatically scales and rotates with user movement
- Currently renders as colored lines (can be upgraded to muscle images)

### 4. **Body Part Masking** (`components/BodyPartMask.tsx`)
- Color-codes different body parts with unique overlays
- Shows labels for each identified body part
- Calculates centroids for optimal label placement

### 5. **Updated Session Screen** (`app/session.tsx`)
- Integrates TensorCamera for real-time ML processing
- Three visualization modes: None, Muscles, Body Parts
- New controls for toggling between modes and labels
- Maintains existing chat functionality

## New Controls Added

1. **V/M/B Button**: Cycles through visualization modes
   - V: None (regular camera)
   - M: Muscle view (pose detection with muscle overlays)
   - B: Body parts view (segmentation with colored regions)

2. **L Button**: Toggles labels on/off (only visible in body parts mode)

## Architecture

```
TensorCamera (Expo Camera + TensorFlow.js)
    ↓
Pose Detection OR Body Segmentation
    ↓
Overlay Components (Muscles OR Body Parts)
    ↓
Chat Overlay (existing functionality preserved)
```

## Performance Optimizations

- **Model Selection**: Uses lightweight MoveNet Lightning for pose detection
- **Frame Processing**: Optimized tensor disposal to prevent memory leaks
- **Selective Processing**: Only runs ML models when visualization modes are active
- **Efficient Rendering**: Simplified overlays using native React Native components

## Installation Requirements

The following packages were installed:
- `expo-camera` - Camera access
- `expo-gl` - OpenGL support
- `react-native-reanimated` - Smooth animations
- `@tensorflow/tfjs` - TensorFlow.js core
- `@tensorflow/tfjs-react-native` - React Native integration
- `@tensorflow-models/pose-detection` - Pose detection models
- `@tensorflow-models/body-pix` - Body segmentation models
- `@shopify/react-native-skia` - GPU-accelerated graphics (optional)

## Next Steps

1. **Add Muscle Images**: Replace the colored lines with actual semi-transparent muscle PNG images
2. **Improve Segmentation Rendering**: Use Skia for better pixel-level body part visualization
3. **Add More Muscles**: Extend to include chest, back, shoulders, abs
4. **Performance Tuning**: Add frame rate controls and quality settings
5. **Educational Features**: Add muscle information popups and anatomy facts

## Usage

The enhanced AR app now provides an educational experience where users can:
- Point their phone at themselves
- See their pose detected in real-time
- View muscle overlays that move with their body
- Identify different body parts with color coding
- Continue using the chat functionality for questions about anatomy

This creates a comprehensive AR anatomy learning tool while maintaining all existing functionality.
