import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
}

interface DrawingOverlayProps {
  isDrawingMode: boolean;
  onDrawingComplete?: (path: DrawingPath) => void;
  drawings?: DrawingPath[];
  onUndo?: () => void;
  onRedo?: () => void;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  isDrawingMode,
  onDrawingComplete,
  drawings = [],
}) => {
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => isDrawingMode,
    onPanResponderGrant: (evt) => {
      if (!isDrawingMode) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(true);
      setCurrentPath([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawingMode || !isDrawing) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
    },
    onPanResponderRelease: () => {
      if (!isDrawingMode || !isDrawing) return;
      
      setIsDrawing(false);
      if (currentPath.length > 1 && onDrawingComplete) {
        const newDrawing: DrawingPath = {
          id: Date.now().toString(),
          points: currentPath,
        };
        onDrawingComplete(newDrawing);
      }
      setCurrentPath([]);
    },
  });

  const pathToSVGPath = (points: DrawingPoint[]): string => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const getPainColor = (level?: number) => {
    if (level === undefined || level === 0) return colors.accent;
    const red = Math.min(255, 50 + (level * 20));
    const green = Math.max(0, 255 - (level * 25));
    return `rgb(${red}, ${green}, 0)`;
  };

  if (!isDrawingMode && drawings.length === 0 && currentPath.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.svg}>
        {/* Render existing drawings */}
        {drawings.map(drawing => (
          <Path
            key={drawing.id}
            d={pathToSVGPath(drawing.points)}
            stroke={getPainColor(drawing.painLevel)}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.8}
          />
        ))}
        
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
      </Svg>
    </View>
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
});
