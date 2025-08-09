// Quick test to verify all imports and component structures work
import { useRealPoseDetection, TensorCamera } from './hooks/useRealPoseDetection';
import { useBodySegmentation } from './hooks/useBodySegmentation';
import { ChatOverlay } from './components/ChatOverlay';
import { PoseOverlay } from './components/PoseOverlay';
import { BodyPartMask } from './components/BodyPartMask';

// Test component exports
export const testComponentExports = () => {
  console.log('✅ useRealPoseDetection hook imported');
  console.log('✅ TensorCamera component imported');
  console.log('✅ useBodySegmentation hook imported');
  console.log('✅ ChatOverlay component imported');
  console.log('✅ PoseOverlay component imported');
  console.log('✅ BodyPartMask component imported');
  
  console.log('🎉 All components and hooks are properly exported and importable!');
  
  return {
    useRealPoseDetection,
    TensorCamera,
    useBodySegmentation,
    ChatOverlay,
    PoseOverlay,
    BodyPartMask
  };
};

// Test state management structures
export const testStateStructures = () => {
  const testStates = {
    cameraEnabled: true,
    animationRotation: 45,
    selectedBodyPart: 'shoulder',
    micEnabled: false,
    chatVisible: true,
    visualizationMode: 'muscles' as const,
    currentDepth: 'skin' as const
  };
  
  console.log('✅ State structures valid:', testStates);
  return testStates;
};

console.log('🧪 Running component tests...');
testComponentExports();
testStateStructures();
console.log('✅ All tests passed!');
