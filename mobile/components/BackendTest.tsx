import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { apiService } from '@/services/api';

interface BackendTestProps {
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

// Generate proper UUID v4 format
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const BackendTest = ({ onClose }: BackendTestProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testing, setTesting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatTesting, setChatTesting] = useState(false);

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      console.log('🔌 Testing backend connection...');
      console.log('🏥 Checking backend health...');

      // Test health endpoint
      const isHealthy = await apiService.checkHealth();

      if (isHealthy) {
        console.log('✅ Backend health check successful');

        // Test the chat endpoint with a simple message
        console.log('💬 Testing chat endpoint...');
        const chatResponse = await apiService.sendMessage({
          message: 'Hello, this is a connection test. Please respond briefly.',
        });

        console.log('✅ Chat endpoint test successful:', chatResponse);
        setConnectionStatus('connected');
      } else {
        console.log('❌ Backend health check failed');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      console.log('❌ Backend connection test failed');
      setConnectionStatus('disconnected');
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (!currentMessage.trim() || chatTesting) return;

    const userMessage: ChatMessage = {
      id: generateUUID(),
      content: currentMessage,
      isUser: true,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatTesting(true);

    try {
      const response = await apiService.sendMessage({
        message: currentMessage,
      });

      const aiMessage: ChatMessage = {
        id: generateUUID(),
        content: response.response,
        isUser: false,
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setCurrentMessage('');
    } catch (error) {
      console.error('❌ Chat message failed:', error);
      const errorMessage: ChatMessage = {
        id: generateUUID(),
        content: `Error: ${error}`,
        isUser: false,
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatTesting(false);
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
          {testing ? 'Testing...' : 'Test Health & Chat Endpoints'}
        </Text>
      </TouchableOpacity>

      {connectionStatus === 'connected' && (
        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>Chat Test</Text>

          <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
            {chatMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.message,
                  message.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              placeholder="Test the AI chat..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!currentMessage.trim() || chatTesting) && styles.buttonDisabled]}
              onPress={sendTestMessage}
              disabled={!currentMessage.trim() || chatTesting}
            >
              <Text style={styles.sendButtonText}>
                {chatTesting ? '...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  chatSection: {
    marginVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  chatTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chatMessages: {
    maxHeight: 200,
    marginBottom: spacing.sm,
  },
  message: {
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sendButtonText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
