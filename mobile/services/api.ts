/**
 * API Service for connecting to the PainAR backend
 * 
 * This service handles all communication with the FastAPI backend,
 * including chat messages, authentication, and health checks.
 */

import { Platform } from 'react-native';
import { Message } from '@/types/thread';

// Platform-specific API configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode - use platform-specific URLs
    if (Platform.OS === 'android') {
      return process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:8000';  // Android emulator
    } else if (Platform.OS === 'ios') {
      return process.env.EXPO_PUBLIC_API_URL_IOS || 'http://localhost:8000';  // iOS simulator
    } else {
      return process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:8000';  // Web
    }
  }
  // Production mode - use production URL
  return process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://your-production-api.com';
};

const API_BASE_URL = getApiBaseUrl();
const AUTH_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN || 'dev-token';

// Generate proper UUID v4 format
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface ChatRequest {
  message: string;
  thread_id?: string;
}

export interface ChatResponse {
  response: string;
  thread_id: string;
}

export interface ApiError {
  detail: string;
}

class ApiService {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string = API_BASE_URL, authToken: string = AUTH_TOKEN) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Send a chat message to the backend and get a response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Only send thread_id if it's a valid UUID format, otherwise let backend create one
      const requestPayload: any = { message: request.message };
      
      if (request.thread_id && this.isValidUUID(request.thread_id)) {
        requestPayload.thread_id = request.thread_id;
      }
      
      console.log('🚀 Sending message to backend:', requestPayload);
      console.log('📡 API Base URL:', this.baseUrl);
      console.log('🎯 Full endpoint:', `${this.baseUrl}/chat/simple`);
      
      const response = await fetch(`${this.baseUrl}/chat/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`, // Re-enable auth header
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log('❌ Response not OK, attempting to parse error...');
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData: ApiError = await response.json();
          errorMessage = `HTTP ${response.status}: ${errorData.detail || response.statusText}`;
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON');
          const errorText = await response.text();
          console.log('📄 Raw error response:', errorText);
          errorMessage = `HTTP ${response.status}: ${response.statusText} - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data: ChatResponse = await response.json();
      console.log('✅ Received response from backend:', data);
      return data;
      
    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Network or parsing error
      if (error instanceof TypeError) {
        throw new Error('Network error: Unable to connect to backend. Make sure the server is running.');
      }
      
      throw error;
    }
  }

  /**
   * Check if a string is a valid UUID format
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Check if the backend is healthy and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log('🏥 Checking backend health...');
      console.log('🎯 Health endpoint:', `${this.baseUrl}/health`);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`, // Re-enable auth
        },
      });

      console.log('🏥 Health check status:', response.status);
      
      if (response.ok) {
        const healthData = await response.text();
        console.log('✅ Backend is healthy:', healthData);
        return true;
      } else {
        console.log('❌ Backend health check failed with status:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      if (error instanceof TypeError) {
        console.error('💡 This is likely a network connectivity issue. Check if:');
        console.error('   - Backend server is running');
        console.error('   - API URL is correct:', this.baseUrl);
        console.error('   - Network connectivity is available');
      }
      
      return false;
    }
  }

  /**
   * Get basic info about the API
   */
  async getApiInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          // 'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get API info:', error);
      throw error;
    }
  }

  /**
   * Convert mobile Message format to backend-compatible format
   */
  messageToApiFormat(message: Message): string {
    return message.content;
  }

  /**
   * Convert backend response to mobile Message format
   */
  apiResponseToMessage(response: ChatResponse, isUser: boolean = false): Message {
    return {
      id: generateUUID(), // Use proper UUID instead of random string
      content: response.response,
      isUser,
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
