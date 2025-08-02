#!/usr/bin/env python3
"""
PainAR Server Manager - Easy server control
"""

import subprocess
import sys
import time
import requests
import os

def check_server():
    """Check if server is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=3)
        return response.status_code == 200
    except:
        return False

def start_server():
    """Start the server"""
    print("🚀 Starting PainAR Medical AI Server...")
    print("   This may take a few moments...")
    
    try:
        # Start server in background
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0", 
            "--port", "8000"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        print("⏳ Waiting for server to initialize...")
        for i in range(20):
            if check_server():
                print("✅ Server is running!")
                print("🌐 Access at: http://localhost:8000")
                print("📚 API docs: http://localhost:8000/docs") 
                print("🔥 Health: http://localhost:8000/health")
                return True
            time.sleep(1)
            print(f"   Attempt {i+1}/20...")
        
        print("❌ Server failed to start within 20 seconds")
        process.terminate()
        return False
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def main():
    """Main server manager"""
    print("🏥 PainAR Medical AI - Server Manager")
    print("=" * 40)
    
    if check_server():
        print("✅ Server is already running!")
        print("🌐 Available at: http://localhost:8000")
    else:
        print("📡 Server not detected. Choose startup option:")
        print("1. 🚀 Simple test server (recommended for testing)")
        print("2. 🏥 Full PainAR server (with database)")
        
        choice = input("Enter choice (1 or 2): ").strip()
        
        if choice == "1":
            print("\n🚀 Starting simple test server...")
            print("💡 This bypasses database issues and focuses on LLM testing")
            os.system("python simple_server.py")
        else:
            print("\n🏥 Starting full PainAR server...")
            if start_server():
                print("\n🎉 Server ready for medical consultations!")
            else:
                print("\n❌ Failed to start server")
                print("💡 Try the simple server instead: python simple_server.py")
                return
    
    print("\n🚀 Ready to test your Medical AI:")
    print("   • Interactive chat: python chat_with_ai.py")
    print("   • Medical scenarios: python medical_scenarios.py")
    print("   • API docs: http://localhost:8000/docs")
    
if __name__ == "__main__":
    main()
