"""
Script to seed the PainAR knowledge base with initial medical data.
Run this after setting up the database to populate with healthcare knowledge.
"""

import asyncio
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.ingestion import DocumentIngestionService


# Sample medical guidelines for pain management
PAIN_MANAGEMENT_GUIDELINES = [
    {
        "title": "Acute Pain Management Protocol",
        "category": "Pain Management",
        "content": """
Acute pain management involves immediate assessment and treatment of pain 
lasting less than 3 months. Key principles include:

1. Pain Assessment:
   - Use validated pain scales (0-10 numeric rating)
   - Assess pain location, quality, and timing
   - Consider functional impact

2. Multimodal Approach:
   - Combine pharmacological and non-pharmacological methods
   - Consider acetaminophen, NSAIDs, and opioids when appropriate
   - Integrate physical therapy and relaxation techniques

3. Safety Considerations:
   - Monitor for contraindications
   - Assess risk of dependency
   - Regular reassessment and adjustment
        """,
        "last_updated": "2024-01-15"
    },
    {
        "title": "Chronic Pain Management Guidelines",
        "category": "Pain Management", 
        "content": """
Chronic pain (>3 months duration) requires comprehensive, 
interdisciplinary management:

1. Comprehensive Assessment:
   - Biopsychosocial evaluation
   - Functional assessment tools
   - Comorbidity screening

2. Treatment Modalities:
   - Physical therapy and exercise
   - Cognitive behavioral therapy
   - Medication management (non-opioid preferred)
   - Interventional procedures when indicated

3. Self-Management:
   - Patient education
   - Coping strategies
   - Activity pacing
   - Stress management
        """,
        "last_updated": "2024-01-20"
    },
    {
        "title": "Augmented Reality in Pain Education",
        "category": "AR Technology",
        "content": """
AR technology can enhance pain education and management:

1. Visualization Benefits:
   - 3D anatomy visualization for pain education
   - Interactive exercise demonstrations
   - Real-time feedback for proper form

2. Patient Engagement:
   - Gamification of therapy exercises
   - Progress tracking and motivation
   - Distraction during procedures

3. Clinical Applications:
   - Pre-procedure education
   - Rehabilitation guidance
   - Self-management skill building
        """,
        "last_updated": "2024-02-01"
    },
    {
        "title": "Physical Therapy Exercise Protocols",
        "category": "Rehabilitation",
        "content": """
Evidence-based exercise protocols for common pain conditions:

1. Lower Back Pain:
   - Core strengthening exercises
   - Flexibility and stretching routines
   - Progressive loading protocols

2. Neck Pain:
   - Cervical range of motion exercises
   - Postural correction techniques
   - Strengthening for deep neck flexors

3. General Principles:
   - Start with low intensity
   - Progress gradually
   - Monitor pain response
   - Adapt to individual capabilities
        """,
        "last_updated": "2024-01-25"
    },
    {
        "title": "Pain Assessment and Documentation",
        "category": "Clinical Assessment",
        "content": """
Comprehensive pain assessment is crucial for effective management:

1. Pain Intensity Measures:
   - Numeric Rating Scale (0-10)
   - Visual Analog Scale (VAS)
   - Wong-Baker FACES scale for children
   - Behavioral indicators for non-verbal patients

2. Pain Quality Assessment:
   - Location and radiation patterns
   - Temporal characteristics (constant, intermittent)
   - Aggravating and alleviating factors
   - Impact on daily activities

3. Documentation Requirements:
   - Regular reassessment intervals
   - Response to interventions
   - Functional improvement measures
   - Patient-reported outcomes
        """,
        "last_updated": "2024-01-30"
    },
    {
        "title": "Non-Pharmacological Pain Management",
        "category": "Alternative Therapies",
        "content": """
Evidence-based non-drug approaches for pain management:

1. Physical Interventions:
   - Heat and cold therapy
   - Massage and manual therapy
   - Transcutaneous electrical nerve stimulation (TENS)
   - Acupuncture and dry needling

2. Psychological Approaches:
   - Cognitive behavioral therapy (CBT)
   - Mindfulness and meditation
   - Relaxation techniques
   - Biofeedback training

3. Lifestyle Modifications:
   - Regular exercise and movement
   - Sleep hygiene improvement
   - Stress management techniques
   - Nutritional considerations
        """,
        "last_updated": "2024-02-05"
    }
]


async def seed_medical_knowledge():
    """Seed the database with initial medical knowledge."""
    print("🌱 Starting medical knowledge base seeding...")
    
    # Initialize the database first
    from app.db.core import create_tables
    await create_tables()
    print("✅ Database tables ensured")
    
    ingestion_service = DocumentIngestionService()
    
    # Ingest medical guidelines
    print("📋 Ingesting medical guidelines...")
    try:
        message_ids = await ingestion_service.ingest_medical_guidelines(
            PAIN_MANAGEMENT_GUIDELINES
        )
        
        print(f"✅ Created {len(message_ids)} knowledge chunks from {len(PAIN_MANAGEMENT_GUIDELINES)} guidelines")
    except Exception as e:
        print(f"❌ Failed to ingest guidelines: {e}")
        return False
    
    # Check for additional documents to ingest
    docs_path = Path("data/medical_docs")
    if docs_path.exists():
        print("📄 Ingesting additional documents...")
        try:
            results = await ingestion_service.ingest_directory(docs_path)
            total_docs = sum(len(ids) for ids in results.values())
            print(f"✅ Ingested {len(results)} documents with {total_docs} total chunks")
        except Exception as e:
            print(f"❌ Failed to ingest directory: {e}")
    else:
        print("📁 No additional documents directory found (data/medical_docs)")
        print("   You can create this directory and add PDF, TXT, MD files for ingestion")
    
    # Get final stats
    try:
        stats = await ingestion_service.get_knowledge_stats()
        print("\n📊 Final Knowledge Base Statistics:")
        print(f"   • Knowledge chunks: {stats['knowledge_chunks']}")
        print(f"   • Embeddings: {stats['embeddings']}")
        print(f"   • Knowledge threads: {stats['knowledge_threads']}")
        print(f"   • RAG ready: {'✅ Yes' if stats['ready_for_rag'] else '❌ No'}")
    except Exception as e:
        print(f"⚠️ Could not get final stats: {e}")
    
    print("\n🎉 Medical knowledge base seeding complete!")
    print("\n🚀 Your RAG system now has medical knowledge to retrieve from!")
    print("   Try asking questions about pain management, AR therapy, or clinical assessment.")
    
    return True


if __name__ == "__main__":
    success = asyncio.run(seed_medical_knowledge())
    if success:
        print("\n✅ Seeding completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Seeding failed!")
        sys.exit(1)
