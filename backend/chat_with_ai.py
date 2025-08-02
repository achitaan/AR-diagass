#!/usr/bin/env python3
"""
PainAR Medical AI - Interactive Chat Client

This provides a realistic chat experience with your medical AI system.
Talk to your AI like a real consultation.
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

class PainARChat:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.thread_id = str(uuid.uuid4())
        self.session_started = datetime.now()
        
    def check_connection(self):
        """Check if the server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def send_message(self, message):
        """Send a message to the AI and get response"""
        url = f"{self.base_url}/chat/simple"
        
        data = {
            "message": message,
            "thread_id": self.thread_id
        }
        
        try:
            # Show typing indicator
            print("🤖 PainAR AI is thinking", end="")
            for i in range(3):
                time.sleep(0.5)
                print(".", end="", flush=True)
            print()
            
            response = requests.post(
                url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['response']
            elif response.status_code == 404:
                # Try alternative endpoints
                alternative_urls = [
                    f"{self.base_url}/chat/",
                    f"{self.base_url}/api/chat/simple",
                    f"{self.base_url}/simple"
                ]
                
                for alt_url in alternative_urls:
                    try:
                        alt_response = requests.post(alt_url, json=data, timeout=30)
                        if alt_response.status_code == 200:
                            result = alt_response.json()
                            return result.get('response', str(result))
                    except:
                        continue
                
                return """❌ Chat endpoint not found. The server might not be running correctly.

🔧 To fix this:
1. Stop the current server (Ctrl+C)
2. Start the simple test server: python simple_server.py
3. Or restart main server: python -m uvicorn app.main:app --port 8000

💡 Available endpoints should be:
   • /health - Server health check
   • /chat/simple - Simple chat
   • /docs - API documentation"""
            else:
                return f"Sorry, I'm having technical difficulties. (Error: {response.status_code})\nResponse: {response.text}"
                
        except requests.exceptions.Timeout:
            return "I'm taking a bit longer to process your request. Please try again."
        except requests.exceptions.ConnectionError:
            return """❌ Cannot connect to the server. 

🔧 Please start the server first:
   python simple_server.py
   
Or the main server:
   python -m uvicorn app.main:app --port 8000"""
        except Exception as e:
            return f"I'm experiencing connection issues: {str(e)}"
    
    def display_welcome(self):
        """Display welcome message"""
        print("=" * 70)
        print("🏥 Welcome to PainAR Medical AI Assistant")
        print("=" * 70)
        print("🤖 I'm your AI healthcare assistant specializing in pain management")
        print("   and augmented reality therapy guidance.")
        print()
        print("💡 I can help you with:")
        print("   • Pain assessment and understanding")
        print("   • Treatment options and recommendations")
        print("   • AR-guided therapy exercises")
        print("   • Patient education about pain conditions")
        print("   • Self-management strategies")
        print()
        print("⚠️  IMPORTANT: I provide educational information only.")
        print("   Always consult healthcare professionals for diagnosis and treatment.")
        print()
        print("💬 Start by telling me about your pain or asking any questions.")
        print("   Type 'quit', 'exit', or 'bye' to end our conversation.")
        print("=" * 70)
        print()
    
    def format_ai_response(self, response):
        """Format AI response nicely"""
        # Add professional medical AI formatting
        lines = response.split('\n')
        formatted_lines = []
        
        for line in lines:
            if line.strip():
                # Add bullet points for lists
                if line.strip().startswith('-') or line.strip().startswith('•'):
                    formatted_lines.append(f"   {line.strip()}")
                else:
                    formatted_lines.append(line)
            else:
                formatted_lines.append("")
        
        return '\n'.join(formatted_lines)
    
    def run_chat(self):
        """Run the interactive chat session"""
        # Check server connection
        if not self.check_connection():
            print("❌ Cannot connect to PainAR Medical AI server.")
            print("💡 Please start the server first:")
            print("   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
            return
        
        self.display_welcome()
        
        conversation_count = 0
        
        try:
            while True:
                # Get user input
                user_input = input("🧑‍⚕️ You: ").strip()
                
                # Check for exit commands
                if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
                    duration = datetime.now() - self.session_started
                    minutes = int(duration.total_seconds() / 60)
                    print(f"\n👋 Thank you for using PainAR Medical AI!")
                    print(f"📊 Session summary:")
                    print(f"   • Duration: {minutes} minutes")
                    print(f"   • Messages exchanged: {conversation_count * 2}")
                    print(f"   • Session ID: {self.thread_id[:8]}...")
                    print(f"\n🏥 Remember to follow up with your healthcare provider!")
                    break
                
                if not user_input:
                    print("💭 Please tell me what's on your mind about your pain or health.")
                    continue
                
                conversation_count += 1
                
                # Get AI response
                ai_response = self.send_message(user_input)
                
                # Display response
                print(f"\n🤖 PainAR AI:")
                print("-" * 50)
                print(self.format_ai_response(ai_response))
                print("-" * 50)
                print()
                
        except KeyboardInterrupt:
            print(f"\n\n👋 Session ended. Take care!")
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")

def main():
    """Main function to start the chat"""
    chat = PainARChat()
    chat.run_chat()

if __name__ == "__main__":
    main()
