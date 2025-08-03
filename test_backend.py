#!/usr/bin/env python3
"""
Test script to verify PainAR backend functionality
"""

import requests
import json
import sys

def test_backend_health():
    """Test if the backend is running and responding"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_chat_endpoint():
    """Test the chat endpoint"""
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer dev-token"
        }
        
        data = {
            "message": "Hello, test message"
        }
        
        response = requests.post(
            "http://localhost:8000/chat/simple", 
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Chat endpoint test passed")
            print(f"   Response: {result.get('response', 'No response')}")
            print(f"   Thread ID: {result.get('thread_id', 'No thread ID')}")
            return True
        else:
            print(f"❌ Chat endpoint test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat endpoint test failed: {e}")
        return False

def main():
    print("🔄 Testing PainAR Backend...")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test health endpoint
    if not test_backend_health():
        all_tests_passed = False
    
    # Test chat endpoint
    if not test_chat_endpoint():
        all_tests_passed = False
    
    print("=" * 50)
    
    if all_tests_passed:
        print("🎉 All backend tests passed!")
        sys.exit(0)
    else:
        print("💥 Some backend tests failed!")
        print("Make sure the backend server is running: python -m uvicorn app.main:app --reload")
        sys.exit(1)

if __name__ == "__main__":
    main()
