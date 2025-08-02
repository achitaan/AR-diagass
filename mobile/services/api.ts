/**
 * API Service for connecting to the PainAR backend
 * 
 * This service handles all communication with the FastAPI backend,
 * including chat messages, authentication, and health checks.
 */

import { Message } from '@/types/thread';

// Configuration - Update these based on your backend setup
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000'  // Development - backend running locally
  : 'http://your-backend-url.com';  // Production URL

const AUTH_TOKEN = 'dev-token';  // This should match DEV_TOKEN in backend

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
      console.log('🚀 Sending message to backend:', { message: request.message, thread_id: request.thread_id });
      
      const response = await fetch(`${this.baseUrl}/chat/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(request),
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
   * Check if the backend is healthy and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log('🏥 Checking backend health...');
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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
          'Authorization': `Bearer ${this.authToken}`,
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
      id: Math.random().toString(36).substring(2, 15), // Generate random ID
      content: response.response,
      isUser,
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
