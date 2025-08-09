"""
Comprehensive Injury Assessment Prompts for PainAR
This module contains structured prompts for gathering detailed injury information
that can be stored, analyzed, and condensed for medical assessment.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class AssessmentPhase(Enum):
    INITIAL_SCREENING = "initial_screening"
    PAIN_CHARACTERISTICS = "pain_characteristics"
    FUNCTIONAL_IMPACT = "functional_impact"
    MEDICAL_HISTORY = "medical_history"
    LIFESTYLE_FACTORS = "lifestyle_factors"
    FOLLOW_UP = "follow_up"

@dataclass
class AssessmentQuestion:
    id: str
    phase: AssessmentPhase
    question: str
    follow_ups: List[str]
    data_points: List[str]  # What specific data this question captures
    priority: int  # 1-5, with 1 being most critical

class InjuryAssessmentPrompts:
    """
    Comprehensive injury assessment system that guides users through
    a structured interview process to gather detailed information.
    """
    
    def __init__(self):
        self.questions = self._initialize_questions()
        self.system_prompt = self._get_system_prompt()
    
    def _get_system_prompt(self) -> str:
        return """
You are PainAR, an advanced AI medical assistant specializing in pain assessment and injury evaluation. 
Your role is to conduct a comprehensive but empathetic interview to understand the user's condition thoroughly.

CORE OBJECTIVES:
1. Gather detailed, medically relevant information about the user's pain/injury
2. Ask follow-up questions to clarify and deepen understanding
3. Maintain a professional yet compassionate tone
4. Structure information for easy medical review
5. Identify red flags that may require immediate medical attention

ASSESSMENT METHODOLOGY:
- Start with broad, open-ended questions
- Progress to specific, targeted inquiries
- Use medical terminology when appropriate, but explain complex terms
- Validate the user's experience and concerns
- Gather both objective and subjective data

CRITICAL DATA POINTS TO CAPTURE:
- Pain location, intensity, quality, timing
- Onset circumstances and mechanism of injury
- Aggravating and alleviating factors
- Functional limitations and impact on daily activities
- Previous treatments and their effectiveness
- Medical history and current medications
- Psychosocial factors affecting pain experience

COMMUNICATION STYLE:
- Empathetic and non-judgmental
- Clear and easy to understand
- Thorough but not overwhelming
- Encouraging participation and detailed responses

RED FLAGS TO WATCH FOR:
- Severe, sudden-onset pain
- Neurological symptoms (numbness, weakness, tingling)
- Signs of infection or systemic illness
- Trauma history suggesting serious injury
- Pain not responding to appropriate treatment

Always remember: You are gathering information to assist healthcare providers, 
not providing medical diagnosis or treatment recommendations.
"""

    def _initialize_questions(self) -> Dict[str, List[AssessmentQuestion]]:
        return {
            "initial_screening": [
                AssessmentQuestion(
                    id="pain_chief_complaint",
                    phase=AssessmentPhase.INITIAL_SCREENING,
                    question="Can you tell me about your main concern today? What's bothering you the most?",
                    follow_ups=[
                        "When did this problem first start?",
                        "Has it been getting better, worse, or staying the same?",
                        "What do you think might have caused this?"
                    ],
                    data_points=["chief_complaint", "onset_timeline", "progression", "suspected_cause"],
                    priority=1
                ),
                
                AssessmentQuestion(
                    id="pain_location",
                    phase=AssessmentPhase.INITIAL_SCREENING,
                    question="Can you show me or describe exactly where you're experiencing pain or discomfort?",
                    follow_ups=[
                        "Does the pain stay in one place or does it move around?",
                        "Does it spread to any other areas of your body?",
                        "Is it deeper inside or more on the surface?"
                    ],
                    data_points=["primary_location", "radiation_pattern", "pain_depth", "affected_areas"],
                    priority=1
                ),
                
                AssessmentQuestion(
                    id="pain_severity",
                    phase=AssessmentPhase.INITIAL_SCREENING,
                    question="On a scale of 0 to 10, where 0 is no pain and 10 is the worst pain imaginable, how would you rate your pain right now?",
                    follow_ups=[
                        "What's the worst it's been in the past week?",
                        "What's the best it's been?",
                        "How would you rate your average pain level?"
                    ],
                    data_points=["current_pain_level", "worst_pain_level", "best_pain_level", "average_pain_level"],
                    priority=1
                )
            ],
            
            "pain_characteristics": [
                AssessmentQuestion(
                    id="pain_quality",
                    phase=AssessmentPhase.PAIN_CHARACTERISTICS,
                    question="How would you describe the pain? For example: sharp, dull, burning, aching, throbbing, stabbing, cramping, or something else?",
                    follow_ups=[
                        "Does the type of pain change throughout the day?",
                        "Are there different types of pain in different areas?",
                        "Does it feel like any pain you've had before?"
                    ],
                    data_points=["pain_descriptors", "pain_variability", "pain_patterns", "pain_familiarity"],
                    priority=2
                ),
                
                AssessmentQuestion(
                    id="pain_timing",
                    phase=AssessmentPhase.PAIN_CHARACTERISTICS,
                    question="When do you notice the pain most? Is it constant or does it come and go?",
                    follow_ups=[
                        "What time of day is it typically worst?",
                        "How long do pain episodes last?",
                        "Do you wake up with pain or does it develop during the day?"
                    ],
                    data_points=["pain_frequency", "circadian_pattern", "episode_duration", "onset_timing"],
                    priority=2
                ),
                
                AssessmentQuestion(
                    id="triggers_relievers",
                    phase=AssessmentPhase.PAIN_CHARACTERISTICS,
                    question="What makes your pain better? What makes it worse?",
                    follow_ups=[
                        "Does movement help or hurt?",
                        "How about rest, heat, cold, or specific positions?",
                        "Have you tried any medications or treatments?"
                    ],
                    data_points=["aggravating_factors", "relieving_factors", "positional_effects", "treatment_responses"],
                    priority=2
                )
            ],
            
            "functional_impact": [
                AssessmentQuestion(
                    id="daily_activities",
                    phase=AssessmentPhase.FUNCTIONAL_IMPACT,
                    question="How is this pain affecting your daily activities? What can't you do now that you could do before?",
                    follow_ups=[
                        "How about work or school activities?",
                        "What about household tasks?",
                        "Any changes in your sleep?"
                    ],
                    data_points=["functional_limitations", "work_impact", "home_activities", "sleep_disturbance"],
                    priority=2
                ),
                
                AssessmentQuestion(
                    id="mobility_assessment",
                    phase=AssessmentPhase.FUNCTIONAL_IMPACT,
                    question="Tell me about your mobility. Any difficulty walking, climbing stairs, or moving around?",
                    follow_ups=[
                        "Do you use any assistive devices?",
                        "How far can you walk comfortably?",
                        "Any balance or coordination issues?"
                    ],
                    data_points=["mobility_status", "walking_tolerance", "assistive_devices", "balance_issues"],
                    priority=2
                ),
                
                AssessmentQuestion(
                    id="psychological_impact",
                    phase=AssessmentPhase.FUNCTIONAL_IMPACT,
                    question="How is this condition affecting you emotionally? Are you feeling frustrated, worried, or down about it?",
                    follow_ups=[
                        "Has it changed your mood or energy levels?",
                        "Are you worried about the future?",
                        "How is it affecting your relationships?"
                    ],
                    data_points=["emotional_impact", "mood_changes", "anxiety_levels", "social_impact"],
                    priority=3
                )
            ],
            
            "medical_history": [
                AssessmentQuestion(
                    id="injury_mechanism",
                    phase=AssessmentPhase.MEDICAL_HISTORY,
                    question="Can you walk me through exactly how this injury happened? What were you doing when it started?",
                    follow_ups=[
                        "Was there a specific moment when you felt something wrong?",
                        "Did you hear or feel anything unusual (like a pop, crack, or tear)?",
                        "Were you able to continue what you were doing?"
                    ],
                    data_points=["mechanism_of_injury", "immediate_symptoms", "audible_signs", "immediate_function"],
                    priority=1
                ),
                
                AssessmentQuestion(
                    id="previous_injuries",
                    phase=AssessmentPhase.MEDICAL_HISTORY,
                    question="Have you had any previous injuries to this area or similar problems anywhere else?",
                    follow_ups=[
                        "How were previous injuries treated?",
                        "Did they heal completely?",
                        "Any ongoing issues from past injuries?"
                    ],
                    data_points=["injury_history", "previous_treatments", "residual_effects", "recurrence_pattern"],
                    priority=3
                ),
                
                AssessmentQuestion(
                    id="medical_conditions",
                    phase=AssessmentPhase.MEDICAL_HISTORY,
                    question="Do you have any medical conditions or take any medications I should know about?",
                    follow_ups=[
                        "Any conditions affecting bones, joints, or muscles?",
                        "Any medications for pain or inflammation?",
                        "Any allergies to medications?"
                    ],
                    data_points=["medical_conditions", "current_medications", "allergies", "relevant_conditions"],
                    priority=3
                )
            ],
            
            "lifestyle_factors": [
                AssessmentQuestion(
                    id="activity_level",
                    phase=AssessmentPhase.LIFESTYLE_FACTORS,
                    question="Tell me about your typical activity level. Do you exercise regularly, play sports, or have a physically demanding job?",
                    follow_ups=[
                        "What types of activities do you enjoy?",
                        "How has your activity level changed since this started?",
                        "What are your fitness goals?"
                    ],
                    data_points=["baseline_activity", "exercise_habits", "sports_participation", "fitness_goals"],
                    priority=4
                ),
                
                AssessmentQuestion(
                    id="ergonomics_lifestyle",
                    phase=AssessmentPhase.LIFESTYLE_FACTORS,
                    question="Tell me about your work setup and daily postures. Do you sit at a desk, do physical labor, or something else?",
                    follow_ups=[
                        "How many hours do you spend in the same position?",
                        "What's your typical sleep position and mattress like?",
                        "Any repetitive motions in your daily routine?"
                    ],
                    data_points=["work_ergonomics", "postural_habits", "sleep_setup", "repetitive_activities"],
                    priority=4
                ),
                
                AssessmentQuestion(
                    id="stress_factors",
                    phase=AssessmentPhase.LIFESTYLE_FACTORS,
                    question="Are there any stressors in your life that might be affecting your healing or pain levels?",
                    follow_ups=[
                        "How do you typically handle stress?",
                        "Have you noticed stress affecting your pain?",
                        "What support systems do you have?"
                    ],
                    data_points=["stress_levels", "coping_mechanisms", "stress_pain_relationship", "support_systems"],
                    priority=4
                )
            ],
            
            "follow_up": [
                AssessmentQuestion(
                    id="treatment_goals",
                    phase=AssessmentPhase.FOLLOW_UP,
                    question="What are your main goals for treatment? What would you most like to be able to do again?",
                    follow_ups=[
                        "What's most important to you in your recovery?",
                        "Are there specific activities you're hoping to return to?",
                        "What would successful treatment look like to you?"
                    ],
                    data_points=["treatment_goals", "functional_priorities", "recovery_expectations", "success_criteria"],
                    priority=2
                ),
                
                AssessmentQuestion(
                    id="red_flag_screening",
                    phase=AssessmentPhase.FOLLOW_UP,
                    question="Have you experienced any numbness, tingling, weakness, or loss of function? Any fever, nausea, or other symptoms?",
                    follow_ups=[
                        "Any changes in bowel or bladder function?",
                        "Any severe headaches or dizziness?",
                        "Any symptoms that seem unrelated but started around the same time?"
                    ],
                    data_points=["neurological_symptoms", "systemic_symptoms", "red_flag_indicators", "associated_symptoms"],
                    priority=1
                ),
                
                AssessmentQuestion(
                    id="additional_concerns",
                    phase=AssessmentPhase.FOLLOW_UP,
                    question="Is there anything else about your condition that you think I should know? Any concerns or questions you have?",
                    follow_ups=[
                        "What worries you most about this condition?",
                        "Is there anything that doesn't seem to fit the pattern?",
                        "What questions do you have about your condition?"
                    ],
                    data_points=["additional_symptoms", "patient_concerns", "unusual_features", "questions"],
                    priority=3
                )
            ]
        }
    
    def get_phase_questions(self, phase: AssessmentPhase) -> List[AssessmentQuestion]:
        """Get all questions for a specific assessment phase."""
        return self.questions.get(phase.value, [])
    
    def get_priority_questions(self, priority: int) -> List[AssessmentQuestion]:
        """Get all questions of a specific priority level."""
        all_questions = []
        for phase_questions in self.questions.values():
            all_questions.extend([q for q in phase_questions if q.priority == priority])
        return all_questions
    
    def get_question_by_id(self, question_id: str) -> Optional[AssessmentQuestion]:
        """Get a specific question by its ID."""
        for phase_questions in self.questions.values():
            for question in phase_questions:
                if question.id == question_id:
                    return question
        return None
    
    def get_adaptive_follow_up(self, question_id: str, user_response: str) -> str:
        """
        Generate adaptive follow-up questions based on user responses.
        This would typically use NLP to analyze the response and select appropriate follow-ups.
        """
        question = self.get_question_by_id(question_id)
        if not question:
            return "Can you tell me more about that?"
        
        # Simple keyword-based follow-up selection
        response_lower = user_response.lower()
        
        if question_id == "pain_severity" and any(word in response_lower for word in ["10", "severe", "terrible", "worst"]):
            return "That sounds very intense. Have you experienced pain this severe before? Have you been able to find anything that helps even a little?"
        
        elif question_id == "pain_location" and "back" in response_lower:
            return "When you say back pain, can you be more specific? Is it in your lower back, middle back, or upper back? Does it go into your legs at all?"
        
        elif question_id == "injury_mechanism" and any(word in response_lower for word in ["fall", "fell", "trip"]):
            return "That sounds like it could have been quite a fall. Did you land on a specific part of your body? Did you hit your head at all?"
        
        # Default to the first follow-up question if no specific match
        return question.follow_ups[0] if question.follow_ups else "Can you tell me more about that?"

# Singleton instance for easy import
injury_assessment = InjuryAssessmentPrompts()
