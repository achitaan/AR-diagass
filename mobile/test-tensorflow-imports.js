// Verification script to test all TensorFlow imports
console.log('🧪 Testing TensorFlow and model imports...');

try {
  // Test core TensorFlow
  const tf = require('@tensorflow/tfjs');
  console.log('✅ @tensorflow/tfjs imported successfully');
  
  // Test pose detection
  const poseDetection = require('@tensorflow-models/pose-detection');
  console.log('✅ @tensorflow-models/pose-detection imported successfully');
  
  // Test body segmentation
  const bodyPix = require('@tensorflow-models/body-pix');
  console.log('✅ @tensorflow-models/body-pix imported successfully');
  
  // Test TensorFlow React Native (this will fail in Node.js but that's expected)
  try {
    const tfReactNative = require('@tensorflow/tfjs-react-native');
    console.log('✅ @tensorflow/tfjs-react-native imported successfully');
  } catch (rnError) {
    console.log('⚠️  @tensorflow/tfjs-react-native (React Native only - expected in Node.js test)');
  }
  
  console.log('\n🎉 All critical TensorFlow dependencies are working correctly!');
  console.log('\n📦 Package versions:');
  console.log('- TensorFlow.js:', tf.version.tfjs);
  
} catch (error) {
  console.error('❌ Import test failed:', error.message);
  process.exit(1);
}
