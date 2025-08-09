import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, Pressable, Modal } from 'react-native';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DrawingPoint {
  x: number;
  y: number;
  bodyPart?: string;
  painLevel?: number;
}

interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  bodyPart?: string;
  painLevel?: number;
  isClosedLoop?: boolean;
}

interface DrawingOverlayProps {
  isDrawingMode: boolean;
  onDrawingComplete?: (path: DrawingPath) => void;
  drawings?: DrawingPath[];
  onUndo?: () => void;
  onRedo?: () => void;
  onPainLevelAssigned?: (painLevel: number, enclosedArea: DrawingPoint[]) => void;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  isDrawingMode,
  onDrawingComplete,
  drawings = [],
  onPainLevelAssigned,
}) => {
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPainPicker, setShowPainPicker] = useState(false);
  const [currentClosedLoop, setCurrentClosedLoop] = useState<DrawingPoint[]>([]);
  const [tempDrawingPath, setTempDrawingPath] = useState<DrawingPath | null>(null);

  // Smooth the drawing path using Catmull-Rom spline
  const smoothPath = useCallback((points: DrawingPoint[]): DrawingPoint[] => {
    if (points.length < 3) return points;
    
    const smoothedPoints: DrawingPoint[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Add the original point
      smoothedPoints.push(p1);
      
      // Add interpolated points for smoothness
      for (let t = 0.2; t < 1; t += 0.2) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        smoothedPoints.push({ x, y });
      }
    }
    
    // Add the last point
    if (points.length > 0) {
      smoothedPoints.push(points[points.length - 1]);
    }
    return smoothedPoints;
  }, []);

  // Auto-close the loop by connecting last point to first
  const createClosedLoop = useCallback((points: DrawingPoint[]): DrawingPoint[] => {
    if (points.length < 3) return points;
    
    const smoothedPoints = smoothPath(points);
    const firstPoint = smoothedPoints[0];
    const lastPoint = smoothedPoints[smoothedPoints.length - 1];
    
    // Check if we need to close the loop (if endpoints are far apart)
    const distance = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) + 
      Math.pow(lastPoint.y - firstPoint.y, 2)
    );
    
    if (distance > 20) {
      // Add intermediate points to close the loop smoothly
      const steps = Math.ceil(distance / 10);
      const closingPoints: DrawingPoint[] = [];
      
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        closingPoints.push({
          x: lastPoint.x + (firstPoint.x - lastPoint.x) * t,
          y: lastPoint.y + (firstPoint.y - lastPoint.y) * t,
        });
      }
      
      return [...smoothedPoints, ...closingPoints];
    }
    
    return [...smoothedPoints, firstPoint]; // Close the loop
  }, [smoothPath]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: () => isDrawingMode && !showPainPicker,
    onPanResponderGrant: (evt) => {
      if (!isDrawingMode || showPainPicker) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(true);
      setCurrentPath([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawingMode || !isDrawing || showPainPicker) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => {
        // Reduce points for smoother performance
        const lastPoint = prev[prev.length - 1];
        if (lastPoint) {
          const distance = Math.sqrt(
            Math.pow(locationX - lastPoint.x, 2) + 
            Math.pow(locationY - lastPoint.y, 2)
          );
          // Only add point if it's far enough from the last one
          if (distance > 5) {
            return [...prev, { x: locationX, y: locationY }];
          }
        }
        return prev;
      });
    },
    onPanResponderRelease: () => {
      if (!isDrawingMode || !isDrawing || showPainPicker) return;
      
      setIsDrawing(false);
      if (currentPath.length > 3) {
        // Create smooth closed loop
        const closedLoop = createClosedLoop(currentPath);
        setCurrentClosedLoop(closedLoop);
        
        // Create temporary drawing path
        const newDrawing: DrawingPath = {
          id: Date.now().toString(),
          points: closedLoop,
          isClosedLoop: true,
        };
        setTempDrawingPath(newDrawing);
        
        // Show pain picker
        setShowPainPicker(true);
      }
      setCurrentPath([]);
    },
  }), [isDrawingMode, showPainPicker, isDrawing, currentPath, createClosedLoop]);

  const pathToSVGPath = (points: DrawingPoint[], closePath: boolean = false): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    if (closePath) {
      path += ' Z'; // Close the path
    }
    
    return path;
  };

  // Convert points to polygon string for filled areas
  const pointsToPolygonString = (points: DrawingPoint[]): string => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  const getPainColor = (level?: number) => {
    if (level === undefined || level === 0) return '#00FF00'; // Green for no pain
    const red = Math.min(255, 50 + (level * 20));
    const green = Math.max(0, 255 - (level * 25));
    return `rgb(${red}, ${green}, 0)`;
  };

  const handlePainLevelSelect = (level: number) => {
    if (tempDrawingPath && onPainLevelAssigned) {
      // Assign pain level to the enclosed area
      onPainLevelAssigned(level, currentClosedLoop);
    }
    
    // Clean up and hide drawing (no longer save the drawing itself)
    setShowPainPicker(false);
    setCurrentClosedLoop([]);
    setTempDrawingPath(null);
  };

  const handleCancelPainPicker = () => {
    setShowPainPicker(false);
    setCurrentClosedLoop([]);
    setTempDrawingPath(null);
  };

  const renderPainPicker = () => {
    if (!showPainPicker) return null;

    const painLevels = Array.from({ length: 11 }, (_, i) => i);

    return (
      <Modal
        visible={showPainPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelPainPicker}
      >
        <View style={styles.painPickerOverlay}>
          <View style={styles.painPickerContainer}>
            <View style={styles.painPickerHeader}>
              <Text style={styles.painPickerTitle}>
                Pain Assessment
              </Text>
              <Text style={styles.painPickerSubtitle}>
                Rate your pain intensity in the marked area
              </Text>
            </View>
            
            <View style={styles.painScaleContainer}>
              <View style={styles.painScaleLabels}>
                <Text style={styles.painScaleLabel}>No Pain</Text>
                <Text style={styles.painScaleLabel}>Moderate</Text>
                <Text style={styles.painScaleLabel}>Severe</Text>
              </View>
              
              <View style={styles.painLevelGrid}>
                {painLevels.map(level => (
                  <Pressable
                    key={level}
                    style={[
                      styles.painLevelButton,
                      { backgroundColor: getPainColor(level) }
                    ]}
                    onPress={() => handlePainLevelSelect(level)}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Text style={[
                      styles.painLevelText,
                      { color: level < 5 ? '#000' : '#fff' }
                    ]}>
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              <View style={styles.painScaleNumbers}>
                <Text style={styles.painScaleNumber}>0</Text>
                <Text style={styles.painScaleNumber}>5</Text>
                <Text style={styles.painScaleNumber}>10</Text>
              </View>
            </View>

            <View style={styles.painPickerActions}>
              <Pressable 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelPainPicker}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!isDrawingMode && drawings.length === 0 && currentPath.length === 0 && currentClosedLoop.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container} {...panResponder.panHandlers}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.svg}>
          {/* Render current drawing */}
          {currentPath.length > 1 && (
            <Path
              d={pathToSVGPath(currentPath)}
              stroke={colors.accent}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.6}
            />
          )}

          {/* Render current closed loop (preview) */}
          {currentClosedLoop.length > 0 && (
            <>
              <Polygon
                points={pointsToPolygonString(currentClosedLoop)}
                fill={colors.accent}
                fillOpacity={0.2}
                stroke={colors.accent}
                strokeWidth={3}
                strokeDasharray="5,5"
              />
            </>
          )}
        </Svg>
      </View>
      {renderPainPicker()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  painPickerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  painScaleContainer: {
    width: '100%',
    alignItems: 'center',
  },
  painScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  painScaleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  painScaleNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 25,
  },
  painScaleNumber: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
  painPickerActions: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButton: {
    minWidth: 120,
    alignItems: 'center',
  },
});
