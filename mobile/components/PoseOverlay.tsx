import React, { useMemo, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { muscleConfigurations, getKeypointByName, MuscleConfig } from '@/constants/muscleConfig';
import { useHumanDetection, HumanKeypoint, HumanPose } from '../hooks/useHumanDetection';
import { HumanSilhouetteOverlay } from './HumanSilhouetteOverlay';
import { HumanDetectionInstructions } from './HumanDetectionInstructions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple pose interfaces that don't depend on TensorFlow
interface SimpleKeypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

interface SimplePose {
  keypoints: SimpleKeypoint[];
}

interface PoseOverlayProps {
  poses?: SimplePose[];
  style?: StyleProp<ViewStyle>;
  useRealTracking?: boolean;
  mode?: 'visible' | 'muscles' | 'both';
  showDebugPoints?: boolean;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ 
  poses, 
  style, 
  useRealTracking = false,
  mode = 'both',
  showDebugPoints = false
}) => {
  
  // Human detection hook
  const { 
    poses: humanPoses, 
    humanSilhouette,
    isModelReady, 
    isTracking, 
    startDetection, 
    stopDetection
  } = useHumanDetection();

  // Start/stop real tracking based on prop
  useEffect(() => {
    if (useRealTracking && isModelReady) {
      startDetection();
      return () => stopDetection();
    } else {
      stopDetection();
    }
  }, [useRealTracking, isModelReady]);

  // Use human poses if available and real tracking is enabled
  const activePoses = useRealTracking && humanPoses.length > 0 ? humanPoses : poses;
  
  // If no poses detected, show a responsive demo pose
  const useDemoPose = !activePoses || activePoses.length === 0;
  
  // Create a more dynamic demo that responds to screen center but with some variation
  const [animationOffset, setAnimationOffset] = React.useState({ x: 0, y: 0 });
  
  // Add subtle animation to make the demo feel more alive
  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset({
        x: Math.sin(Date.now() / 1000) * 10, // Subtle sway
        y: Math.cos(Date.now() / 1500) * 5   // Slight vertical movement
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Dynamic demo pose keypoints with subtle movement
  const demoKeypoints = [
    { name: 'nose', x: SCREEN_WIDTH / 2 + animationOffset.x, y: SCREEN_HEIGHT * 0.25 + animationOffset.y, score: 1.0 },
    { name: 'left_shoulder', x: SCREEN_WIDTH / 2 - 60 + animationOffset.x, y: SCREEN_HEIGHT * 0.35 + animationOffset.y, score: 1.0 },
    { name: 'right_shoulder', x: SCREEN_WIDTH / 2 + 60 + animationOffset.x, y: SCREEN_HEIGHT * 0.35 + animationOffset.y, score: 1.0 },
    { name: 'left_elbow', x: SCREEN_WIDTH / 2 - 80 + animationOffset.x * 1.2, y: SCREEN_HEIGHT * 0.45 + animationOffset.y, score: 1.0 },
    { name: 'right_elbow', x: SCREEN_WIDTH / 2 + 80 + animationOffset.x * 1.2, y: SCREEN_HEIGHT * 0.45 + animationOffset.y, score: 1.0 },
    { name: 'left_wrist', x: SCREEN_WIDTH / 2 - 90 + animationOffset.x * 1.5, y: SCREEN_HEIGHT * 0.55 + animationOffset.y, score: 1.0 },
    { name: 'right_wrist', x: SCREEN_WIDTH / 2 + 90 + animationOffset.x * 1.5, y: SCREEN_HEIGHT * 0.55 + animationOffset.y, score: 1.0 },
    { name: 'left_hip', x: SCREEN_WIDTH / 2 - 40 + animationOffset.x * 0.5, y: SCREEN_HEIGHT * 0.55 + animationOffset.y, score: 1.0 },
    { name: 'right_hip', x: SCREEN_WIDTH / 2 + 40 + animationOffset.x * 0.5, y: SCREEN_HEIGHT * 0.55 + animationOffset.y, score: 1.0 },
    { name: 'left_knee', x: SCREEN_WIDTH / 2 - 45 + animationOffset.x * 0.3, y: SCREEN_HEIGHT * 0.7 + animationOffset.y * 0.5, score: 1.0 },
    { name: 'right_knee', x: SCREEN_WIDTH / 2 + 45 + animationOffset.x * 0.3, y: SCREEN_HEIGHT * 0.7 + animationOffset.y * 0.5, score: 1.0 },
    { name: 'left_ankle', x: SCREEN_WIDTH / 2 - 50 + animationOffset.x * 0.2, y: SCREEN_HEIGHT * 0.85, score: 1.0 },
    { name: 'right_ankle', x: SCREEN_WIDTH / 2 + 50 + animationOffset.x * 0.2, y: SCREEN_HEIGHT * 0.85, score: 1.0 },
  ];

  // Use demo keypoints if no real poses, otherwise use the first detected pose
  const keypoints = useDemoPose ? demoKeypoints : activePoses![0].keypoints;
  
  // Get visible keypoints with a minimum confidence
  const visibleKeypoints = keypoints.filter((kp: any) => kp.score && kp.score > 0.3);

  // Function to render a muscle line between two joints (fixed version)
  const renderMuscle = (config: MuscleConfig, index: number) => {
    const startKeypoint = getKeypointByName(visibleKeypoints, config.startJoint);
    const endKeypoint = getKeypointByName(visibleKeypoints, config.endJoint);

    if (!startKeypoint || !endKeypoint) return null;

    // Use coordinates directly - they're already in screen space
    const startX = startKeypoint.x;
    const startY = startKeypoint.y;
    const endX = endKeypoint.x;
    const endY = endKeypoint.y;

    // Calculate length and angle of the muscle
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // For now, render a simple colored line to represent the muscle
    return (
      <View
        key={config.name}
        style={[
          styles.muscleLine,
          {
            left: startX,
            top: startY,
            width: length,
            height: 8, // Make thicker for visibility
            transform: [{ rotate: `${angle}deg` }],
            backgroundColor: `hsl(${index * 45}, 70%, 50%)`, // Different colors for each muscle
          }
        ]}
      />
    );
  };

  // Function to render a keypoint as a debug circle
  const renderKeypoint = (keypoint: HumanKeypoint, index: number) => {
    return (
      <View
        key={`keypoint-${keypoint.name}-${index}`}
        style={[
          styles.keypoint,
          {
            left: keypoint.x - 8, // Center the circle
            top: keypoint.y - 8,
          }
        ]}
      />
    );
  };

  return (
    <View style={[styles.overlay, style]}>
      {/* Human detection instructions */}
      {useRealTracking && (
        <HumanDetectionInstructions
          isPersonDetected={humanSilhouette?.isPersonDetected || false}
          isTracking={isTracking}
        />
      )}
      
      {/* Human silhouette detection overlay */}
      {useRealTracking && (
        <HumanSilhouetteOverlay 
          silhouette={humanSilhouette}
          showBodyParts={true}
          showSilhouette={true}
        />
      )}
      
      {/* Debug: Show keypoints as circles (only if enabled) */}
      {showDebugPoints && visibleKeypoints.map((kp: HumanKeypoint, index: number) => renderKeypoint(kp, index))}
      
      {/* Show muscle lines */}
      {muscleConfigurations.map((config, index) => renderMuscle(config, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 2, // Above camera, below chat
  },
  muscleLine: {
    position: 'absolute',
    opacity: 0.7,
    borderRadius: 2,
  },
  keypoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00ff00',
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
