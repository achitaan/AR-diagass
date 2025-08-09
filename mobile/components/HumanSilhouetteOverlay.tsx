import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { HumanSilhouette, DetectedBodyPart } from '../hooks/useHumanDetection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HumanSilhouetteOverlayProps {
  silhouette: HumanSilhouette | null;
  showBodyParts?: boolean;
  showSilhouette?: boolean;
  style?: any;
}

export const HumanSilhouetteOverlay: React.FC<HumanSilhouetteOverlayProps> = ({
  silhouette,
  showBodyParts = true,
  showSilhouette = true,
  style
}) => {
  if (!silhouette || !silhouette.isPersonDetected) {
    return (
      <View style={[styles.overlay, style]}>
        <View style={styles.noPersonDetected}>
          {/* Show message when no person is detected */}
        </View>
      </View>
    );
  }

  // Generate SVG path for silhouette outline
  const generateSilhouettePath = (): string => {
    if (!silhouette.silhouettePoints.length) return '';
    
    const points = silhouette.silhouettePoints;
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    path += ' Z'; // Close the path
    return path;
  };

  // Render individual body part
  const renderBodyPart = (bodyPart: DetectedBodyPart, index: number) => {
    const { bounds, confidence, region } = bodyPart;
    
    // Color based on body part type
    const getBodyPartColor = (region: string): string => {
      switch (region) {
        case 'head': return '#ff6b6b';
        case 'torso': return '#4ecdc4';
        case 'leftArm':
        case 'rightArm': return '#45b7d1';
        case 'leftLeg':
        case 'rightLeg': return '#f9ca24';
        default: return '#ffffff';
      }
    };

    return (
      <Rect
        key={`bodypart-${region}-${index}`}
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill={getBodyPartColor(region)}
        opacity={0.3 * confidence}
        stroke={getBodyPartColor(region)}
        strokeWidth={2}
        rx={10} // Rounded corners
      />
    );
  };

  return (
    <View style={[styles.overlay, style]}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Render silhouette outline */}
        {showSilhouette && silhouette.silhouettePoints.length > 0 && (
          <Path
            d={generateSilhouettePath()}
            fill="rgba(0, 255, 0, 0.1)"
            stroke="#00ff00"
            strokeWidth={3}
            opacity={0.7}
          />
        )}
        
        {/* Render individual body parts */}
        {showBodyParts && silhouette.bodyParts.map((bodyPart, index) => 
          renderBodyPart(bodyPart, index)
        )}
        
        {/* Render center points for each body part */}
        {showBodyParts && silhouette.bodyParts.map((bodyPart, index) => (
          <Circle
            key={`center-${bodyPart.region}-${index}`}
            cx={bodyPart.center.x}
            cy={bodyPart.center.y}
            r={8}
            fill="#ffffff"
            stroke="#000000"
            strokeWidth={2}
            opacity={0.8}
          />
        ))}
      </Svg>
      
      {/* Confidence indicator */}
      <View style={styles.confidenceIndicator}>
        <View 
          style={[
            styles.confidenceBar, 
            { 
              width: `${(silhouette.bodyParts.reduce((avg, part) => avg + part.confidence, 0) / silhouette.bodyParts.length) * 100}%` 
            }
          ]} 
        />
      </View>
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
    zIndex: 3, // Above pose overlay
  },
  noPersonDetected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceIndicator: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 3,
  },
});
