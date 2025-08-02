#!/usr/bin/env python3
"""
PainAR Medical AI - Direct Chat (No Server Required)

This bypasses server issues and connects directly to OpenAI.
Perfect for testing your medical AI without server complexity.
"""

import os
import time
from datetime import datetime

class DirectMedicalAI:
    def __init__(self):
        self.conversation_history = []
        self.session_started = datetime.now()
        
        # Medical AI system prompt
        self.system_prompt = """You are PainAR Medical AI, a specialized healthcare assistant focused on pain management and augmented reality therapy. 

You provide:
- Evidence-based pain assessment guidance
- Treatment recommendations and options
- AR therapy explanations and benefits
- Patient education about pain conditions
- Self-management strategies

Always include appropriate medical disclaimers and recommend consulting healthcare professionals for diagnosis and treatment.

Respond in a professional, empathetic, and helpful manner."""

    def get_openai_client(self):
        """Get OpenAI client with proper API key"""
        try:
            from openai import OpenAI
            
            # Try to get API key from environment
            api_key = os.getenv("OPENAI_API_KEY")
            
            # If not in environment, try app settings
            if not api_key:
                try:
                    from app.settings import settings
                    api_key = settings.openai_api_key
                except Exception as e:
                    print(f"⚠️  Cannot load app settings: {e}")
                    return None
            
            if not api_key:
                print("❌ No OpenAI API key found!")
                print("   Set OPENAI_API_KEY environment variable")
                print("   or configure in app/settings.py")
                return None
            
            return OpenAI(api_key=api_key)
            
        except ImportError:
            print("❌ OpenAI library not installed!")
            print("   Install with: pip install openai")
            return None
        except Exception as e:
            print(f"❌ Error setting up OpenAI client: {e}")
            return None

    def send_message(self, message):
        """Send message directly to OpenAI"""
        client = self.get_openai_client()
        if not client:
            return "❌ Cannot connect to OpenAI. Please check your API key configuration."
        
        try:
            print("🤖 PainAR AI is analyzing", end="")
            for i in range(3):
                time.sleep(0.5)
                print(".", end="", flush=True)
            print()
            
            # Build messages with conversation history
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history
            for msg in self.conversation_history[-10:]:  # Keep last 10 exchanges
                messages.append(msg)
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Save to conversation history
            self.conversation_history.append({"role": "user", "content": message})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            return f"❌ Error processing your message: {str(e)}"

    def start_chat(self):
        """Start interactive chat session"""
        print("🏥 PainAR Medical AI - Direct Chat")
        print("=" * 50)
        print("💡 This connects directly to OpenAI (no server required)")
        print("📝 Type 'quit', 'exit', or 'bye' to end the session")
        print("🚨 Remember: This is for informational purposes only")
        print("   Always consult healthcare professionals for medical advice")
        print("-" * 50)
        
        # Test connection first
        print("🔍 Testing connection...")
        test_response = self.send_message("Hello")
        if "❌" in test_response:
            print(test_response)
            return
        
        print("✅ Connection successful! Ready to help with your medical questions.")
        print("\n💬 You can now ask about pain, symptoms, or health concerns.")
        print("📋 Example: 'I have arm pain, what could be the issue?'")
        print("-" * 50)
        
        while True:
            try:
                # Get user input
                user_input = input("\n🫵 You: ").strip()
                
                # Check for exit commands
                if user_input.lower() in ['quit', 'exit', 'bye', 'q']:
                    print("\n👋 Thank you for using PainAR Medical AI!")
                    print("🔒 Remember to follow up with healthcare professionals")
                    print("💙 Take care of yourself!")
                    break
                
                # Skip empty messages
                if not user_input:
                    continue
                
                # Get AI response
                response = self.send_message(user_input)
                
                # Display response with proper formatting
                print(f"\n🤖 PainAR AI:")
                print("-" * 30)
                print(response)
                print("-" * 30)
                
            except KeyboardInterrupt:
                print("\n\n👋 Session ended. Stay healthy!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {e}")
                print("💡 Try restarting the chat")

def main():
    """Main function to start the direct chat"""
    chat = DirectMedicalAI()
    chat.start_chat()

if __name__ == "__main__":
    main()
