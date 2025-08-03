import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HumanDetectionInstructionsProps {
  isPersonDetected: boolean;
  isTracking: boolean;
  style?: any;
}

export const HumanDetectionInstructions: React.FC<HumanDetectionInstructionsProps> = ({
  isPersonDetected,
  isTracking,
  style
}) => {
  const getInstructionText = () => {
    if (!isTracking) {
      return "👤 Human Detection Ready\nPress 'R' to start tracking";
    }
    
    if (!isPersonDetected) {
      return "🔍 Looking for person...\n• Stand in front of camera\n• Ensure good lighting\n• Face the camera";
    }
    
    return "✅ Person detected!\n• Move to see muscles track you\n• Raise arms, walk, lean";
  };

  const getStatusColor = () => {
    if (!isTracking) return '#ffffff';
    if (!isPersonDetected) return '#ffaa00';
    return '#00ff00';
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.instructionText, { color: getStatusColor() }]}>
        {getInstructionText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
