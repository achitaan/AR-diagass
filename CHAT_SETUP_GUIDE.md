# AI Chat Feature Setup and Testing Guide

## Overview
The PainAR app now has a complete AI chat feature that connects the React Native frontend to a FastAPI backend with OpenAI integration.

## What's Been Implemented

### Backend (FastAPI)
- ✅ **Health endpoint**: `/health` - Basic server health check
- ✅ **Simple chat endpoint**: `/chat/simple` - Direct JSON chat with AI
- ✅ **Streaming chat endpoint**: `/chat/` - Server-sent events for real-time chat
- ✅ **Database integration**: PostgreSQL with pgvector for embeddings
- ✅ **AI integration**: OpenAI GPT-4o-mini with RAG (Retrieval Augmented Generation)
- ✅ **CORS enabled**: Allows mobile app connections

### Frontend (React Native/Expo)
- ✅ **API Service**: Handles backend communication with proper Android emulator URLs
- ✅ **Backend Test Component**: Tests both health and chat endpoints
- ✅ **Chat Components**: ChatInput and ChatOverlay for messaging
- ✅ **Thread Management**: useThreads hook for conversation persistence
- ✅ **Mobile-friendly URLs**: Uses `10.0.2.2:8000` for Android emulator

## Testing Instructions

### 1. Start the Backend
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Mobile App
```bash
cd mobile
npx expo start --clear
```

### 3. Test the Connection
1. Open the app in Android emulator
2. The BackendTest component will automatically test both endpoints
3. Check the console logs for connection status
4. Use the chat interface in the test component

### 4. Test Full Chat Feature
1. Navigate to the main chat screen
2. Send a message about pain management
3. The AI should respond with medical advice
4. Messages are persisted in local storage

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/your_database_name
DEBUG=true
```

### Mobile (.env)
```
NODE_ENV='development'
API_BASE_URL=http://10.0.2.2:8000
AUTH_TOKEN=dev-token
```

## Troubleshooting

### Backend Issues
- **Database connection**: Ensure PostgreSQL is running and pgvector extension is installed
- **OpenAI API**: Check your API key is valid and has credits
- **Port conflicts**: Make sure port 8000 is available

### Mobile Issues
- **Network connection**: Use `10.0.2.2:8000` for Android emulator, `localhost:8000` for iOS simulator
- **CORS errors**: Backend allows all origins (`*`) so this shouldn't be an issue
- **Cache issues**: Clear Metro cache with `npx expo start --clear`

### Common Fixes
1. **"Network request failed"**: Check if backend is running and use correct URL
2. **"Extension vector not available"**: Install pgvector extension for PostgreSQL
3. **"OpenAI API key required"**: Set OPENAI_API_KEY in backend/.env
4. **Chat not working**: Check BackendTest component for specific error messages

## API Endpoints

### GET /health
Returns server health status
```json
{"status": "healthy", "message": "PainAR Backend is running"}
```

### POST /chat/simple
Send a chat message and get AI response
```json
// Request
{
  "message": "I have shoulder pain",
  "thread_id": "optional-uuid"
}

// Response
{
  "response": "I understand you're experiencing shoulder pain...",
  "thread_id": "uuid-of-conversation"
}
```

## Next Steps
1. Test the chat feature end-to-end
2. Verify message persistence works
3. Test on both Android emulator and physical device
4. Add error handling for network failures
5. Implement typing indicators and message status
