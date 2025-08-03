import { useState, useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Camera } from 'expo-camera';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

// Expose TensorCamera for use in other components
export const TensorCamera = cameraWithTensors(Camera);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pose interfaces matching the app's expected format
export interface RealKeypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

export interface RealPose {
  keypoints: RealKeypoint[];
  score: number;
}

// Define keypoint names for MoveNet/PoseNet compatibility
const POSE_KEYPOINTS = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

export function useRealPoseDetection() {
  const [poses, setPoses] = useState<RealPose[]>([]);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [tfReady, setTfReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [movementIntensity, setMovementIntensity] = useState(0);
  const processingRef = useRef(false);
  const previousKeypointsRef = useRef<RealKeypoint[]>([]);

  // Initialize TensorFlow and pose detection model
  useEffect(() => {
    const initializeTf = async () => {
      try {
        console.log('🔄 Initializing TensorFlow...');
        await tf.ready();
        setTfReady(true);
        console.log('✅ TensorFlow ready');

        // Load MoveNet model (optimized for mobile performance)
        console.log('🔄 Loading MoveNet model...');
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25
        };
        
        const detector = await poseDetection.createDetector(model, detectorConfig);
        setDetector(detector);
        setIsModelReady(true);
        console.log('✅ Pose detector ready - REAL human detection active');
      } catch (error) {
        console.error('❌ Error initializing pose detection:', error);
        // Fallback to demo mode if model loading fails
        setTfReady(true);
        setIsModelReady(false);
      }
    };

    initializeTf();

    return () => {
      stopTracking();
    };
  }, []);

  // Process camera frames for pose detection
  const handleCameraStream = (images: any, updatePreview: any, gl: any) => {
    const loop = async () => {
      if (!detector || !isModelReady || processingRef.current) {
        requestAnimationFrame(loop);
        return;
      }

      processingRef.current = true;

      try {
        const nextImageTensor = images.next().value;
        
        if (nextImageTensor) {
          // Detect poses in the current frame
          const detectedPoses = await detector.estimatePoses(nextImageTensor);
          
          if (detectedPoses && detectedPoses.length > 0) {
            // Convert to our pose format
            const convertedPoses: RealPose[] = detectedPoses.map(pose => ({
              keypoints: pose.keypoints?.map((kp, index) => ({
                name: POSE_KEYPOINTS[index] || `keypoint_${index}`,
                x: kp.x,
                y: kp.y,
                score: kp.score || 0
              })) || [],
              score: pose.score || 0
            }));

            setPoses(convertedPoses);
            setIsTracking(convertedPoses.length > 0);
            
            // Calculate movement intensity
            if (convertedPoses.length > 0) {
              const currentKeypoints = convertedPoses[0].keypoints;
              const intensity = calculateMovementIntensity(currentKeypoints);
              setMovementIntensity(intensity);
              previousKeypointsRef.current = currentKeypoints;
            }
          } else {
            setPoses([]);
            setIsTracking(false);
            setMovementIntensity(0);
          }

          // Dispose of the tensor to prevent memory leaks
          nextImageTensor.dispose();
        }
      } catch (error) {
        console.error('❌ Error processing camera frame:', error);
      } finally {
        processingRef.current = false;
      }

      updatePreview();
      requestAnimationFrame(loop);
    };
    loop();
  };

  // Calculate movement intensity based on keypoint changes
  const calculateMovementIntensity = (currentKeypoints: RealKeypoint[]): number => {
    if (previousKeypointsRef.current.length === 0) {
      return 0;
    }

    let totalMovement = 0;
    let validKeypoints = 0;

    currentKeypoints.forEach((current, index) => {
      const previous = previousKeypointsRef.current[index];
      if (previous && current.score > 0.5 && previous.score > 0.5) {
        const distance = Math.sqrt(
          Math.pow(current.x - previous.x, 2) + 
          Math.pow(current.y - previous.y, 2)
        );
        totalMovement += distance;
        validKeypoints++;
      }
    });

    return validKeypoints > 0 ? (totalMovement / validKeypoints) / 10 : 0;
  };

  const startTracking = () => {
    if (isModelReady && detector) {
      setIsTracking(true);
      console.log('▶️ Started real human tracking');
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setPoses([]);
    setMovementIntensity(0);
    processingRef.current = false;
    console.log('⏹️ Stopped real human tracking');
  };

  // Demo mode for testing UI without real detection
  const generateDemoPose = (): RealPose => {
    const time = Date.now() / 1000;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    
    // Generate realistic demo keypoints with subtle movement
    const demoPositions: { [key: string]: { x: number; y: number } } = {
      'nose': { x: centerX, y: centerY - 80 },
      'left_shoulder': { x: centerX - 60, y: centerY - 40 },
      'right_shoulder': { x: centerX + 60, y: centerY - 40 },
      'left_elbow': { x: centerX - 80, y: centerY },
      'right_elbow': { x: centerX + 80, y: centerY },
      'left_wrist': { x: centerX - 100, y: centerY + 20 },
      'right_wrist': { x: centerX + 100, y: centerY + 20 },
      'left_hip': { x: centerX - 40, y: centerY + 60 },
      'right_hip': { x: centerX + 40, y: centerY + 60 },
      'left_knee': { x: centerX - 45, y: centerY + 120 },
      'right_knee': { x: centerX + 45, y: centerY + 120 },
      'left_ankle': { x: centerX - 50, y: centerY + 180 },
      'right_ankle': { x: centerX + 50, y: centerY + 180 }
    };

    const demoKeypoints: RealKeypoint[] = POSE_KEYPOINTS.map((name, index) => {
      const basePos = demoPositions[name] || { x: centerX, y: centerY };
      
      // Add subtle breathing/movement animation
      const sway = Math.sin(time * 0.5) * 3;
      const breathe = Math.sin(time * 2) * 2;
      
      return {
        name,
        x: basePos.x + sway,
        y: basePos.y + breathe,
        score: 0.9
      };
    });

    return {
      keypoints: demoKeypoints,
      score: 0.9
    };
  };

  return {
    poses,
    isModelReady,
    tfReady,
    isTracking,
    movementIntensity,
    startTracking,
    stopTracking,
    handleCameraStream,
    generateDemoPose,
    // Expose TensorCamera for components to use
    TensorCamera
  };
}
