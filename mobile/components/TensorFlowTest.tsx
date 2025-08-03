import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { initializeTensorFlow } from '@/utils/tensorflow';
import * as tf from '@tensorflow/tfjs';

export function TensorFlowTest() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [backend, setBackend] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkTensorFlowStatus();
  }, []);

  const checkTensorFlowStatus = async () => {
    try {
      const initialized = await initializeTensorFlow();
      setIsInitialized(initialized);
      if (initialized) {
        setBackend(tf.getBackend());
      }
    } catch (error) {
      console.error('TensorFlow check failed:', error);
      setIsInitialized(false);
    }
  };

  const runSimpleTest = async () => {
    setIsLoading(true);
    try {
      // Simple tensor operation test
      const a = tf.tensor2d([[1, 2], [3, 4]]);
      const b = tf.tensor2d([[5, 6], [7, 8]]);
      const result = tf.matMul(a, b);
      
      const resultData = await result.data();
      console.log('TensorFlow test result:', resultData);
      
      // Cleanup
      a.dispose();
      b.dispose();
      result.dispose();
      
      Alert.alert('Success', 'TensorFlow.js is working correctly!');
    } catch (error) {
      console.error('TensorFlow test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `TensorFlow test failed: ${errorMessage}`);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TensorFlow.js Status</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Initialized:</Text>
        <Text style={[styles.statusValue, { color: isInitialized ? 'green' : 'red' }]}>
          {isInitialized ? 'Yes' : 'No'}
        </Text>
      </View>
      
      {isInitialized && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Backend:</Text>
          <Text style={styles.statusValue}>{backend}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.button, { opacity: isInitialized && !isLoading ? 1 : 0.5 }]}
        onPress={runSimpleTest}
        disabled={!isInitialized || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running Test...' : 'Test TensorFlow'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={checkTensorFlowStatus}
      >
        <Text style={styles.buttonText}>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
