import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as bodyPix from '@tensorflow-models/body-pix';
import { CameraView } from 'expo-camera';

export function useBodySegmentation() {
  const [model, setModel] = useState<bodyPix.BodyPix | null>(null);
  const [segmentation, setSegmentation] = useState<bodyPix.SemanticPartSegmentation | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [tfReady, setTfReady] = useState(false);
  const requestAnimationFrameId = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Initialize TensorFlow and segmentation model
  useEffect(() => {
    const initTfAndModel = async () => {
      try {
        // Initialize TF backend
        await tf.ready();
        setTfReady(true);
        console.log('TensorFlow.js is ready for segmentation');
        
        // Load BodyPix model - using lighter ResNet50 for better performance
        const net = await bodyPix.load({
          architecture: 'ResNet50',
          outputStride: 16,
          quantBytes: 2
        });
        
        setModel(net);
        setIsModelReady(true);
        console.log('Body segmentation model loaded');
      } catch (error) {
        console.error('Failed to load TF or bodyPix model:', error);
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
    const segmentBodyParts = async () => {
      try {
        if (!model || !images) return;

        const image = images.next().value;
        if (!image) return;

        // Perform segmentation
        const segmentationResult = await model.segmentPersonParts(image, {
          flipHorizontal: false,
          internalResolution: 'medium',
          segmentationThreshold: 0.7,
        });
        
        // Update segmentation state
        setSegmentation(segmentationResult);
        
        // Dispose tensor to prevent memory leaks
        tf.dispose(image);
        
        // Continue detecting in the next frame
        rafId.current = requestAnimationFrame(segmentBodyParts);
      } catch (error) {
        console.error('Error in body segmentation:', error);
      }
    };

    requestAnimationFrameId.current = requestAnimationFrame(segmentBodyParts);
  };

  return {
    isModelReady,
    tfReady,
    segmentation,
    handleCameraStream
  };
}

// TensorCamera is exported from useRealPoseDetection.ts to avoid conflicts
