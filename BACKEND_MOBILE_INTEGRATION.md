# PainAR - Backend & Mobile Integration Guide

This guide explains how to connect the PainAR mobile app to the backend API for real-time chat functionality.

## 🔧 Backend Setup

### 1. Start the Backend Server

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Verify Backend is Running

Open your browser and navigate to:
- Health check: http://localhost:8000/health
- API documentation: http://localhost:8000/docs
- Root endpoint: http://localhost:8000/

### 3. Backend Environment Variables

Make sure your backend has these environment variables set in `.env`:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./painar.db

# Optional
DEBUG=true
DEV_TOKEN=dev-token
ALLOWED_HOSTS=localhost,127.0.0.1,*
MODEL_NAME=gpt-4o-mini
```

## 📱 Mobile App Setup

### 1. Update API Configuration

In `mobile/services/api.ts`, update the API_BASE_URL:

```typescript
// For development on the same machine
const API_BASE_URL = 'http://localhost:8000';

// For physical device testing (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:8000';

// For production
const API_BASE_URL = 'https://your-backend-domain.com';
```

### 2. Start the Mobile App

```bash
cd mobile
npm install
npm start
```

### 3. Test Backend Connection

1. Open the app
2. On the home screen, tap the WiFi icon (🔌) in the header
3. Test the connection using the "Test Connection" button
4. Send a test message to verify AI integration

## 🔄 How It Works

### Chat Flow
1. User types a message in the chat input
2. Message is sent to `POST /chat/simple` endpoint
3. Backend processes the message using RAG (Retrieval Augmented Generation)
4. AI response is returned and displayed in the chat

### Key Components

#### Backend (`backend/app/api/chat.py`)
- `SimpleChatRequest`: Request model for chat messages
- `SimpleChatResponse`: Response model with AI reply
- `simple_chat()`: Endpoint that processes messages and returns AI responses

#### Mobile (`mobile/services/api.ts`)
- `ApiService`: Handles all backend communication
- `sendMessage()`: Sends chat messages to backend
- `checkHealth()`: Verifies backend connectivity

#### Mobile (`mobile/hooks/use-threads-store.ts`)
- `addMessage()`: Enhanced to send user messages to backend and handle AI responses
- `testBackendConnection()`: Helper function to test connectivity

#### Mobile (`mobile/components/ChatInput.tsx`)
- User input component for typing messages
- Integrated into `ChatOverlay` for seamless chat experience

## 🚨 Troubleshooting

### Backend Not Connecting

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify CORS settings:**
   The backend is configured to allow all origins (`*`) for development.

3. **Check firewall/network:**
   Make sure port 8000 is accessible.

### Mobile App Issues

1. **Network errors:**
   - For physical devices, use your computer's IP address instead of `localhost`
   - Ensure both devices are on the same network

2. **CORS errors:**
   - The backend is configured to allow mobile app requests
   - Check browser console for specific CORS issues

3. **API key errors:**
   - Verify `OPENAI_API_KEY` is set in backend environment
   - Check backend logs for API-related errors

### Finding Your Computer's IP Address

**Windows:**
```cmd
ipconfig
```

**macOS/Linux:**
```bash
ifconfig
```

Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)

## 🧪 Testing the Integration

### 1. Backend Health Check
- URL: `GET http://localhost:8000/health`
- Should return: `{"status": "healthy"}`

### 2. API Info
- URL: `GET http://localhost:8000/`
- Should return backend information

### 3. Chat Test
- URL: `POST http://localhost:8000/chat/simple`
- Headers: `Authorization: Bearer dev-token`
- Body: `{"message": "Hello, test message"}`
- Should return AI response

### 4. Mobile Integration Test
1. Open mobile app
2. Tap WiFi icon → Test Connection
3. Create new session → Send message
4. Verify AI response appears

## 🔒 Authentication

The mobile app uses a simple Bearer token authentication:
- Token: `dev-token` (configurable in backend settings)
- Header: `Authorization: Bearer dev-token`

For production, implement proper authentication with:
- JWT tokens
- User registration/login
- Secure token storage

## 📚 API Endpoints

### Chat Endpoints
- `POST /chat/simple` - Send message, get AI response
- `POST /chat/` - Streaming chat (Server-Sent Events)

### Utility Endpoints
- `GET /health` - Health check
- `GET /` - API information
- `GET /metrics` - Prometheus metrics

## 🎯 Next Steps

1. **Implement proper authentication**
2. **Add message persistence** (currently stored locally)
3. **Implement message history** in backend
4. **Add file upload support** (images, audio)
5. **Implement real-time updates** with WebSockets
6. **Add user management** and multi-user support

## 💡 Tips

- Keep the backend running while testing mobile app
- Use the backend test component in mobile app for debugging
- Check browser network tab for API request details
- Monitor backend logs for error messages
- Use development mode for detailed error information
