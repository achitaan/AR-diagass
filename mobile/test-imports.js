// Test file to verify TensorFlow.js imports work correctly
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { TensorCamera, useRealPoseDetection } from './hooks/useRealPoseDetection.ts';

console.log('✅ TensorFlow.js core imported successfully');
console.log('✅ TensorFlow.js React Native imported successfully');  
console.log('✅ Pose Detection models imported successfully');
console.log('✅ TensorCamera component imported successfully');
console.log('✅ useRealPoseDetection hook imported successfully');

export const testImports = () => {
  console.log('TensorFlow version:', tf.version.tfjs);
  console.log('TensorCamera component:', typeof TensorCamera);
  console.log('useRealPoseDetection hook:', typeof useRealPoseDetection);
  console.log('All imports working correctly');
  return true;
};
