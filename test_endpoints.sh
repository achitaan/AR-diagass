#!/bin/bash

# Backend and Frontend Test Script
# This script tests the AI endpoints and ensures everything is working

echo "🔌 Testing PainAR Backend AI Endpoints"
echo "======================================"

# Check if backend is running
echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint is working"
else
    echo "❌ Health endpoint failed (HTTP $HEALTH_RESPONSE)"
    echo "💡 Make sure the backend is running: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

# Test Chat Endpoint
echo -e "\n2. Testing Chat Endpoint..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat/simple \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello, can you help me with pain management?"}')

if echo "$CHAT_RESPONSE" | grep -q "response"; then
    echo "✅ Chat endpoint is working"
    echo "📝 Sample response: $(echo "$CHAT_RESPONSE" | jq -r '.response' | head -c 100)..."
else
    echo "❌ Chat endpoint failed"
    echo "📝 Response: $CHAT_RESPONSE"
fi

echo -e "\n🎉 Backend test complete!"
echo "📱 Now test the mobile app with these endpoints."
