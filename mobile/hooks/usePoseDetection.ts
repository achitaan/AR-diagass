import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Camera } from 'expo-camera';
import { Dimensions } from 'react-native';

// Get the screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function usePoseDetection() {
  const [model, setModel] = useState<poseDetection.PoseDetector | null>(null);
  const [poses, setPoses] = useState<poseDetection.Pose[]>([]);
  const [isModelReady, setIsModelReady] = useState(false);
  const [tfReady, setTfReady] = useState(false);
  const requestAnimationFrameId = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Initialize TensorFlow and pose model
  useEffect(() => {
    const initTfAndModel = async () => {
      try {
        // Initialize TF backend
        await tf.ready();
        setTfReady(true);
        
        console.log('TensorFlow.js is ready');
        
        // Load MoveNet model - using Lightning for better performance on mobile
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        
        setModel(detector);
        setIsModelReady(true);
        console.log('Pose detection model loaded');
      } catch (error) {
        console.error('Failed to load TF or pose model:', error);
      }
    };

    initTfAndModel();

    // Cleanup
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
    };
  }, []);

  // Function to process each camera frame
  const handleCameraStream = (images: IterableIterator<tf.Tensor3D>) => {
    const detectPose = async () => {
      try {
        if (!model || !images) return;

        const image = images.next().value;
        if (!image) return;

        const estimatedPoses = await model.estimatePoses(image, {
          flipHorizontal: false
        });
        
        // Update poses state
        setPoses(estimatedPoses);
        
        // Dispose tensor to prevent memory leaks
        tf.dispose(image);
        
        // Continue detecting in the next frame
        rafId.current = requestAnimationFrame(detectPose);
      } catch (error) {
        console.error('Error in pose detection:', error);
      }
    };

    requestAnimationFrameId.current = requestAnimationFrame(detectPose);
  };

  return {
    isModelReady,
    tfReady,
    poses,
    handleCameraStream
  };
}

// Export the TensorCamera component for use in our app
export const TensorCamera = cameraWithTensors(Camera);
