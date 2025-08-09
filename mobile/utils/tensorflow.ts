import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';

// Initialize TensorFlow.js for React Native
export const initializeTensorFlow = async (): Promise<boolean> => {
  try {
    // Platform-specific initialization
    await tf.ready();
    
    console.log('✅ TensorFlow.js initialized successfully');
    console.log('Platform:', Platform.OS);
    console.log('Backend:', tf.getBackend());
    console.log('Memory info:', tf.memory());
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize TensorFlow.js:', error);
    return false;
  }
};

// Clean up TensorFlow resources
export const cleanupTensorFlow = () => {
  try {
    tf.disposeVariables();
    console.log('🧹 TensorFlow resources cleaned up');
  } catch (error) {
    console.error('Error cleaning up TensorFlow:', error);
  }
};
