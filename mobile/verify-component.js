// Simple verification that TensorCamera component can be imported
// This checks the module structure without running React Native specific code

const fs = require('fs');
const path = require('path');

// Read the hook file
const hookPath = './hooks/useRealPoseDetection.ts';
const hookContent = fs.readFileSync(hookPath, 'utf8');

console.log('🔍 Verifying TensorCamera export...');

// Check if TensorCamera is properly exported
if (hookContent.includes('export { TensorCameraComponent as TensorCamera }')) {
  console.log('✅ TensorCamera is properly exported as named export');
} else if (hookContent.includes('export const TensorCamera')) {
  console.log('✅ TensorCamera is exported as const');
} else {
  console.log('❌ TensorCamera export not found');
}

// Check if cameraWithTensors is imported
if (hookContent.includes('import { cameraWithTensors }')) {
  console.log('✅ cameraWithTensors is properly imported');
} else {
  console.log('❌ cameraWithTensors import not found');
}

// Check if CameraView is imported (correct component for expo-camera v16+)
if (hookContent.includes('import { CameraView }')) {
  console.log('✅ CameraView is properly imported (correct for expo-camera v16+)');
} else if (hookContent.includes('import { Camera }')) {
  console.log('⚠️  Using Camera import - should be CameraView for expo-camera v16+');
} else {
  console.log('❌ Camera component import not found');
}

console.log('✅ Component verification complete');
