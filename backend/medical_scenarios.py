#!/usr/bin/env python3
"""
PainAR Medical AI - Realistic Scenario Tester

This simulates real patient scenarios to test your AI like a real medical consultation.
"""

import requests
import time
import json
from datetime import datetime

class MedicalScenarioTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        
    def send_message(self, message, thread_id):
        """Send message to AI"""
        url = f"{self.base_url}/chat/simple"
        data = {"message": message, "thread_id": thread_id}
        
        response = requests.post(url, json=data, timeout=30)
        if response.status_code == 200:
            return response.json()['response']
        return f"Error: {response.status_code}"
    
    def simulate_patient_conversation(self, scenario_name, messages, thread_id):
        """Simulate a realistic patient conversation"""
        print(f"\n{'='*60}")
        print(f"🏥 MEDICAL SCENARIO: {scenario_name}")
        print(f"{'='*60}")
        print(f"📋 Patient ID: {thread_id}")
        print(f"🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print()
        
        for i, message in enumerate(messages, 1):
            print(f"👤 Patient: {message}")
            print("🤖 AI is analyzing", end="")
            
            # Realistic thinking time
            for _ in range(3):
                time.sleep(0.8)
                print(".", end="", flush=True)
            print()
            
            response = self.send_message(message, thread_id)
            
            print(f"🩺 PainAR AI:")
            print("-" * 40)
            print(response)
            print("-" * 40)
            print()
            
            if i < len(messages):
                time.sleep(2)  # Pause between messages
    
    def run_scenarios(self):
        """Run realistic medical scenarios"""
        scenarios = [
            {
                "name": "Chronic Lower Back Pain Consultation",
                "thread_id": "patient_001_back_pain",
                "messages": [
                    "Hello doctor, I've been having lower back pain for about 3 months now. It started after I moved some heavy furniture. The pain is constant and gets worse when I sit for long periods.",
                    "The pain is about a 6 out of 10 most days, but can reach 8 when I first wake up in the morning. I've been taking ibuprofen but it only helps a little.",
                    "I work at a desk job, so I sit a lot. I'm wondering if there are exercises or other treatments that might help? I've heard about something called AR therapy?"
                ]
            },
            {
                "name": "Chronic Migraine Management",
                "thread_id": "patient_002_migraines", 
                "messages": [
                    "I get severe headaches about 15 days per month. They're debilitating - I can't work or do normal activities when they hit.",
                    "The headaches come with nausea and sensitivity to light. I've tried several medications but nothing seems to work well long-term.",
                    "I'm interested in non-medication approaches. Can AR technology help with migraine management? What about lifestyle changes?"
                ]
            },
            {
                "name": "Fibromyalgia Patient Seeking Guidance",
                "thread_id": "patient_003_fibromyalgia",
                "messages": [
                    "I was recently diagnosed with fibromyalgia after months of widespread pain and fatigue. I'm feeling overwhelmed and don't know where to start with treatment.",
                    "My doctor mentioned that education about the condition is important. Can you explain fibromyalgia in simple terms?",
                    "What are some practical strategies for managing daily life with fibromyalgia? I'm particularly interested in how technology might help."
                ]
            },
            {
                "name": "Post-Surgery Recovery Consultation",
                "thread_id": "patient_004_post_surgery",
                "messages": [
                    "I had knee surgery 6 weeks ago and I'm still experiencing significant pain. My surgeon says this is normal, but I'm concerned about becoming dependent on pain medication.",
                    "What are some non-medication pain management techniques I can try? I want to reduce my reliance on opioids.",
                    "I've heard about virtual reality and AR for pain management. How does that work, and could it help with my recovery?"
                ]
            }
        ]
        
        print("🏥 PainAR Medical AI - Realistic Scenario Testing")
        print("=" * 60)
        print("This will simulate real patient consultations to test your AI.")
        print("Each scenario represents a typical pain management consultation.")
        print()
        
        # Check server
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code != 200:
                print("❌ Server not responding properly")
                return
        except:
            print("❌ Cannot connect to server. Please start it first:")
            print("   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
            return
        
        print("✅ Connected to PainAR Medical AI")
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n🔄 Running Scenario {i}/{len(scenarios)}")
            self.simulate_patient_conversation(
                scenario["name"],
                scenario["messages"], 
                scenario["thread_id"]
            )
            
            if i < len(scenarios):
                print("⏳ Preparing next scenario...")
                time.sleep(3)
        
        print(f"\n{'='*60}")
        print("🎉 All scenarios completed!")
        print("💡 Your PainAR Medical AI has been tested with realistic patient cases.")
        print("🏥 The AI demonstrated its ability to handle various pain conditions.")
        print("📊 Review the responses above to see how your AI performs in real scenarios.")
        print(f"{'='*60}")

def main():
    tester = MedicalScenarioTester()
    tester.run_scenarios()

if __name__ == "__main__":
    main()
