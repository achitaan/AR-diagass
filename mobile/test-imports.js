// Test file to verify TensorFlow.js imports work correctly
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

console.log('✅ TensorFlow.js core imported successfully');
console.log('✅ TensorFlow.js React Native imported successfully');  
console.log('✅ Pose Detection models imported successfully');

export const testImports = () => {
  console.log('TensorFlow version:', tf.version.tfjs);
  console.log('All imports working correctly');
  return true;
};
