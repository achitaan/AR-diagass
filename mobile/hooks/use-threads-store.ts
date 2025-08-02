import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Thread, Message, DrawingStroke, DepthLevel } from '@/types/thread';
import { colors } from '@/constants/colors';

const STORAGE_KEY = 'pain-tracker-threads';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

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
  const addMessage = (content: string, isUser: boolean) => {
    if (!currentThreadId) return;
    
    const newMessage: Message = {
      id: generateId(),
      content,
      isUser,
      timestamp: Date.now()
    };
    
    const updatedThreads = threads.map(thread => {
      if (thread.id === currentThreadId) {
        return {
          ...thread,
          messages: [...thread.messages, newMessage],
          lastMessage: content,
          lastUpdated: Date.now()
        };
      }
      return thread;
    });
    
    setThreads(updatedThreads);
    syncMutation.mutate(updatedThreads);
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

  return {
    threads,
    currentThreadId,
    setCurrentThreadId,
    getCurrentThread,
    createThread,
    deleteThread,
    addMessage,
    addDrawingStroke,
    isLoading: threadsQuery.isLoading
  };
});
