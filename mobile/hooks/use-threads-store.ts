import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Thread, Message, DrawingStroke, DepthLevel } from '@/types/thread';
import { colors } from '@/constants/colors';
import { apiService, ChatRequest } from '@/services/api';

const STORAGE_KEY = 'pain-tracker-threads';

// Helper to generate proper UUIDs compatible with backend
const generateId = () => {
  // Generate a proper UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const [ThreadsProvider, useThreads] = createContextHook(() => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Load threads from storage
  const threadsQuery = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      try {
        const storedThreads = await AsyncStorage.getItem(STORAGE_KEY);
        return storedThreads ? JSON.parse(storedThreads) as Thread[] : [];
      } catch (error) {
        console.error('Failed to load threads:', error);
        return [];
      }
    }
  });

  // Save threads to storage
  const syncMutation = useMutation({
    mutationFn: async (updatedThreads: Thread[]) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedThreads));
        return updatedThreads;
      } catch (error) {
        console.error('Failed to save threads:', error);
        throw error;
      }
    }
  });

  // Update threads when data is loaded
  useEffect(() => {
    if (threadsQuery.data) {
      setThreads(threadsQuery.data);
    }
  }, [threadsQuery.data]);

  // Get current thread
  const getCurrentThread = () => {
    if (!currentThreadId) return null;
    return threads.find(thread => thread.id === currentThreadId) || null;
  };

  // Create a new thread
  const createThread = (title: string, emoji: string = '😣') => {
    const newThread: Thread = {
      id: generateId(),
      title,
      emoji,
      lastMessage: 'Session started',
      lastUpdated: Date.now(),
      messages: [],
      drawings: []
    };
    
    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    setCurrentThreadId(newThread.id);
    syncMutation.mutate(updatedThreads);
    
    return newThread.id;
  };

  // Delete a thread
  const deleteThread = (threadId: string) => {
    const updatedThreads = threads.filter(thread => thread.id !== threadId);
    setThreads(updatedThreads);
    syncMutation.mutate(updatedThreads);
    
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
    }
  };

  // Add message to current thread
  const addMessage = async (content: string, isUser: boolean) => {
    if (!currentThreadId) return;
    
    // Create and add user message immediately for responsive UI
    const userMessage: Message = {
      id: generateId(),
      content,
      isUser,
      timestamp: Date.now()
    };
    
    let updatedThreads = threads.map(thread => {
      if (thread.id === currentThreadId) {
        return {
          ...thread,
          messages: [...thread.messages, userMessage],
          lastMessage: content,
          lastUpdated: Date.now()
        };
      }
      return thread;
    });
    
    setThreads(updatedThreads);
    syncMutation.mutate(updatedThreads);

    // If this is a user message, send it to the backend and get AI response
    if (isUser) {
      try {
        console.log('🤖 Sending message to AI backend...');
        
        const chatRequest: ChatRequest = {
          message: content,
          thread_id: currentThreadId
        };
        
        const response = await apiService.sendMessage(chatRequest);
        
        // If the backend provided a different thread_id (new thread), update our local thread
        if (response.thread_id && response.thread_id !== currentThreadId) {
          console.log(`🔄 Updating thread ID from ${currentThreadId} to ${response.thread_id}`);
          setCurrentThreadId(response.thread_id);
        }
        
        // Create AI response message
        const aiMessage: Message = {
          id: generateId(),
          content: response.response,
          isUser: false,
          timestamp: Date.now()
        };
        
        // Add AI response to the thread (use the response thread_id if available)
        const finalThreadId = response.thread_id || currentThreadId;
        updatedThreads = threads.map(thread => {
          if (thread.id === currentThreadId) {
            return {
              ...thread,
              id: finalThreadId, // Update to backend thread ID if different
              messages: [...thread.messages, userMessage, aiMessage],
              lastMessage: response.response,
              lastUpdated: Date.now()
            };
          }
          return thread;
        });
        
        setThreads(updatedThreads);
        syncMutation.mutate(updatedThreads);
        
        console.log('✅ AI response received and added to thread');
        
      } catch (error) {
        console.error('❌ Failed to get AI response:', error);
        
        // Add error message to thread
        const errorMessage: Message = {
          id: generateId(),
          content: 'Sorry, I\'m having trouble connecting to the AI assistant right now. Please check your connection and try again.',
          isUser: false,
          timestamp: Date.now()
        };
        
        updatedThreads = threads.map(thread => {
          if (thread.id === currentThreadId) {
            return {
              ...thread,
              messages: [...thread.messages, userMessage, errorMessage],
              lastMessage: errorMessage.content,
              lastUpdated: Date.now()
            };
          }
          return thread;
        });
        
        setThreads(updatedThreads);
        syncMutation.mutate(updatedThreads);
      }
    }
  };

  // Add drawing stroke to current thread
  const addDrawingStroke = (points: { x: number; y: number }[], depth: DepthLevel) => {
    if (!currentThreadId) return;
    
    const depthColors = {
      skin: colors.skin,
      muscle: colors.muscle,
      deep: colors.deep
    };
    
    const newStroke: DrawingStroke = {
      id: generateId(),
      points,
      depth,
      color: depthColors[depth],
      width: 3
    };
    
    const updatedThreads = threads.map(thread => {
      if (thread.id === currentThreadId) {
        return {
          ...thread,
          drawings: [...thread.drawings, newStroke],
          lastUpdated: Date.now()
        };
      }
      return thread;
    });
    
    setThreads(updatedThreads);
    syncMutation.mutate(updatedThreads);
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log('🔌 Testing backend connection...');
      const isHealthy = await apiService.checkHealth();
      
      if (isHealthy) {
        console.log('✅ Backend connection successful!');
        return true;
      } else {
        console.log('❌ Backend health check failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  };

  return {
    threads,
    currentThreadId,
    setCurrentThreadId,
    getCurrentThread,
    createThread,
    deleteThread,
    addMessage,
    addDrawingStroke,
    testBackendConnection,
    isLoading: threadsQuery.isLoading
  };
});
