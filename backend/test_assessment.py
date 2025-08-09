"""
Simple test script for PainAR Assessment System
"""

try:
    print("🧪 Testing PainAR Assessment System...")
    
    # Test 1: Import system components
    print("📦 Testing imports...")
    from app.prompts import assessment_manager, injury_assessment
    print("✅ Successfully imported assessment system")
    
    # Test 2: Check question count
    total_questions = sum(len(qs) for qs in injury_assessment.questions.values())
    print(f"📊 Total assessment questions: {total_questions}")
    
    # Test 3: Check system prompt
    prompt_length = len(injury_assessment.system_prompt)
    print(f"📝 System prompt length: {prompt_length} characters")
    
    # Test 4: Start a test assessment
    print("\n🎯 Testing assessment flow...")
    assessment = assessment_manager.start_assessment(
        user_id="test_user",
        session_id="test_session", 
        initial_complaint="Test complaint"
    )
    print(f"✅ Assessment started: {assessment.session_id}")
    
    # Test 5: Get first question
    first_question = assessment_manager.get_next_question("test_session")
    print(f"❓ First question: {first_question[:100]}...")
    
    # Test 6: Process a response
    result = assessment_manager.process_response(
        "test_session",
        "pain_chief_complaint", 
        "I have severe back pain from lifting"
    )
    print(f"📈 Response processed, completion: {result['completion_percentage']:.1f}%")
    
    print("\n🎉 All tests passed! Assessment system is working correctly.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure you're in the backend directory and have the required dependencies")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
