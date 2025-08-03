import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Color mapping for different body parts
const BODY_PART_COLORS = {
  left_face: 'rgba(255, 0, 0, 0.5)',
  right_face: 'rgba(255, 85, 0, 0.5)',
  left_upper_arm_front: 'rgba(170, 255, 0, 0.5)',
  right_upper_arm_front: 'rgba(0, 255, 85, 0.5)',
  left_lower_arm_front: 'rgba(0, 255, 170, 0.5)',
  right_lower_arm_front: 'rgba(0, 170, 255, 0.5)',
  left_hand: 'rgba(0, 85, 255, 0.5)',
  right_hand: 'rgba(85, 0, 255, 0.5)',
  torso_front: 'rgba(170, 0, 255, 0.5)',
  left_upper_leg_front: 'rgba(255, 0, 170, 0.5)',
  right_upper_leg_front: 'rgba(255, 0, 85, 0.5)',
  left_lower_leg_front: 'rgba(255, 170, 0, 0.5)',
  right_lower_leg_front: 'rgba(0, 255, 0, 0.5)',
  left_foot: 'rgba(85, 255, 0, 0.5)',
  right_foot: 'rgba(0, 255, 255, 0.5)',
};

// Readable body part names for labels
const BODY_PART_LABELS = {
  left_face: 'Face (L)',
  right_face: 'Face (R)',
  left_upper_arm_front: 'Upper Arm (L)',
  right_upper_arm_front: 'Upper Arm (R)',
  left_lower_arm_front: 'Forearm (L)',
  right_lower_arm_front: 'Forearm (R)',
  left_hand: 'Hand (L)',
  right_hand: 'Hand (R)',
  torso_front: 'Torso',
  left_upper_leg_front: 'Thigh (L)',
  right_upper_leg_front: 'Thigh (R)',
  left_lower_leg_front: 'Calf (L)',
  right_lower_leg_front: 'Calf (R)',
  left_foot: 'Foot (L)',
  right_foot: 'Foot (R)',
};

// Simple interface to replace TensorFlow dependency
interface SimpleSegmentation {
  data: Uint8Array;
  width: number;
  height: number;
}

interface SimplePose {
  keypoints: Array<{
    name: string;
    x: number;
    y: number;
    score: number;
  }>;
}

interface BodyPartMaskProps {
  poses?: SimplePose[];
  segmentation?: SimpleSegmentation | null;
  showLabels: boolean;
  mode: 'skin' | 'muscle' | 'deep';
  style?: any;
}

// Helper functions
const calculatePartLocationsFromPoses = (pose: SimplePose) => {
  const locations: { [key: string]: { x: number; y: number } } = {};
  
  // Map keypoints to body part locations
  const keypoints = pose.keypoints;
  const getKeypoint = (name: string) => keypoints.find(k => k.name === name);
  
  // Calculate approximate body part centers based on keypoints
  const nose = getKeypoint('nose');
  const leftShoulder = getKeypoint('left_shoulder');
  const rightShoulder = getKeypoint('right_shoulder');
  const leftElbow = getKeypoint('left_elbow');
  const rightElbow = getKeypoint('right_elbow');
  const leftWrist = getKeypoint('left_wrist');
  const rightWrist = getKeypoint('right_wrist');
  const leftHip = getKeypoint('left_hip');
  const rightHip = getKeypoint('right_hip');
  const leftKnee = getKeypoint('left_knee');
  const rightKnee = getKeypoint('right_knee');
  const leftAnkle = getKeypoint('left_ankle');
  const rightAnkle = getKeypoint('right_ankle');
  
  // Face
  if (nose && nose.score > 0.5) {
    locations['left_face'] = { x: nose.x - 20, y: nose.y };
    locations['right_face'] = { x: nose.x + 20, y: nose.y };
  }
  
  // Arms
  if (leftShoulder && leftElbow && leftShoulder.score > 0.5 && leftElbow.score > 0.5) {
    locations['left_upper_arm_front'] = {
      x: (leftShoulder.x + leftElbow.x) / 2,
      y: (leftShoulder.y + leftElbow.y) / 2
    };
  }
  
  if (rightShoulder && rightElbow && rightShoulder.score > 0.5 && rightElbow.score > 0.5) {
    locations['right_upper_arm_front'] = {
      x: (rightShoulder.x + rightElbow.x) / 2,
      y: (rightShoulder.y + rightElbow.y) / 2
    };
  }
  
  if (leftElbow && leftWrist && leftElbow.score > 0.5 && leftWrist.score > 0.5) {
    locations['left_lower_arm_front'] = {
      x: (leftElbow.x + leftWrist.x) / 2,
      y: (leftElbow.y + leftWrist.y) / 2
    };
    locations['left_hand'] = { x: leftWrist.x, y: leftWrist.y };
  }
  
  if (rightElbow && rightWrist && rightElbow.score > 0.5 && rightWrist.score > 0.5) {
    locations['right_lower_arm_front'] = {
      x: (rightElbow.x + rightWrist.x) / 2,
      y: (rightElbow.y + rightWrist.y) / 2
    };
    locations['right_hand'] = { x: rightWrist.x, y: rightWrist.y };
  }
  
  // Torso
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const allValid = [leftShoulder, rightShoulder, leftHip, rightHip].every(kp => kp.score > 0.5);
    if (allValid) {
      locations['torso_front'] = {
        x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
        y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4
      };
    }
  }
  
  // Legs
  if (leftHip && leftKnee && leftHip.score > 0.5 && leftKnee.score > 0.5) {
    locations['left_upper_leg_front'] = {
      x: (leftHip.x + leftKnee.x) / 2,
      y: (leftHip.y + leftKnee.y) / 2
    };
  }
  
  if (rightHip && rightKnee && rightHip.score > 0.5 && rightKnee.score > 0.5) {
    locations['right_upper_leg_front'] = {
      x: (rightHip.x + rightKnee.x) / 2,
      y: (rightHip.y + rightKnee.y) / 2
    };
  }
  
  if (leftKnee && leftAnkle && leftKnee.score > 0.5 && leftAnkle.score > 0.5) {
    locations['left_lower_leg_front'] = {
      x: (leftKnee.x + leftAnkle.x) / 2,
      y: (leftKnee.y + leftAnkle.y) / 2
    };
    locations['left_foot'] = { x: leftAnkle.x, y: leftAnkle.y };
  }
  
  if (rightKnee && rightAnkle && rightKnee.score > 0.5 && rightAnkle.score > 0.5) {
    locations['right_lower_leg_front'] = {
      x: (rightKnee.x + rightAnkle.x) / 2,
      y: (rightKnee.y + rightAnkle.y) / 2
    };
    locations['right_foot'] = { x: rightAnkle.x, y: rightAnkle.y };
  }
  
  return locations;
};

const renderBodyPartsFromPose = (pose: SimplePose, mode: string) => {
  const locations = calculatePartLocationsFromPoses(pose);
  
  return Object.entries(locations).map(([partName, location]) => (
    <View
      key={partName}
      style={[
        styles.bodyPart,
        {
          left: location.x - 25,
          top: location.y - 25,
          backgroundColor: BODY_PART_COLORS[partName as keyof typeof BODY_PART_COLORS] || 'rgba(255, 255, 255, 0.3)'
        }
      ]}
    />
  ));
};

export const BodyPartMask: React.FC<BodyPartMaskProps> = ({ 
  poses = [], 
  segmentation = null, 
  showLabels, 
  mode,
  style 
}) => {
  
  if (!poses.length && !segmentation) {
    return null;
  }
  
  // Calculate part locations from poses if available
  const partLocations = poses.length > 0 ? 
    calculatePartLocationsFromPoses(poses[0]) : 
    (segmentation ? calculatePartLocations(segmentation) : {});
  
  return (
    <View style={[styles.container, style]}>
      {/* Show body part regions based on detected poses */}
      {poses.length > 0 && (
        <View style={styles.poseBasedMask}>
          {renderBodyPartsFromPose(poses[0], mode)}
        </View>
      )}
      
      {/* Status indicator */}
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>
          {poses.length > 0 ? `${mode.toUpperCase()} VIEW` : 'Body Part Detection Active'}
        </Text>
        {showLabels && poses.length > 0 && (
          <Text style={styles.statusSubtext}>
            {Object.keys(partLocations).length} parts visible
          </Text>
        )}
      </View>
      
      {/* Draw labels if enabled */}
      {showLabels && Object.entries(partLocations).map(([partName, location]) => (
        <View 
          key={partName}
          style={[
            styles.label,
            {
              left: Math.max(0, Math.min(SCREEN_WIDTH - 60, location.x - 30)),
              top: Math.max(0, Math.min(SCREEN_HEIGHT - 20, location.y - 10)),
            }
          ]}
        >
          <Text style={styles.labelText}>
            {BODY_PART_LABELS[partName as keyof typeof BODY_PART_LABELS] || partName}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Helper function to get part name from part ID
function getPartName(partId: number): string {
  const partNames = [
    'left_face', 'right_face', 'left_upper_arm_front', 'right_upper_arm_front',
    'left_lower_arm_front', 'right_lower_arm_front', 'left_hand', 'right_hand',
    'torso_front', 'left_upper_leg_front', 'right_upper_leg_front',
    'left_lower_leg_front', 'right_lower_leg_front', 'left_foot', 'right_foot'
  ];
  
  return partNames[partId] || 'unknown';
}

// Calculate the center point of each body part for label placement
function calculatePartLocations(segmentation: SimpleSegmentation) {
  const { width, height, data } = segmentation;
  const partCounts: Record<string, { count: number, sumX: number, sumY: number }> = {};
  
  // Count pixels for each part and sum their positions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const partId = data[index];
      
      if (partId !== -1) {
        const partName = getPartName(partId);
        
        if (!partCounts[partName]) {
          partCounts[partName] = { count: 0, sumX: 0, sumY: 0 };
        }
        
        partCounts[partName].count++;
        partCounts[partName].sumX += x;
        partCounts[partName].sumY += y;
      }
    }
  }
  
  // Calculate centroids
  const partLocations: Record<string, { x: number, y: number }> = {};
  
  Object.entries(partCounts).forEach(([partName, { count, sumX, sumY }]) => {
    if (count > 0) {
      // Scale to screen dimensions
      const x = (sumX / count) * (SCREEN_WIDTH / width);
      const y = (sumY / count) * (SCREEN_HEIGHT / height);
      
      partLocations[partName] = { x, y };
    }
  });
  
  return partLocations;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 3,
  },
  poseBasedMask: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bodyPart: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSubtext: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  placeholder: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  placeholderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    width: 60,
    alignItems: 'center',
  },
  labelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
