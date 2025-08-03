import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}

// Define body part connections for skeleton lines
const SKELETON_CONNECTIONS = [
  // Head and neck
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  
  // Torso
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  
  // Arms
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  
  // Legs
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

// Body part groups for better organization
const BODY_PARTS = {
  head: ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'],
  torso: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  leftArm: ['left_shoulder', 'left_elbow', 'left_wrist'],
  rightArm: ['right_shoulder', 'right_elbow', 'right_wrist'],
  leftLeg: ['left_hip', 'left_knee', 'left_ankle'],
  rightLeg: ['right_hip', 'right_knee', 'right_ankle'],
};

export const Skeleton3D: React.FC<Skeleton3DProps> = ({ 
  onBodyPartPress, 
  selectedPart,
  showNodes = false,
  isDrawingMode = false,
  drawingPoints = [],
  onDrawingUpdate,
  onPainLevelSelect
}) => {
  const [rotation, setRotation] = useState(0);
  const [currentWalkPhase, setCurrentWalkPhase] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingPoint[]>([]);
  const [showPainPicker, setShowPainPicker] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  
  // Animation values
  const walkCycle = useSharedValue(0);
  const rotationValue = useSharedValue(0);
  
  useEffect(() => {
    // Start walking animation
    walkCycle.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1
    );
    
    // Update walking phase for rendering
    const interval = setInterval(() => {
      setCurrentWalkPhase(prev => (prev + 0.1) % (2 * Math.PI));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // Update rotation value when rotation state changes
  useEffect(() => {
    rotationValue.value = withTiming(rotation, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [rotation]);

  // Pan responder for rotation and drawing
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (isDrawingMode) {
        setIsDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentDrawing([{ x: locationX, y: locationY }]);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isDrawingMode && isDrawing) {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentDrawing(prev => [...prev, { x: locationX, y: locationY }]);
      } else if (!isDrawingMode) {
        const rotationDelta = gestureState.dx * 0.5;
        setRotation(prev => (prev + rotationDelta) % 360);
      }
    },
    onPanResponderRelease: () => {
      if (isDrawingMode && isDrawing) {
        setIsDrawing(false);
        // Check which body part was drawn on
        const bodyPart = detectBodyPartFromDrawing(currentDrawing);
        if (bodyPart) {
          setSelectedBodyPart(bodyPart);
          setShowPainPicker(true);
        }
        if (onDrawingUpdate) {
          onDrawingUpdate([...drawingPoints, ...currentDrawing]);
        }
        setCurrentDrawing([]);
      }
    },
  });

  // Detect which body part was drawn on based on drawing points
  const detectBodyPartFromDrawing = (points: DrawingPoint[]): string | null => {
    if (points.length === 0) return null;
    
    // Get the center of the drawing
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    // Get current skeleton keypoints
    const keypoints = generateSkeletonKeypoints(currentWalkPhase);
    const transformedKeypoints = keypoints.map(kp => transform3D(kp, rotation));
    
    // Find closest body part
    let closestPart = '';
    let minDistance = Infinity;
    
    transformedKeypoints.forEach(kp => {
      const distance = Math.sqrt(
        Math.pow(centerX - kp.x, 2) + Math.pow(centerY - kp.y, 2)
      );
      if (distance < minDistance && distance < 50) { // 50px threshold
        minDistance = distance;
        closestPart = kp.name;
      }
    });
    
    return closestPart || null;
  };

  // Generate 3D skeleton keypoints with walking animation
  const generateSkeletonKeypoints = React.useCallback((walkPhase: number): Keypoint3D[] => {
    const centerX = SCREEN_WIDTH * 0.5;
    const centerY = SCREEN_HEIGHT * 0.4;
    
    // Walking animation calculations
    const armSwing = Math.sin(walkPhase) * 15;
    const legLift = Math.sin(walkPhase) * 8;
    const alternatePhase = walkPhase + Math.PI; // Opposite leg movement
    const legLiftAlt = Math.sin(alternatePhase) * 8;
    const bodyBob = Math.sin(walkPhase * 2) * 3; // Body bobbing motion
    
    return [
      // Head
      { name: 'nose', x: centerX, y: centerY - 100 + bodyBob, z: 0, score: 0.9 },
      { name: 'left_eye', x: centerX - 8, y: centerY - 105 + bodyBob, z: 2, score: 0.9 },
      { name: 'right_eye', x: centerX + 8, y: centerY - 105 + bodyBob, z: 2, score: 0.9 },
      { name: 'left_ear', x: centerX - 15, y: centerY - 100 + bodyBob, z: -3, score: 0.9 },
      { name: 'right_ear', x: centerX + 15, y: centerY - 100 + bodyBob, z: -3, score: 0.9 },
      
      // Torso
      { name: 'left_shoulder', x: centerX - 50, y: centerY - 60 + bodyBob, z: 0, score: 0.9 },
      { name: 'right_shoulder', x: centerX + 50, y: centerY - 60 + bodyBob, z: 0, score: 0.9 },
      { name: 'left_hip', x: centerX - 30, y: centerY + 40 + bodyBob, z: 0, score: 0.9 },
      { name: 'right_hip', x: centerX + 30, y: centerY + 40 + bodyBob, z: 0, score: 0.9 },
      
      // Arms (with swing)
      { name: 'left_elbow', x: centerX - 70 + armSwing, y: centerY - 20 + bodyBob, z: armSwing * 0.3, score: 0.9 },
      { name: 'right_elbow', x: centerX + 70 - armSwing, y: centerY - 20 + bodyBob, z: -armSwing * 0.3, score: 0.9 },
      { name: 'left_wrist', x: centerX - 85 + armSwing * 1.5, y: centerY + 10 + bodyBob, z: armSwing * 0.5, score: 0.9 },
      { name: 'right_wrist', x: centerX + 85 - armSwing * 1.5, y: centerY + 10 + bodyBob, z: -armSwing * 0.5, score: 0.9 },
      
      // Legs (with walking motion)
      { name: 'left_knee', x: centerX - 35 + legLift * 0.5, y: centerY + 100 - legLift, z: legLift * 0.8, score: 0.9 },
      { name: 'right_knee', x: centerX + 35 + legLiftAlt * 0.5, y: centerY + 100 - legLiftAlt, z: legLiftAlt * 0.8, score: 0.9 },
      { name: 'left_ankle', x: centerX - 40 + legLift, y: centerY + 160 - legLift * 1.5, z: legLift * 1.2, score: 0.9 },
      { name: 'right_ankle', x: centerX + 40 + legLiftAlt, y: centerY + 160 - legLiftAlt * 1.5, z: legLiftAlt * 1.2, score: 0.9 },
    ];
  }, []);

  // Transform 3D point based on rotation
  const transform3D = React.useCallback((point: Keypoint3D, rotationDeg: number) => {
    const radians = (rotationDeg * Math.PI) / 180;
    const cosR = Math.cos(radians);
    const sinR = Math.sin(radians);
    
    // Calculate center point for rotation
    const centerX = SCREEN_WIDTH * 0.5;
    const centerY = SCREEN_HEIGHT * 0.4;
    
    // Translate to origin, rotate around center, then translate back
    const translatedX = point.x - centerX;
    const translatedZ = point.z;
    
    // Apply Y-axis rotation around center
    const rotatedX = translatedX * cosR - translatedZ * sinR;
    const rotatedZ = translatedX * sinR + translatedZ * cosR;
    
    // Add perspective (simple depth scaling)
    const perspective = 1 + rotatedZ * 0.001;
    
    return {
      ...point,
      x: centerX + rotatedX * perspective,
      y: point.y * perspective,
      z: rotatedZ,
    };
  }, []);

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

  const renderSkeleton = () => {
    const keypoints = generateSkeletonKeypoints(currentWalkPhase);
    const transformedKeypoints = keypoints.map(kp => transform3D(kp, rotation));
    
    // Create keypoint lookup
    const keypointMap: { [key: string]: Keypoint3D } = {};
    transformedKeypoints.forEach(kp => {
      keypointMap[kp.name] = kp;
    });

    return (
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.7}>
        <G>
          {/* Render skeleton lines */}
          {SKELETON_CONNECTIONS.map(([from, to], index) => {
            const fromPoint = keypointMap[from];
            const toPoint = keypointMap[to];
            
            if (!fromPoint || !toPoint) return null;
            
            // Color based on depth for 3D effect
            const avgZ = (fromPoint.z + toPoint.z) / 2;
            const opacity = Math.max(0.3, 1 - Math.abs(avgZ) * 0.01);
            const strokeWidth = Math.max(2, 4 - Math.abs(avgZ) * 0.02);
            
            return (
              <Line
                key={index}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke={colors.gradientStart}
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            );
          })}
          
          {/* Render keypoints/nodes if enabled */}
          {showNodes && transformedKeypoints.map((point, index) => {
            const isSelected = selectedPart === point.name;
            const opacity = Math.max(0.4, 1 - Math.abs(point.z) * 0.01);
            const radius = Math.max(4, 8 - Math.abs(point.z) * 0.03);
            
            return (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={isSelected ? colors.accent : colors.primary}
                opacity={opacity}
                stroke={colors.surface}
                strokeWidth={2}
                onPress={() => handleBodyPartPress(point.name)}
              />
            );
          })}

          {/* Render drawing points */}
          {drawingPoints.map((point, index) => (
            <Circle
              key={`drawing-${index}`}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={point.painLevel !== undefined ? getPainColor(point.painLevel) : colors.accent}
              opacity={0.8}
            />
          ))}

          {/* Render current drawing */}
          {currentDrawing.map((point, index) => (
            <Circle
              key={`current-${index}`}
              cx={point.x}
              cy={point.y}
              r={2}
              fill={colors.accent}
              opacity={0.6}
            />
          ))}
        </G>
      </Svg>
    );
  };

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
          {isDrawingMode ? 'Draw on body parts to mark pain areas' : 'Drag to rotate • Tap joints to select'}
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
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.md,
    maxWidth: SCREEN_WIDTH * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  painPickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  painPickerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  painLevelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  painLevelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  painLevelText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
