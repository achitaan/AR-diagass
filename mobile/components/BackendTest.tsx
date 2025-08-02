import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiService } from '@/services/api';
import { useThreads } from '@/hooks/use-threads-store';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, spacing } from '@/constants/theme';

interface BackendTestProps {
  onClose?: () => void;
}

export const BackendTest = ({ onClose }: BackendTestProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testing, setTesting] = useState(false);
  const { testBackendConnection } = useThreads();

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const isConnected = await testBackendConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        // Test API info endpoint
        const apiInfo = await apiService.getApiInfo();
        console.log('API Info:', apiInfo);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (connectionStatus !== 'connected') {
      Alert.alert('Error', 'Backend is not connected. Please check your server.');
      return;
    }

    try {
      setTesting(true);
      const response = await apiService.sendMessage({
        message: 'Hello, this is a test message from the mobile app!',
      });
      
      Alert.alert(
        'Test Message Sent!', 
        `AI Response: ${response.response.substring(0, 100)}...`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to send test message: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return colors.success;
      case 'disconnected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Backend Connected ✅';
      case 'disconnected': return 'Backend Disconnected ❌';
      default: return 'Testing Connection...';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>
      
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, (testing || connectionStatus !== 'connected') && styles.buttonDisabled]}
        onPress={sendTestMessage}
        disabled={testing || connectionStatus !== 'connected'}
      >
        <Text style={styles.buttonText}>Send Test Message</Text>
      </TouchableOpacity>

      {onClose && (
        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={onClose}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
