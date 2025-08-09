"""
Assessment Manager for PainAR
Manages the flow of injury assessment conversations and data collection.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json
from enum import Enum

from .injury_assessment import injury_assessment, AssessmentPhase, AssessmentQuestion

@dataclass
class UserResponse:
    question_id: str
    response: str
    timestamp: datetime
    follow_up_asked: Optional[str] = None
    follow_up_response: Optional[str] = None

@dataclass
class AssessmentData:
    user_id: str
    session_id: str
    start_time: datetime
    current_phase: AssessmentPhase
    responses: List[UserResponse]
    extracted_data: Dict[str, Any]
    completion_percentage: float
    priority_score: int  # Based on red flags and severity indicators
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/transmission."""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "current_phase": self.current_phase.value,
            "responses": [
                {
                    "question_id": r.question_id,
                    "response": r.response,
                    "timestamp": r.timestamp.isoformat(),
                    "follow_up_asked": r.follow_up_asked,
                    "follow_up_response": r.follow_up_response
                }
                for r in self.responses
            ],
            "extracted_data": self.extracted_data,
            "completion_percentage": self.completion_percentage,
            "priority_score": self.priority_score
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AssessmentData':
        """Create from dictionary."""
        return cls(
            user_id=data["user_id"],
            session_id=data["session_id"],
            start_time=datetime.fromisoformat(data["start_time"]),
            current_phase=AssessmentPhase(data["current_phase"]),
            responses=[
                UserResponse(
                    question_id=r["question_id"],
                    response=r["response"],
                    timestamp=datetime.fromisoformat(r["timestamp"]),
                    follow_up_asked=r.get("follow_up_asked"),
                    follow_up_response=r.get("follow_up_response")
                )
                for r in data["responses"]
            ],
            extracted_data=data["extracted_data"],
            completion_percentage=data["completion_percentage"],
            priority_score=data["priority_score"]
        )

class AssessmentManager:
    """
    Manages the flow of injury assessment conversations.
    Tracks progress, determines next questions, and extracts key data points.
    """
    
    def __init__(self):
        self.active_assessments: Dict[str, AssessmentData] = {}
        self.prompts = injury_assessment
    
    def start_assessment(self, user_id: str, session_id: str, initial_complaint: str = None) -> AssessmentData:
        """Start a new injury assessment session."""
        assessment = AssessmentData(
            user_id=user_id,
            session_id=session_id,
            start_time=datetime.now(),
            current_phase=AssessmentPhase.INITIAL_SCREENING,
            responses=[],
            extracted_data={},
            completion_percentage=0.0,
            priority_score=0
        )
        
        # If there's an initial complaint, record it
        if initial_complaint:
            assessment.extracted_data["initial_complaint"] = initial_complaint
        
        self.active_assessments[session_id] = assessment
        return assessment
    
    def get_next_question(self, session_id: str) -> Optional[str]:
        """Get the next question to ask in the assessment."""
        assessment = self.active_assessments.get(session_id)
        if not assessment:
            return None
        
        # Get questions for current phase
        phase_questions = self.prompts.get_phase_questions(assessment.current_phase)
        
        # Find questions not yet asked
        asked_question_ids = {r.question_id for r in assessment.responses}
        unanswered_questions = [q for q in phase_questions if q.id not in asked_question_ids]
        
        if unanswered_questions:
            # Prioritize by priority score (lower number = higher priority)
            next_question = min(unanswered_questions, key=lambda q: q.priority)
            return self._format_question(next_question)
        
        # Move to next phase if current phase is complete
        next_phase = self._get_next_phase(assessment.current_phase)
        if next_phase:
            assessment.current_phase = next_phase
            return self.get_next_question(session_id)
        
        # Assessment complete
        return None
    
    def process_response(self, session_id: str, question_id: str, user_response: str) -> Dict[str, Any]:
        """Process a user response and extract relevant data."""
        assessment = self.active_assessments.get(session_id)
        if not assessment:
            return {"error": "Assessment session not found"}
        
        # Record the response
        response = UserResponse(
            question_id=question_id,
            response=user_response,
            timestamp=datetime.now()
        )
        assessment.responses.append(response)
        
        # Extract data points from the response
        extracted_data = self._extract_data_points(question_id, user_response)
        assessment.extracted_data.update(extracted_data)
        
        # Update priority score based on response
        self._update_priority_score(assessment, question_id, user_response)
        
        # Update completion percentage
        assessment.completion_percentage = self._calculate_completion(assessment)
        
        # Generate follow-up if needed
        follow_up = self._should_ask_follow_up(question_id, user_response)
        
        return {
            "success": True,
            "extracted_data": extracted_data,
            "follow_up": follow_up,
            "completion_percentage": assessment.completion_percentage,
            "priority_score": assessment.priority_score,
            "next_question": self.get_next_question(session_id) if not follow_up else None
        }
    
    def get_assessment_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a comprehensive summary of the assessment."""
        assessment = self.active_assessments.get(session_id)
        if not assessment:
            return None
        
        summary = {
            "session_info": {
                "session_id": session_id,
                "start_time": assessment.start_time.isoformat(),
                "duration_minutes": (datetime.now() - assessment.start_time).total_seconds() / 60,
                "completion_percentage": assessment.completion_percentage,
                "priority_score": assessment.priority_score
            },
            "key_findings": self._generate_key_findings(assessment),
            "clinical_data": self._organize_clinical_data(assessment),
            "recommendations": self._generate_recommendations(assessment),
            "red_flags": self._identify_red_flags(assessment),
            "raw_responses": [
                {
                    "question": self._get_question_text(r.question_id),
                    "response": r.response,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in assessment.responses
            ]
        }
        
        return summary
    
    def _format_question(self, question: AssessmentQuestion) -> str:
        """Format a question for presentation to the user."""
        return f"{question.question}"
    
    def _get_next_phase(self, current_phase: AssessmentPhase) -> Optional[AssessmentPhase]:
        """Determine the next assessment phase."""
        phase_order = [
            AssessmentPhase.INITIAL_SCREENING,
            AssessmentPhase.PAIN_CHARACTERISTICS,
            AssessmentPhase.FUNCTIONAL_IMPACT,
            AssessmentPhase.MEDICAL_HISTORY,
            AssessmentPhase.LIFESTYLE_FACTORS,
            AssessmentPhase.FOLLOW_UP
        ]
        
        try:
            current_index = phase_order.index(current_phase)
            if current_index < len(phase_order) - 1:
                return phase_order[current_index + 1]
        except ValueError:
            pass
        
        return None
    
    def _extract_data_points(self, question_id: str, response: str) -> Dict[str, Any]:
        """Extract structured data from user responses."""
        question = self.prompts.get_question_by_id(question_id)
        if not question:
            return {}
        
        extracted = {}
        response_lower = response.lower()
        
        # Question-specific extraction logic
        if question_id == "pain_severity":
            # Extract numeric pain ratings
            import re
            numbers = re.findall(r'\b(\d+)\b', response)
            if numbers:
                extracted["pain_level_current"] = int(numbers[0])
        
        elif question_id == "pain_location":
            # Extract body regions mentioned
            body_regions = [
                "head", "neck", "shoulder", "arm", "elbow", "wrist", "hand",
                "chest", "back", "abdomen", "hip", "thigh", "knee", "shin",
                "ankle", "foot", "spine", "lower back", "upper back"
            ]
            mentioned_regions = [region for region in body_regions if region in response_lower]
            if mentioned_regions:
                extracted["affected_body_regions"] = mentioned_regions
        
        elif question_id == "pain_quality":
            # Extract pain descriptors
            pain_descriptors = [
                "sharp", "dull", "burning", "aching", "throbbing", "stabbing",
                "cramping", "shooting", "tingling", "numbness", "stiffness"
            ]
            mentioned_descriptors = [desc for desc in pain_descriptors if desc in response_lower]
            if mentioned_descriptors:
                extracted["pain_descriptors"] = mentioned_descriptors
        
        elif question_id == "injury_mechanism":
            # Extract mechanism keywords
            mechanisms = [
                "fall", "twist", "lift", "bend", "slip", "trip", "crash",
                "sports", "accident", "sudden", "gradual", "repetitive"
            ]
            mentioned_mechanisms = [mech for mech in mechanisms if mech in response_lower]
            if mentioned_mechanisms:
                extracted["injury_mechanisms"] = mentioned_mechanisms
        
        # Store raw response for all questions
        for data_point in question.data_points:
            extracted[f"{data_point}_raw"] = response
        
        return extracted
    
    def _update_priority_score(self, assessment: AssessmentData, question_id: str, response: str) -> None:
        """Update priority score based on responses indicating urgency."""
        response_lower = response.lower()
        
        # High priority indicators
        if any(indicator in response_lower for indicator in [
            "10", "severe", "unbearable", "worst", "emergency",
            "numbness", "weakness", "can't move", "tingling",
            "fever", "nausea", "dizzy", "confused"
        ]):
            assessment.priority_score += 10
        
        # Medium priority indicators
        elif any(indicator in response_lower for indicator in [
            "8", "9", "very painful", "difficult", "hard to",
            "swelling", "bruising", "stiff", "limited"
        ]):
            assessment.priority_score += 5
        
        # Recent onset
        if question_id == "pain_chief_complaint" and any(word in response_lower for word in [
            "today", "yesterday", "sudden", "suddenly", "just started"
        ]):
            assessment.priority_score += 3
    
    def _calculate_completion(self, assessment: AssessmentData) -> float:
        """Calculate assessment completion percentage."""
        total_questions = sum(len(questions) for questions in self.prompts.questions.values())
        answered_questions = len(assessment.responses)
        return min(100.0, (answered_questions / total_questions) * 100)
    
    def _should_ask_follow_up(self, question_id: str, response: str) -> Optional[str]:
        """Determine if a follow-up question should be asked."""
        if len(response.split()) < 3:  # Very short response
            return "Could you tell me a bit more about that?"
        
        return self.prompts.get_adaptive_follow_up(question_id, response)
    
    def _generate_key_findings(self, assessment: AssessmentData) -> List[str]:
        """Generate key clinical findings from the assessment."""
        findings = []
        data = assessment.extracted_data
        
        if "pain_level_current" in data:
            level = data["pain_level_current"]
            if level >= 8:
                findings.append(f"Severe pain reported (level {level}/10)")
            elif level >= 5:
                findings.append(f"Moderate pain reported (level {level}/10)")
        
        if "affected_body_regions" in data:
            regions = data["affected_body_regions"]
            findings.append(f"Pain affecting: {', '.join(regions)}")
        
        if "pain_descriptors" in data:
            descriptors = data["pain_descriptors"]
            findings.append(f"Pain quality: {', '.join(descriptors)}")
        
        if assessment.priority_score > 15:
            findings.append("High priority case - multiple concerning features")
        
        return findings
    
    def _organize_clinical_data(self, assessment: AssessmentData) -> Dict[str, Any]:
        """Organize extracted data into clinical categories."""
        data = assessment.extracted_data
        
        return {
            "pain_assessment": {
                "severity": data.get("pain_level_current"),
                "location": data.get("affected_body_regions", []),
                "quality": data.get("pain_descriptors", []),
                "timing": data.get("pain_frequency_raw", ""),
                "aggravating_factors": data.get("aggravating_factors_raw", ""),
                "relieving_factors": data.get("relieving_factors_raw", "")
            },
            "injury_details": {
                "mechanism": data.get("injury_mechanisms", []),
                "onset": data.get("onset_timeline_raw", ""),
                "immediate_symptoms": data.get("immediate_symptoms_raw", "")
            },
            "functional_impact": {
                "limitations": data.get("functional_limitations_raw", ""),
                "work_impact": data.get("work_impact_raw", ""),
                "sleep_disturbance": data.get("sleep_disturbance_raw", "")
            },
            "medical_history": {
                "previous_injuries": data.get("injury_history_raw", ""),
                "medical_conditions": data.get("medical_conditions_raw", ""),
                "medications": data.get("current_medications_raw", "")
            }
        }
    
    def _generate_recommendations(self, assessment: AssessmentData) -> List[str]:
        """Generate recommendations based on assessment findings."""
        recommendations = []
        
        if assessment.priority_score > 20:
            recommendations.append("Recommend urgent medical evaluation")
        elif assessment.priority_score > 10:
            recommendations.append("Recommend medical evaluation within 24-48 hours")
        
        data = assessment.extracted_data
        if "pain_level_current" in data and data["pain_level_current"] >= 7:
            recommendations.append("Consider pain management strategies")
        
        if any(desc in data.get("pain_descriptors", []) for desc in ["burning", "tingling"]):
            recommendations.append("Neurological evaluation may be warranted")
        
        return recommendations
    
    def _identify_red_flags(self, assessment: AssessmentData) -> List[str]:
        """Identify red flag symptoms requiring immediate attention."""
        red_flags = []
        
        # Check responses for red flag keywords
        for response in assessment.responses:
            response_lower = response.response.lower()
            if any(flag in response_lower for flag in [
                "numbness", "weakness", "can't move", "paralysis",
                "severe headache", "fever", "nausea", "vomiting",
                "loss of consciousness", "confusion", "chest pain"
            ]):
                red_flags.append(f"Red flag identified: {response.response[:100]}...")
        
        return red_flags
    
    def _get_question_text(self, question_id: str) -> str:
        """Get the text of a question by its ID."""
        question = self.prompts.get_question_by_id(question_id)
        return question.question if question else "Unknown question"

# Singleton instance
assessment_manager = AssessmentManager()
