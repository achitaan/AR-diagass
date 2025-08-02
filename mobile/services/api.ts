/**
 * API Service for connecting to the PainAR backend
 * 
 * This service handles all communication with the FastAPI backend,
 * including chat messages, authentication, and health checks.
 */

import { Message } from '@/types/thread';

// Configuration - Update these based on your backend setup
// For Android emulator, use 10.0.2.2 instead of localhost
const API_BASE_URL = 'http://10.0.2.2:8000';  // Android emulator compatible URL

const AUTH_TOKEN = 'dev-token';  // This should match DEV_TOKEN in backend

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
      
      const response = await fetch(`${this.baseUrl}/chat/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Unknown error'}`);
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
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          // 'Authorization': `Bearer ${this.authToken}`,
        },
      });

      const isHealthy = response.ok;
      console.log(isHealthy ? '✅ Backend is healthy' : '❌ Backend health check failed');
      return isHealthy;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
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
