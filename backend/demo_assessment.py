#!/usr/bin/env python3
"""
PainAR Assessment System Demo
Demonstrates the comprehensive injury assessment capabilities.
"""

import json
from datetime import datetime
from app.prompts import assessment_manager, injury_assessment, AssessmentPhase

def demo_assessment_flow():
    """Demonstrate a complete assessment flow."""
    print("🏥 PainAR Comprehensive Assessment System Demo")
    print("=" * 50)
    
    # Start a new assessment
    session_id = "demo_session_001"
    user_id = "demo_user"
    
    print(f"\n🆕 Starting new assessment session: {session_id}")
    assessment = assessment_manager.start_assessment(
        user_id=user_id,
        session_id=session_id,
        initial_complaint="I have severe back pain after lifting heavy boxes"
    )
    
    print(f"✅ Assessment started at: {assessment.start_time}")
    print(f"📝 Initial complaint: {assessment.extracted_data.get('initial_complaint')}")
    
    # Get first question
    print(f"\n❓ Getting first assessment question...")
    first_question = assessment_manager.get_next_question(session_id)
    print(f"Question: {first_question}")
    
    # Simulate user responses
    demo_responses = [
        {
            "question_id": "pain_chief_complaint",
            "response": "I have severe lower back pain that started yesterday when I was lifting heavy boxes at work. It's been getting worse and I can barely walk now."
        },
        {
            "question_id": "pain_location", 
            "response": "The pain is mainly in my lower back, right around my spine, but it also shoots down into my right leg sometimes."
        },
        {
            "question_id": "pain_severity",
            "response": "Right now it's about an 8 out of 10. Yesterday it was maybe a 6, but this morning when I woke up it was terrible - probably a 9."
        },
        {
            "question_id": "pain_quality",
            "response": "It's mostly a sharp, stabbing pain, but there's also this deep aching that won't go away. When it shoots down my leg it feels more like burning."
        },
        {
            "question_id": "injury_mechanism",
            "response": "I was lifting these really heavy boxes - probably 50-60 pounds each. I bent over to pick one up and felt something pop in my back immediately. I heard a sound too, like a crack."
        }
    ]
    
    print(f"\n🔄 Processing user responses...")
    for i, response_data in enumerate(demo_responses, 1):
        print(f"\n--- Response {i} ---")
        print(f"User: {response_data['response']}")
        
        # Process the response
        result = assessment_manager.process_response(
            session_id=session_id,
            question_id=response_data["question_id"],
            user_response=response_data["response"]
        )
        
        print(f"✅ Response processed. Completion: {result['completion_percentage']:.1f}%")
        print(f"🚨 Priority Score: {result['priority_score']}")
        
        if result.get('extracted_data'):
            print(f"📊 Extracted Data: {result['extracted_data']}")
        
        if result.get('follow_up'):
            print(f"🔍 Follow-up: {result['follow_up']}")
        
        # Get next question
        next_question = assessment_manager.get_next_question(session_id)
        if next_question:
            print(f"❓ Next Question: {next_question}")
    
    # Get comprehensive summary
    print(f"\n📋 COMPREHENSIVE ASSESSMENT SUMMARY")
    print("=" * 50)
    
    summary = assessment_manager.get_assessment_summary(session_id)
    if summary:
        print(f"\n🎯 Key Findings:")
        for finding in summary['key_findings']:
            print(f"  • {finding}")
        
        print(f"\n🏥 Clinical Data:")
        clinical_data = summary['clinical_data']
        print(f"  Pain Severity: {clinical_data['pain_assessment']['severity']}/10")
        print(f"  Affected Areas: {', '.join(clinical_data['pain_assessment']['location'])}")
        print(f"  Pain Quality: {', '.join(clinical_data['pain_assessment']['quality'])}")
        print(f"  Injury Mechanism: {', '.join(clinical_data['injury_details']['mechanism'])}")
        
        print(f"\n⚠️ Red Flags:")
        for flag in summary['red_flags']:
            print(f"  🚨 {flag}")
        
        print(f"\n💊 Recommendations:")
        for rec in summary['recommendations']:
            print(f"  • {rec}")
        
        print(f"\n📊 Session Statistics:")
        session_info = summary['session_info']
        print(f"  Duration: {session_info['duration_minutes']:.1f} minutes")
        print(f"  Completion: {session_info['completion_percentage']:.1f}%")
        print(f"  Priority Score: {session_info['priority_score']}")
    
    print(f"\n🎯 SYSTEM PROMPT PREVIEW")
    print("=" * 50)
    print(injury_assessment.system_prompt[:500] + "...")
    
    return summary

def demo_question_categories():
    """Demonstrate different question categories."""
    print(f"\n📚 ASSESSMENT QUESTION CATEGORIES")
    print("=" * 50)
    
    for phase in AssessmentPhase:
        questions = injury_assessment.get_phase_questions(phase)
        print(f"\n🏷️ {phase.value.upper().replace('_', ' ')} ({len(questions)} questions)")
        
        for q in questions[:2]:  # Show first 2 questions from each phase
            print(f"  ❓ {q.question}")
            print(f"     Priority: {q.priority}/5")
            print(f"     Data Points: {', '.join(q.data_points[:3])}...")
            if q.follow_ups:
                print(f"     Sample Follow-up: {q.follow_ups[0]}")
            print()

if __name__ == "__main__":
    try:
        # Demo the full assessment flow
        summary = demo_assessment_flow()
        
        # Demo question categories
        demo_question_categories()
        
        print(f"\n✅ Demo completed successfully!")
        print(f"🎯 The assessment system provides structured injury evaluation")
        print(f"📊 with comprehensive data extraction and medical-grade organization.")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
