import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Svg, { G, Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 3D Keypoint with depth
interface Keypoint3D {
  name: string;
  x: number;
  y: number;
  z: number; // Depth for 3D effect
  score: number;
}

interface DrawingPoint {
  x: number;
  y: number;
  bodyPart?: string;
  painLevel?: number;
}

interface Skeleton3DProps {
  onBodyPartPress?: (partName: string) => void;
  selectedPart?: string | null;
  showNodes?: boolean;
  isDrawingMode?: boolean;
  drawingPoints?: DrawingPoint[];
  onDrawingUpdate?: (points: DrawingPoint[]) => void;
  onPainLevelSelect?: (bodyPart: string, painLevel: number) => void;
  painAreas?: Map<string, number>;
  onNodesUpdate?: (nodes: DrawingPoint[]) => void;
}

// Define body part connections for skeleton lines - Enhanced for medical diagnosis
const SKELETON_CONNECTIONS = [
  // Detailed head and facial connections
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  ['nose', 'forehead'], ['forehead', 'left_temple'], ['forehead', 'right_temple'],
  ['left_temple', 'left_ear'], ['right_temple', 'right_ear'],
  ['nose', 'left_nostril'], ['nose', 'right_nostril'],
  ['nose', 'mouth'], ['mouth', 'left_lip'], ['mouth', 'right_lip'],
  ['mouth', 'chin'], ['chin', 'left_jaw'], ['chin', 'right_jaw'],
  ['left_jaw', 'left_ear'], ['right_jaw', 'right_ear'],
  ['left_eye', 'left_eyebrow'], ['right_eye', 'right_eyebrow'],
  ['left_eyebrow', 'forehead'], ['right_eyebrow', 'forehead'],
  ['left_eye', 'left_cheek'], ['right_eye', 'right_cheek'],
  ['left_cheek', 'mouth'], ['right_cheek', 'mouth'],
  
  // Neck connections
  ['chin', 'neck_base'],
  ['left_ear', 'neck_left'], ['right_ear', 'neck_right'],
  ['neck_left', 'neck_base'], ['neck_right', 'neck_base'],
  
  // Neck to shoulders
  ['neck_base', 'left_shoulder'], ['neck_base', 'right_shoulder'],
  
  // Shoulder girdle
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_clavicle'], ['right_shoulder', 'right_clavicle'],
  
  // Spine connections
  ['neck_base', 'upper_spine'],
  ['upper_spine', 'mid_spine'],
  ['mid_spine', 'lower_spine'],
  ['lower_spine', 'sacrum'],
  ['sacrum', 'left_hip'], ['sacrum', 'right_hip'],
  
  // Torso connections
  ['left_shoulder', 'left_chest'], ['right_shoulder', 'right_chest'],
  ['left_chest', 'left_ribs'], ['right_chest', 'right_ribs'],
  ['left_ribs', 'left_abdomen'], ['right_ribs', 'right_abdomen'],
  ['left_abdomen', 'left_hip'], ['right_abdomen', 'right_hip'],
  ['left_hip', 'right_hip'],
  
  // Left arm connections
  ['left_shoulder', 'left_upper_arm'],
  ['left_upper_arm', 'left_elbow'],
  ['left_elbow', 'left_forearm'],
  ['left_forearm', 'left_wrist'],
  ['left_wrist', 'left_hand'],
  ['left_hand', 'left_thumb'], ['left_hand', 'left_index'],
  ['left_hand', 'left_middle'], ['left_hand', 'left_ring'], ['left_hand', 'left_pinky'],
  
  // Right arm connections
  ['right_shoulder', 'right_upper_arm'],
  ['right_upper_arm', 'right_elbow'],
  ['right_elbow', 'right_forearm'],
  ['right_forearm', 'right_wrist'],
  ['right_wrist', 'right_hand'],
  ['right_hand', 'right_thumb'], ['right_hand', 'right_index'],
  ['right_hand', 'right_middle'], ['right_hand', 'right_ring'], ['right_hand', 'right_pinky'],
  
  // Left leg connections
  ['left_hip', 'left_thigh'],
  ['left_thigh', 'left_knee'],
  ['left_knee', 'left_shin'],
  ['left_shin', 'left_ankle'],
  ['left_ankle', 'left_foot'], ['left_ankle', 'left_heel'],
  ['left_foot', 'left_big_toe'], ['left_foot', 'left_toe_2'],
  ['left_foot', 'left_toe_3'], ['left_foot', 'left_toe_4'], ['left_foot', 'left_toe_5'],
  ['left_heel', 'left_arch'], ['left_arch', 'left_foot'],
  
  // Right leg connections
  ['right_hip', 'right_thigh'],
  ['right_thigh', 'right_knee'],
  ['right_knee', 'right_shin'],
  ['right_shin', 'right_ankle'],
  ['right_ankle', 'right_foot'], ['right_ankle', 'right_heel'],
  ['right_foot', 'right_big_toe'], ['right_foot', 'right_toe_2'],
  ['right_foot', 'right_toe_3'], ['right_foot', 'right_toe_4'], ['right_foot', 'right_toe_5'],
  ['right_heel', 'right_arch'], ['right_arch', 'right_foot'],
  
  // Additional back connections for better diagnosis
  ['left_shoulder', 'left_shoulder_blade'], ['right_shoulder', 'right_shoulder_blade'],
  ['upper_spine', 'left_shoulder_blade'], ['upper_spine', 'right_shoulder_blade'],
  ['mid_spine', 'left_lower_back'], ['mid_spine', 'right_lower_back'],
  ['lower_spine', 'tailbone'], ['sacrum', 'tailbone'],
];

export const Skeleton3D: React.FC<Skeleton3DProps> = ({
  onBodyPartPress,
  selectedPart,
  showNodes = false,
  isDrawingMode = false,
  drawingPoints = [],
  onDrawingUpdate,
  onPainLevelSelect,
  painAreas = new Map(),
  onNodesUpdate,
}) => {
  const [rotation, setRotation] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [currentWalkPhase, setCurrentWalkPhase] = useState(0);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [showPainPicker, setShowPainPicker] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Medical terminology mapping for proper node labels
  const getProperNodeName = (nodeName: string): string => {
    const medicalNames: { [key: string]: string } = {
      // Head and Face
      'nose': 'Nasal Bridge',
      'left_eye': 'Left Orbital',
      'right_eye': 'Right Orbital',
      'left_ear': 'Left Auricular',
      'right_ear': 'Right Auricular',
      'forehead': 'Frontal Bone',
      'left_temple': 'Left Temporal',
      'right_temple': 'Right Temporal',
      'left_eyebrow': 'Left Supraorbital',
      'right_eyebrow': 'Right Supraorbital',
      'left_nostril': 'Left Naris',
      'right_nostril': 'Right Naris',
      'left_cheek': 'Left Zygomatic',
      'right_cheek': 'Right Zygomatic',
      'mouth': 'Oral Cavity',
      'left_lip': 'Left Labial',
      'right_lip': 'Right Labial',
      'chin': 'Mental Protuberance',
      'left_jaw': 'Left Mandible',
      'right_jaw': 'Right Mandible',
      
      // Neck and Spine
      'neck_base': 'C7 Vertebra',
      'neck_left': 'Left Cervical',
      'neck_right': 'Right Cervical',
      'upper_spine': 'T1-T6 Thoracic',
      'mid_spine': 'T7-T12 Thoracic',
      'lower_spine': 'L1-L5 Lumbar',
      'sacrum': 'Sacral Region',
      
      // Shoulders and Arms
      'left_shoulder': 'Left Deltoid',
      'right_shoulder': 'Right Deltoid',
      'left_clavicle': 'Left Clavicle',
      'right_clavicle': 'Right Clavicle',
      'left_upper_arm': 'Left Humerus',
      'right_upper_arm': 'Right Humerus',
      'left_elbow': 'Left Olecranon',
      'right_elbow': 'Right Olecranon',
      'left_forearm': 'Left Radius/Ulna',
      'right_forearm': 'Right Radius/Ulna',
      'left_wrist': 'Left Carpal',
      'right_wrist': 'Right Carpal',
      'left_hand': 'Left Metacarpal',
      'right_hand': 'Right Metacarpal',
      
      // Fingers
      'left_thumb': 'Left Pollex',
      'left_index': 'Left Index',
      'left_middle': 'Left Middle',
      'left_ring': 'Left Ring',
      'left_pinky': 'Left Little',
      'right_thumb': 'Right Pollex',
      'right_index': 'Right Index',
      'right_middle': 'Right Middle',
      'right_ring': 'Right Ring',
      'right_pinky': 'Right Little',
      
      // Torso
      'left_chest': 'Left Pectoral',
      'right_chest': 'Right Pectoral',
      'left_ribs': 'Left Costal',
      'right_ribs': 'Right Costal',
      'left_abdomen': 'Left Abdominal',
      'right_abdomen': 'Right Abdominal',
      'left_hip': 'Left Iliac Crest',
      'right_hip': 'Right Iliac Crest',
      
      // Legs
      'left_thigh': 'Left Femur',
      'right_thigh': 'Right Femur',
      'left_knee': 'Left Patella',
      'right_knee': 'Right Patella',
      'left_shin': 'Left Tibia',
      'right_shin': 'Right Tibia',
      'left_calf': 'Left Gastrocnemius',
      'right_calf': 'Right Gastrocnemius',
      'left_ankle': 'Left Malleolus',
      'right_ankle': 'Right Malleolus',
      'left_foot': 'Left Metatarsal',
      'right_foot': 'Right Metatarsal',
      
      // Toes
      'left_big_toe': 'Left Hallux',
      'left_toe_2': 'Left 2nd Digit',
      'left_toe_3': 'Left 3rd Digit',
      'left_toe_4': 'Left 4th Digit',
      'left_toe_5': 'Left 5th Digit',
      'right_big_toe': 'Right Hallux',
      'right_toe_2': 'Right 2nd Digit',
      'right_toe_3': 'Right 3rd Digit',
      'right_toe_4': 'Right 4th Digit',
      'right_toe_5': 'Right 5th Digit',
      
      // Foot structures
      'left_heel': 'Left Calcaneus',
      'right_heel': 'Right Calcaneus',
      'left_arch': 'Left Plantar Arch',
      'right_arch': 'Right Plantar Arch',
      
      // Back and spine details
      'left_shoulder_blade': 'Left Scapula',
      'right_shoulder_blade': 'Right Scapula',
      'left_lower_back': 'Left Lumbar',
      'right_lower_back': 'Right Lumbar',
      'tailbone': 'Coccyx',
    };
    
    return medicalNames[nodeName] || nodeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const rotationValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotationValue.value}deg` }],
    };
  });

  // Walking animation effect - optimized
  useEffect(() => {
    const walkingInterval = setInterval(() => {
      setCurrentWalkPhase(prev => (prev + 0.03) % (2 * Math.PI)); // Slower, smoother animation
    }, 150); // Less frequent updates

    return () => clearInterval(walkingInterval);
  }, []);

  // Update rotation value when rotation state changes
  useEffect(() => {
    rotationValue.value = withTiming(rotation, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [rotation]);

  // Pan responder for 3D rotation (disabled during drawing mode)
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !isDrawingMode,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawingMode) {
        // Horizontal movement controls Y-axis rotation (left/right)
        const rotationYDelta = gestureState.dx * 0.5;
        setRotationY(prev => (prev + rotationYDelta) % 360);
        
        // Vertical movement controls X-axis rotation (up/down)
        const rotationXDelta = gestureState.dy * 0.5;
        setRotationX(prev => Math.max(-90, Math.min(90, prev + rotationXDelta)));
      }
    },
    onPanResponderRelease: () => {},
  });

  // Generate 3D skeleton keypoints with walking animation - Enhanced medical model
  const generateSkeletonKeypoints = React.useCallback((walkPhase: number): Keypoint3D[] => {
    const centerX = SCREEN_WIDTH * 0.5;
    const centerY = SCREEN_HEIGHT * 0.4;
    
    // More exaggerated walking animation calculations
    const armSwing = Math.sin(walkPhase) * 35; // Further increased for more dramatic movement
    const legLift = Math.sin(walkPhase) * 20; // More pronounced leg lifting
    const alternatePhase = walkPhase + Math.PI;
    const legLiftAlt = Math.sin(alternatePhase) * 20; // Matching leg lift
    const bodyBob = Math.sin(walkPhase * 2) * 12; // More body bounce
    const shoulderTilt = Math.sin(walkPhase) * 12; // More shoulder movement
    const hipSway = Math.sin(walkPhase) * 10; // More hip sway
    
    return [
      // Detailed head and facial features
      { name: 'forehead', x: centerX, y: centerY - 135 + bodyBob, z: 10, score: 0.9 },
      { name: 'left_temple', x: centerX - 15, y: centerY - 130 + bodyBob, z: 5, score: 0.85 },
      { name: 'right_template', x: centerX + 15, y: centerY - 130 + bodyBob, z: 5, score: 0.85 },
      { name: 'left_eyebrow', x: centerX - 10, y: centerY - 128 + bodyBob, z: 8, score: 0.8 },
      { name: 'right_eyebrow', x: centerX + 10, y: centerY - 128 + bodyBob, z: 8, score: 0.8 },
      { name: 'left_eye', x: centerX - 8, y: centerY - 125 + bodyBob, z: 8, score: 0.95 },
      { name: 'right_eye', x: centerX + 8, y: centerY - 125 + bodyBob, z: 8, score: 0.95 },
      { name: 'nose', x: centerX, y: centerY - 120 + bodyBob, z: 12, score: 0.95 },
      { name: 'left_nostril', x: centerX - 3, y: centerY - 118 + bodyBob, z: 10, score: 0.8 },
      { name: 'right_nostril', x: centerX + 3, y: centerY - 118 + bodyBob, z: 10, score: 0.8 },
      { name: 'left_cheek', x: centerX - 12, y: centerY - 115 + bodyBob, z: 6, score: 0.85 },
      { name: 'right_cheek', x: centerX + 12, y: centerY - 115 + bodyBob, z: 6, score: 0.85 },
      { name: 'mouth', x: centerX, y: centerY - 110 + bodyBob, z: 8, score: 0.9 },
      { name: 'left_lip', x: centerX - 5, y: centerY - 110 + bodyBob, z: 8, score: 0.8 },
      { name: 'right_lip', x: centerX + 5, y: centerY - 110 + bodyBob, z: 8, score: 0.8 },
      { name: 'chin', x: centerX, y: centerY - 100 + bodyBob, z: 8, score: 0.9 },
      { name: 'left_jaw', x: centerX - 15, y: centerY - 105 + bodyBob, z: 2, score: 0.85 },
      { name: 'right_jaw', x: centerX + 15, y: centerY - 105 + bodyBob, z: 2, score: 0.85 },
      { name: 'left_ear', x: centerX - 20, y: centerY - 120 + bodyBob, z: -5, score: 0.9 },
      { name: 'right_ear', x: centerX + 20, y: centerY - 120 + bodyBob, z: -5, score: 0.9 },
      
      // Neck region
      { name: 'neck_base', x: centerX, y: centerY - 90 + bodyBob, z: 0, score: 0.9 },
      { name: 'neck_left', x: centerX - 12, y: centerY - 95 + bodyBob, z: -2, score: 0.85 },
      { name: 'neck_right', x: centerX + 12, y: centerY - 95 + bodyBob, z: -2, score: 0.85 },
      
      // Spine - crucial for back pain diagnosis
      { name: 'upper_spine', x: centerX, y: centerY - 60 + bodyBob, z: -8, score: 0.9 },
      { name: 'mid_spine', x: centerX, y: centerY + 10 + bodyBob, z: -10, score: 0.9 },
      { name: 'lower_spine', x: centerX, y: centerY + 50 + bodyBob, z: -8, score: 0.9 },
      { name: 'sacrum', x: centerX, y: centerY + 80 + bodyBob, z: -5, score: 0.9 },
      
      // Shoulder girdle and chest
      { name: 'left_shoulder', x: centerX - 55, y: centerY - 70 + bodyBob + shoulderTilt, z: 0, score: 0.95 },
      { name: 'right_shoulder', x: centerX + 55, y: centerY - 70 + bodyBob - shoulderTilt, z: 0, score: 0.95 },
      { name: 'left_clavicle', x: centerX - 30, y: centerY - 80 + bodyBob, z: 5, score: 0.8 },
      { name: 'right_clavicle', x: centerX + 30, y: centerY - 80 + bodyBob, z: 5, score: 0.8 },
      
      // Chest and torso regions
      { name: 'left_chest', x: centerX - 25, y: centerY - 30 + bodyBob, z: 8, score: 0.85 },
      { name: 'right_chest', x: centerX + 25, y: centerY - 30 + bodyBob, z: 8, score: 0.85 },
      { name: 'left_ribs', x: centerX - 30, y: centerY + 5 + bodyBob, z: 5, score: 0.8 },
      { name: 'right_ribs', x: centerX + 30, y: centerY + 5 + bodyBob, z: 5, score: 0.8 },
      { name: 'left_abdomen', x: centerX - 20, y: centerY + 40 + bodyBob, z: 10, score: 0.8 },
      { name: 'right_abdomen', x: centerX + 20, y: centerY + 40 + bodyBob, z: 10, score: 0.8 },
      
      // Left arm - detailed for shoulder, elbow, wrist issues
      { name: 'left_upper_arm', x: centerX - 62 + armSwing * 0.3, y: centerY - 35 + bodyBob, z: -5, score: 0.9 },
      { name: 'left_elbow', x: centerX - 75 + armSwing * 0.7, y: centerY + 5 + bodyBob, z: -12, score: 0.9 },
      { name: 'left_forearm', x: centerX - 80 + armSwing * 0.9, y: centerY + 25 + bodyBob, z: -15, score: 0.85 },
      { name: 'left_wrist', x: centerX - 85 + armSwing * 1.2, y: centerY + 45 + bodyBob, z: -18, score: 0.9 },
      { name: 'left_hand', x: centerX - 90 + armSwing * 1.4, y: centerY + 55 + bodyBob, z: -20, score: 0.85 },
      
      // Left hand fingers
      { name: 'left_thumb', x: centerX - 88 + armSwing * 1.4, y: centerY + 52 + bodyBob, z: -18, score: 0.7 },
      { name: 'left_index', x: centerX - 95 + armSwing * 1.4, y: centerY + 50 + bodyBob, z: -22, score: 0.7 },
      { name: 'left_middle', x: centerX - 95 + armSwing * 1.4, y: centerY + 55 + bodyBob, z: -22, score: 0.7 },
      { name: 'left_ring', x: centerX - 95 + armSwing * 1.4, y: centerY + 60 + bodyBob, z: -22, score: 0.7 },
      { name: 'left_pinky', x: centerX - 92 + armSwing * 1.4, y: centerY + 62 + bodyBob, z: -20, score: 0.7 },
      
      // Right arm - detailed for shoulder, elbow, wrist issues
      { name: 'right_upper_arm', x: centerX + 62 - armSwing * 0.3, y: centerY - 35 + bodyBob, z: -5, score: 0.9 },
      { name: 'right_elbow', x: centerX + 75 - armSwing * 0.7, y: centerY + 5 + bodyBob, z: -12, score: 0.9 },
      { name: 'right_forearm', x: centerX + 80 - armSwing * 0.9, y: centerY + 25 + bodyBob, z: -15, score: 0.85 },
      { name: 'right_wrist', x: centerX + 85 - armSwing * 1.2, y: centerY + 45 + bodyBob, z: -18, score: 0.9 },
      { name: 'right_hand', x: centerX + 90 - armSwing * 1.4, y: centerY + 55 + bodyBob, z: -20, score: 0.85 },
      
      // Right hand fingers
      { name: 'right_thumb', x: centerX + 88 - armSwing * 1.4, y: centerY + 52 + bodyBob, z: -18, score: 0.7 },
      { name: 'right_index', x: centerX + 95 - armSwing * 1.4, y: centerY + 50 + bodyBob, z: -22, score: 0.7 },
      { name: 'right_middle', x: centerX + 95 - armSwing * 1.4, y: centerY + 55 + bodyBob, z: -22, score: 0.7 },
      { name: 'right_ring', x: centerX + 95 - armSwing * 1.4, y: centerY + 60 + bodyBob, z: -22, score: 0.7 },
      { name: 'right_pinky', x: centerX + 92 - armSwing * 1.4, y: centerY + 62 + bodyBob, z: -20, score: 0.7 },
      
      // Hip region with sway
      { name: 'left_hip', x: centerX - 35 + hipSway, y: centerY + 90 + bodyBob, z: 0, score: 0.95 },
      { name: 'right_hip', x: centerX + 35 + hipSway, y: centerY + 90 + bodyBob, z: 0, score: 0.95 },
      
      // Left leg - detailed for knee, ankle, foot issues
      { name: 'left_thigh', x: centerX - 38, y: centerY + 120 + bodyBob + legLift * 0.3, z: -3, score: 0.9 },
      { name: 'left_knee', x: centerX - 40, y: centerY + 160 + bodyBob + legLift * 0.7, z: -8, score: 0.95 },
      { name: 'left_shin', x: centerX - 38, y: centerY + 200 + bodyBob + legLift * 0.5, z: -5, score: 0.9 },
      { name: 'left_ankle', x: centerX - 35, y: centerY + 240 + bodyBob + legLift * 0.2, z: -8, score: 0.9 },
      { name: 'left_foot', x: centerX - 32, y: centerY + 255 + bodyBob, z: -5, score: 0.85 },
      { name: 'left_big_toe', x: centerX - 28, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_toe_2', x: centerX - 32, y: centerY + 267 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_toe_3', x: centerX - 35, y: centerY + 267 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_toe_4', x: centerX - 37, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_toe_5', x: centerX - 39, y: centerY + 262 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_heel', x: centerX - 32, y: centerY + 245 + bodyBob, z: -8, score: 0.8 },
      { name: 'left_arch', x: centerX - 32, y: centerY + 250 + bodyBob, z: -3, score: 0.75 },
      
      // Right leg - detailed for knee, ankle, foot issues
      { name: 'right_thigh', x: centerX + 38, y: centerY + 120 + bodyBob + legLiftAlt * 0.3, z: -3, score: 0.9 },
      { name: 'right_knee', x: centerX + 40, y: centerY + 160 + bodyBob + legLiftAlt * 0.7, z: -8, score: 0.95 },
      { name: 'right_shin', x: centerX + 38, y: centerY + 200 + bodyBob + legLiftAlt * 0.5, z: -5, score: 0.9 },
      { name: 'right_ankle', x: centerX + 35, y: centerY + 240 + bodyBob + legLiftAlt * 0.2, z: -8, score: 0.9 },
      { name: 'right_foot', x: centerX + 32, y: centerY + 255 + bodyBob, z: -5, score: 0.85 },
      { name: 'right_big_toe', x: centerX + 28, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_toe_2', x: centerX + 32, y: centerY + 267 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_toe_3', x: centerX + 35, y: centerY + 267 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_toe_4', x: centerX + 37, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_toe_5', x: centerX + 39, y: centerY + 262 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_heel', x: centerX + 32, y: centerY + 245 + bodyBob, z: -8, score: 0.8 },
      { name: 'right_arch', x: centerX + 32, y: centerY + 250 + bodyBob, z: -3, score: 0.75 },
      
      // Additional torso and back nodes for better diagnosis
      { name: 'left_shoulder_blade', x: centerX - 25, y: centerY - 50 + bodyBob, z: -15, score: 0.85 },
      { name: 'right_shoulder_blade', x: centerX + 25, y: centerY - 50 + bodyBob, z: -15, score: 0.85 },
      { name: 'left_lower_back', x: centerX - 15, y: centerY + 30 + bodyBob, z: -12, score: 0.8 },
      { name: 'right_lower_back', x: centerX + 15, y: centerY + 30 + bodyBob, z: -12, score: 0.8 },
      { name: 'tailbone', x: centerX, y: centerY + 85 + bodyBob, z: -8, score: 0.85 },
    ];
  }, []);

  // Transform 3D points based on rotation - Enhanced for full 3D rotation
  const transform3D = (point: Keypoint3D, rotX: number, rotY: number): Keypoint3D => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;
    
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    
    // Center the point for rotation
    const centeredX = point.x - SCREEN_WIDTH / 2;
    const centeredY = point.y - SCREEN_HEIGHT * 0.4;
    const centeredZ = point.z;
    
    // Apply Y-axis rotation (left/right)
    let x1 = centeredX * cosY - centeredZ * sinY;
    let y1 = centeredY;
    let z1 = centeredX * sinY + centeredZ * cosY;
    
    // Apply X-axis rotation (up/down)
    let x2 = x1;
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    
    // Project to 2D with perspective
    const perspective = 1000;
    const projectedX = SCREEN_WIDTH / 2 + x2 * (perspective / (perspective + z2));
    const projectedY = SCREEN_HEIGHT * 0.4 + y2 * (perspective / (perspective + z2));
    
    return {
      ...point,
      x: projectedX,
      y: projectedY,
      z: z2,
    };
  };

  // Reset rotation to default
  const resetRotation = () => {
    setRotationX(0);
    setRotationY(0);
    setRotation(0);
  };

  const handleBodyPartPress = (partName: string) => {
    if (onBodyPartPress) {
      onBodyPartPress(partName);
    }
  };

  // Pain level picker component
  const renderPainPicker = () => {
    if (!showPainPicker) return null;

    const painLevels = Array.from({ length: 11 }, (_, i) => i);
    
    const getPainColor = (level: number) => {
      if (level === 0) return '#00FF00'; // Green for no pain
      const red = Math.min(255, 50 + (level * 20));
      const green = Math.max(0, 255 - (level * 25));
      return `rgb(${red}, ${green}, 0)`;
    };

    return (
      <View style={styles.painPickerOverlay}>
        <View style={styles.painPickerContainer}>
          <Text style={styles.painPickerTitle}>
            Pain Level for {selectedBodyPart.replace('_', ' ')}
          </Text>
          <Text style={styles.painPickerSubtitle}>
            Select pain level (0 = no pain, 10 = severe pain)
          </Text>
          <View style={styles.painLevelGrid}>
            {painLevels.map(level => (
              <Pressable
                key={level}
                style={[
                  styles.painLevelButton,
                  { backgroundColor: getPainColor(level) }
                ]}
                onPress={() => {
                  if (onPainLevelSelect) {
                    onPainLevelSelect(selectedBodyPart, level);
                  }
                  setShowPainPicker(false);
                  setSelectedBodyPart('');
                }}
              >
                <Text style={styles.painLevelText}>{level}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable 
            style={styles.cancelButton}
            onPress={() => {
              setShowPainPicker(false);
              setSelectedBodyPart('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderSkeleton = React.useCallback(() => {
    const keypoints = generateSkeletonKeypoints(currentWalkPhase);
    const transformedKeypoints = keypoints.map(kp => transform3D(kp, rotationX, rotationY));
    
    // Update node positions for parent component (memoized) with coordinate adjustment
    React.useEffect(() => {
      if (onNodesUpdate) {
        const nodePositions: DrawingPoint[] = transformedKeypoints.map(kp => ({
          x: kp.x,
          y: kp.y + (SCREEN_HEIGHT * 0.1), // Add offset to align with drawing overlay
          bodyPart: kp.name,
          painLevel: painAreas.get(kp.name)
        }));
        onNodesUpdate(nodePositions);
      }
    }, [transformedKeypoints.length, onNodesUpdate]);
    
    // Create keypoint lookup
    const keypointMap: { [key: string]: Keypoint3D } = {};
    transformedKeypoints.forEach(kp => {
      keypointMap[kp.name] = kp;
    });

    return (
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.8}>
        <G>
          {/* Render skeleton lines */}
          {SKELETON_CONNECTIONS.map(([from, to], index) => {
            const fromPoint = keypointMap[from];
            const toPoint = keypointMap[to];
            
            if (!fromPoint || !toPoint) return null;
            
            // Color based on depth for 3D effect and pain level
            const avgZ = (fromPoint.z + toPoint.z) / 2;
            const opacity = Math.max(0.4, 1 - Math.abs(avgZ) * 0.008);
            const strokeWidth = Math.max(1.5, 3 - Math.abs(avgZ) * 0.015);
            
            // Check if either endpoint has pain
            const fromPainLevel = painAreas.get(fromPoint.name);
            const toPainLevel = painAreas.get(toPoint.name);
            const maxPainLevel = Math.max(fromPainLevel || 0, toPainLevel || 0);
            
            let strokeColor = colors.gradientStart;
            if (maxPainLevel > 0) {
              strokeColor = getPainColor(maxPainLevel);
            }
            
            return (
              <Line
                key={`${from}-${to}-${index}`}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            );
          })}
          
          {/* Render keypoints/nodes if enabled */}
          {showNodes && transformedKeypoints.map((point, index) => {
            const isSelected = selectedPart === point.name;
            const opacity = Math.max(0.5, 1 - Math.abs(point.z) * 0.01);
            const radius = Math.max(3, 6 - Math.abs(point.z) * 0.025);
            const painLevel = painAreas.get(point.name);
            
            let nodeColor = isSelected ? colors.accent : colors.primary;
            if (painLevel !== undefined && painLevel > 0) {
              nodeColor = getPainColor(painLevel);
            }
            
            return (
              <G key={`${point.name}-${index}`}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={nodeColor}
                  opacity={opacity}
                  stroke={colors.surface}
                  strokeWidth={1}
                  onPress={() => handleBodyPartPress(point.name)}
                  onPressIn={() => setHoveredNode(point.name)}
                  onPressOut={() => setHoveredNode(null)}
                />
                {/* Node labels - Only show when hovered for performance */}
                {hoveredNode === point.name && (
                  <SvgText
                    x={point.x}
                    y={point.y - radius - 5}
                    fontSize="10"
                    fill={colors.accent}
                    textAnchor="middle"
                    opacity={1}
                    fontWeight="bold"
                  >
                    {getProperNodeName(point.name)}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    );
  }, [currentWalkPhase, rotation, showNodes, selectedPart, painAreas, hoveredNode, generateSkeletonKeypoints, getProperNodeName]);

  // Get pain color helper function
  const getPainColor = (level: number) => {
    if (level === 0) return '#00FF00'; // Green for no pain
    const red = Math.min(255, 50 + (level * 20));
    const green = Math.max(0, 255 - (level * 25));
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <Animated.View style={styles.container} {...panResponder.panHandlers}>
      {renderSkeleton()}
      <View style={styles.controls}>
        <Text style={styles.instructions}>
          {isDrawingMode ? 'Draw areas to mark pain regions' : 'Drag to rotate • Tap joints to select'}
        </Text>
        {!isDrawingMode && (
          <Pressable style={styles.resetButton} onPress={resetRotation}>
            <Text style={styles.resetButtonText}>Reset View</Text>
          </Pressable>
        )}
        {selectedPart && (
          <Text style={styles.selectedText}>
            Selected: {selectedPart.replace('_', ' ')}
          </Text>
        )}
      </View>
      {renderPainPicker()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  instructions: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  selectedText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  painPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  painPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  painPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  painPickerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  painLevelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  painLevelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  painLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  cancelButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  resetButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
