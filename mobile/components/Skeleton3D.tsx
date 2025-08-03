import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Svg, { G, Line, Circle } from 'react-native-svg';
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
  // Head and neck connections
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  ['nose', 'neck_base'],
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
  ['left_ankle', 'left_foot'],
  ['left_foot', 'left_big_toe'], ['left_foot', 'left_small_toe'],
  
  // Right leg connections
  ['right_hip', 'right_thigh'],
  ['right_thigh', 'right_knee'],
  ['right_knee', 'right_shin'],
  ['right_shin', 'right_ankle'],
  ['right_ankle', 'right_foot'],
  ['right_foot', 'right_big_toe'], ['right_foot', 'right_small_toe'],
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
  const [currentWalkPhase, setCurrentWalkPhase] = useState(0);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [showPainPicker, setShowPainPicker] = useState(false);

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

  // Pan responder for rotation (disabled during drawing mode)
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !isDrawingMode,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawingMode) {
        const rotationDelta = gestureState.dx * 0.5;
        setRotation(prev => (prev + rotationDelta) % 360);
      }
    },
    onPanResponderRelease: () => {},
  });

  // Generate 3D skeleton keypoints with walking animation - Enhanced medical model
  const generateSkeletonKeypoints = React.useCallback((walkPhase: number): Keypoint3D[] => {
    const centerX = SCREEN_WIDTH * 0.5;
    const centerY = SCREEN_HEIGHT * 0.4;
    
    // Walking animation calculations
    const armSwing = Math.sin(walkPhase) * 12;
    const legLift = Math.sin(walkPhase) * 6;
    const alternatePhase = walkPhase + Math.PI;
    const legLiftAlt = Math.sin(alternatePhase) * 6;
    const bodyBob = Math.sin(walkPhase * 2) * 2;
    const shoulderTilt = Math.sin(walkPhase) * 2;
    
    return [
      // Head and facial features
      { name: 'nose', x: centerX, y: centerY - 120 + bodyBob, z: 5, score: 0.95 },
      { name: 'left_eye', x: centerX - 8, y: centerY - 125 + bodyBob, z: 8, score: 0.9 },
      { name: 'right_eye', x: centerX + 8, y: centerY - 125 + bodyBob, z: 8, score: 0.9 },
      { name: 'left_ear', x: centerX - 18, y: centerY - 120 + bodyBob, z: -5, score: 0.85 },
      { name: 'right_ear', x: centerX + 18, y: centerY - 120 + bodyBob, z: -5, score: 0.85 },
      
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
      
      // Hip region
      { name: 'left_hip', x: centerX - 35, y: centerY + 90 + bodyBob, z: 0, score: 0.95 },
      { name: 'right_hip', x: centerX + 35, y: centerY + 90 + bodyBob, z: 0, score: 0.95 },
      
      // Left leg - detailed for knee, ankle, foot issues
      { name: 'left_thigh', x: centerX - 38, y: centerY + 120 + bodyBob + legLift * 0.3, z: -3, score: 0.9 },
      { name: 'left_knee', x: centerX - 40, y: centerY + 160 + bodyBob + legLift * 0.7, z: -8, score: 0.95 },
      { name: 'left_shin', x: centerX - 38, y: centerY + 200 + bodyBob + legLift * 0.5, z: -5, score: 0.9 },
      { name: 'left_ankle', x: centerX - 35, y: centerY + 240 + bodyBob + legLift * 0.2, z: -8, score: 0.9 },
      { name: 'left_foot', x: centerX - 32, y: centerY + 255 + bodyBob, z: -5, score: 0.85 },
      { name: 'left_big_toe', x: centerX - 28, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'left_small_toe', x: centerX - 35, y: centerY + 262 + bodyBob, z: 0, score: 0.7 },
      
      // Right leg - detailed for knee, ankle, foot issues
      { name: 'right_thigh', x: centerX + 38, y: centerY + 120 + bodyBob + legLiftAlt * 0.3, z: -3, score: 0.9 },
      { name: 'right_knee', x: centerX + 40, y: centerY + 160 + bodyBob + legLiftAlt * 0.7, z: -8, score: 0.95 },
      { name: 'right_shin', x: centerX + 38, y: centerY + 200 + bodyBob + legLiftAlt * 0.5, z: -5, score: 0.9 },
      { name: 'right_ankle', x: centerX + 35, y: centerY + 240 + bodyBob + legLiftAlt * 0.2, z: -8, score: 0.9 },
      { name: 'right_foot', x: centerX + 32, y: centerY + 255 + bodyBob, z: -5, score: 0.85 },
      { name: 'right_big_toe', x: centerX + 28, y: centerY + 265 + bodyBob, z: 0, score: 0.7 },
      { name: 'right_small_toe', x: centerX + 35, y: centerY + 262 + bodyBob, z: 0, score: 0.7 },
    ];
  }, []);

  // Transform 3D points based on rotation
  const transform3D = (point: Keypoint3D, rotationY: number): Keypoint3D => {
    const rad = (rotationY * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Apply rotation around Y-axis
    const newX = point.x * cos - point.z * sin;
    const newZ = point.x * sin + point.z * cos;
    
    // Project to 2D with perspective
    const perspective = 1000;
    const projectedX = SCREEN_WIDTH / 2 + (newX - SCREEN_WIDTH / 2) * (perspective / (perspective + newZ));
    
    return {
      ...point,
      x: projectedX,
      z: newZ,
    };
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
    const transformedKeypoints = keypoints.map(kp => transform3D(kp, rotation));
    
    // Update node positions for parent component (memoized)
    React.useEffect(() => {
      if (onNodesUpdate) {
        const nodePositions: DrawingPoint[] = transformedKeypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
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
              <Circle
                key={`${point.name}-${index}`}
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={nodeColor}
                opacity={opacity}
                stroke={colors.surface}
                strokeWidth={1}
                onPress={() => handleBodyPartPress(point.name)}
              />
            );
          })}
        </G>
      </Svg>
    );
  }, [currentWalkPhase, rotation, showNodes, selectedPart, painAreas, generateSkeletonKeypoints]);

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
});
