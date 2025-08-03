// Simple keypoint interface to replace TensorFlow dependency
interface SimpleKeypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

export interface MuscleConfig {
  name: string;
  image: any;
  startJoint: string;
  endJoint: string;
  width: number; // Relative width compared to length
}

// Define all the major muscles we want to visualize
// Note: For now, using placeholder strings. Replace with actual require() calls when images are available
export const muscleConfigurations: MuscleConfig[] = [
  // Arms
  {
    name: 'bicep-left',
    image: 'bicep.png', // require('../assets/muscles/bicep.png'),
    startJoint: 'leftShoulder',
    endJoint: 'leftElbow',
    width: 0.4,
  },
  {
    name: 'forearm-left',
    image: 'forearm.png', // require('../assets/muscles/forearm.png'),
    startJoint: 'leftElbow',
    endJoint: 'leftWrist',
    width: 0.3,
  },
  {
    name: 'bicep-right',
    image: 'bicep.png', // require('../assets/muscles/bicep.png'),
    startJoint: 'rightShoulder',
    endJoint: 'rightElbow',
    width: 0.4,
  },
  {
    name: 'forearm-right',
    image: 'forearm.png', // require('../assets/muscles/forearm.png'),
    startJoint: 'rightElbow',
    endJoint: 'rightWrist',
    width: 0.3,
  },
  // Legs
  {
    name: 'thigh-left',
    image: 'thigh.png', // require('../assets/muscles/thigh.png'),
    startJoint: 'leftHip',
    endJoint: 'leftKnee',
    width: 0.5,
  },
  {
    name: 'calf-left',
    image: 'calf.png', // require('../assets/muscles/calf.png'),
    startJoint: 'leftKnee',
    endJoint: 'leftAnkle',
    width: 0.35,
  },
  {
    name: 'thigh-right',
    image: 'thigh.png', // require('../assets/muscles/thigh.png'),
    startJoint: 'rightHip',
    endJoint: 'rightKnee',
    width: 0.5,
  },
  {
    name: 'calf-right',
    image: 'calf.png', // require('../assets/muscles/calf.png'),
    startJoint: 'rightKnee',
    endJoint: 'rightAnkle',
    width: 0.35,
  },
  // Core/Torso connections
  {
    name: 'torso-left',
    image: 'torso.png', // require('../assets/muscles/torso.png'),
    startJoint: 'leftShoulder',
    endJoint: 'leftHip',
    width: 0.3,
  },
  {
    name: 'torso-right',
    image: 'torso.png', // require('../assets/muscles/torso.png'),
    startJoint: 'rightShoulder',
    endJoint: 'rightHip',
    width: 0.3,
  },
];

// Helper function to map from keypoint name to index
export const getKeypointByName = (keypoints: SimpleKeypoint[], name: string): SimpleKeypoint | null => {
  return keypoints.find(kp => kp.name === name) || null;
};
