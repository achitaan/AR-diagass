# PainAR Comprehensive Assessment System

## Overview

PainAR now includes a sophisticated injury assessment system that conducts structured interviews to gather detailed information about pain and injuries. This system is designed to assist healthcare providers by collecting comprehensive, medically-relevant data in an organized format.

## Key Features

### 🎯 **Structured Assessment Flow**
- **6 Assessment Phases**: Initial screening, pain characteristics, functional impact, medical history, lifestyle factors, and follow-up
- **Priority-Based Questions**: Critical questions (priority 1-2) are asked first
- **Adaptive Follow-ups**: Smart follow-up questions based on user responses
- **Progress Tracking**: Real-time completion percentage and priority scoring

### 📊 **Comprehensive Data Collection**
- **Pain Characteristics**: Severity, location, quality, timing, triggers
- **Injury Details**: Mechanism, onset, immediate symptoms
- **Functional Impact**: Daily activities, mobility, sleep, emotional effects
- **Medical History**: Previous injuries, conditions, medications
- **Red Flag Detection**: Automatic identification of concerning symptoms

### 🏥 **Medical-Grade Output**
- **Structured Clinical Data**: Organized by medical categories
- **Key Findings Summary**: Highlighted important discoveries
- **Priority Scoring**: Urgency assessment based on symptoms
- **Export Capability**: Formatted reports for healthcare providers

## File Structure

```
backend/app/prompts/
├── __init__.py                 # Package initialization
├── injury_assessment.py       # Core assessment questions and prompts
└── assessment_manager.py      # Assessment flow management

backend/app/api/
└── chat.py                    # Updated with assessment integration

backend/
└── demo_assessment.py         # Demonstration script
```

## Core Components

### 1. **InjuryAssessmentPrompts** (`injury_assessment.py`)
Contains 20+ structured questions across 6 assessment phases:

- **Initial Screening**: Chief complaint, pain location, severity
- **Pain Characteristics**: Quality, timing, triggers/relievers  
- **Functional Impact**: Daily activities, mobility, psychological effects
- **Medical History**: Injury mechanism, previous conditions
- **Lifestyle Factors**: Activity level, ergonomics, stress
- **Follow-up**: Treatment goals, red flag screening

### 2. **AssessmentManager** (`assessment_manager.py`)
Manages the assessment flow:

```python
# Start new assessment
assessment = assessment_manager.start_assessment(
    user_id="user123",
    session_id="session456", 
    initial_complaint="Back pain after lifting"
)

# Get next question
question = assessment_manager.get_next_question(session_id)

# Process user response
result = assessment_manager.process_response(
    session_id, question_id, user_response
)

# Get comprehensive summary
summary = assessment_manager.get_assessment_summary(session_id)
```

### 3. **Enhanced Chat Integration** (`chat.py`)
The chat endpoint now:

- Automatically starts assessments for new conversations
- Uses the comprehensive system prompt from the assessment system
- Processes responses to extract medical data
- Provides structured follow-up questions
- Tracks assessment progress

## API Endpoints

### Chat with Assessment
```
POST /chat/
```
Enhanced chat endpoint that integrates structured assessment flow.

### Assessment Summary
```
GET /chat/assessment/{session_id}
```
Returns comprehensive assessment summary with key findings.

### Export Assessment
```
POST /chat/assessment/{session_id}/export
```
Exports assessment data in medical report format.

## Example Assessment Flow

### 1. **Initial Question**
```
"Can you tell me about your main concern today? What's bothering you the most?"
```

### 2. **User Response Processing**
```python
response = "I have severe lower back pain after lifting heavy boxes"

# Extracts:
# - Pain severity indicators: "severe"
# - Body region: "lower back" 
# - Mechanism: "lifting"
# - Onset: "after"
```

### 3. **Adaptive Follow-up**
```
"That sounds like it could have been quite a strain. When you say lower back pain, 
can you be more specific about exactly where it hurts? Does the pain stay in one 
place or does it move around?"
```

### 4. **Clinical Summary**
```json
{
  "key_findings": [
    "Severe pain reported (level 8/10)",
    "Pain affecting: lower back, leg", 
    "Pain quality: sharp, stabbing, burning"
  ],
  "clinical_data": {
    "pain_assessment": {
      "severity": 8,
      "location": ["lower back", "leg"],
      "quality": ["sharp", "stabbing", "burning"]
    },
    "injury_details": {
      "mechanism": ["lifting", "fall"],
      "onset": "acute - yesterday"
    }
  },
  "red_flags": [
    "Red flag identified: shooting pain down leg with numbness"
  ],
  "recommendations": [
    "Recommend urgent medical evaluation",
    "Neurological evaluation may be warranted"
  ]
}
```

## Benefits

### For Users
- **Guided Interview**: Structured questions help users provide relevant information
- **Educational**: Learn about their condition through targeted questions  
- **Preparation**: Better prepared for medical consultations
- **Validation**: Professional acknowledgment of their pain experience

### For Healthcare Providers
- **Comprehensive Data**: Detailed, organized information about the patient's condition
- **Time Savings**: Pre-structured assessment reduces consultation time
- **Consistency**: Standardized data collection across patients
- **Priority Triage**: Automatic identification of high-priority cases

### For the System
- **Scalability**: Structured data enables analytics and pattern recognition
- **Quality**: Medical-grade assessment ensures relevant data collection
- **Integration**: Seamless integration with existing chat functionality
- **Adaptability**: Easy to extend with new questions or assessment phases

## Running the Demo

To see the assessment system in action:

```bash
cd backend
python demo_assessment.py
```

This will demonstrate:
- Starting a new assessment
- Processing user responses
- Extracting clinical data
- Generating comprehensive summaries
- Question categorization and prioritization

## Integration with Mobile App

The mobile app can now:

1. **Display Assessment Questions**: Show structured questions from the backend
2. **Track Progress**: Display completion percentage and assessment phase
3. **Visual Integration**: Combine drawing data with structured questions
4. **Export Reports**: Generate medical reports for healthcare providers

## Future Enhancements

- **Multi-language Support**: Translate questions and responses
- **ML-Enhanced Extraction**: Use NLP models for better data extraction
- **Symptom Tracking**: Longitudinal assessment across multiple sessions
- **Provider Dashboard**: Web interface for healthcare professionals
- **FHIR Integration**: Export data in healthcare standard formats

The PainAR assessment system transforms casual pain conversations into comprehensive medical evaluations, bridging the gap between patient experience and clinical documentation.
