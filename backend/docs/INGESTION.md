# PainAR Data Ingestion System

## 📚 Overview

The PainAR backend includes a comprehensive data ingestion system that allows you to populate the RAG (Retrieval Augmented Generation) knowledge base with medical documents and guidelines.

## 🏗️ Data Structure

Your `data/` folder is organized as follows:

```
backend/data/
├── clinical_practice/          # Clinical guidelines and protocols
│   ├── chronic-pain-primary-and-secondary-in-over-16s-assessment-of-all-chronic-pain-and-management-of-chronic-primary-pain-pdf-66142080468421.pdf
│   ├── 9789241550390-eng.pdf
│   ├── 9789240017870-eng.pdf
│   └── 9241561009_eng.pdf
└── patient_edu/               # Patient education materials
    ├── medlineplus.pdf
    ├── medlineplus2.pdf
    └── MLP_Spring_2011.pdf
```

## 🚀 Quick Start

### 1. Ingest All Data

```bash
# Ingest basic medical guidelines + all documents
make setup-data

# Or step by step:
make seed-data      # Basic medical guidelines
make ingest-data    # Process data folder documents
```

### 2. Check Status

```bash
make knowledge-status
```

### 3. Start Server

```bash
make run
```

## 🔌 API Endpoints

### Upload Single Document

```bash
POST /ingestion/upload-document
Content-Type: multipart/form-data
Authorization: Bearer dev-token

# Upload a PDF, TXT, CSV, JSON, or MD file
curl -X POST "http://localhost:8000/ingestion/upload-document" \
     -H "Authorization: Bearer dev-token" \
     -F "file=@medical_document.pdf" \
     -F "source_type=clinical_practice"
```

### Bulk Guidelines Import

```bash
POST /ingestion/bulk-guidelines
Content-Type: application/json
Authorization: Bearer dev-token

{
  "guidelines": [
    {
      "title": "Pain Management Protocol",
      "content": "Detailed medical guidelines...",
      "category": "Clinical Practice",
      "last_updated": "2024-01-15"
    }
  ]
}
```

### Check Ingestion Status

```bash
GET /ingestion/status
Authorization: Bearer dev-token

# Response:
{
  "status": "ready",
  "knowledge_chunks": 150,
  "embeddings": 150,
  "knowledge_threads": 12,
  "ready_for_rag": true
}
```

### Clear Knowledge Base

```bash
DELETE /ingestion/clear-knowledge
Authorization: Bearer dev-token

# Removes all ingested data (use with caution)
```

## 📖 Document Processing

### Supported Formats

- **PDF**: Clinical guidelines, research papers
- **Text**: Plain text medical documents
- **Markdown**: Formatted medical content
- **CSV**: Structured medical data
- **JSON**: Structured guidelines and protocols

### Processing Pipeline

1. **Document Loading**: Files are loaded using appropriate LangChain document loaders
2. **Text Chunking**: Documents are split into 1000-character chunks with 200-character overlap
3. **Embedding Generation**: Each chunk is converted to a 1536-dimensional vector using OpenAI's `text-embedding-3-small`
4. **Database Storage**: Chunks and embeddings are stored in PostgreSQL with metadata

### Content Categories

- **clinical_practice**: Clinical guidelines, protocols, best practices
- **patient_education**: Patient-facing educational materials
- **knowledge_base**: General medical knowledge and guidelines
- **ar_technology**: AR/VR applications in healthcare

## 🧠 RAG Integration

Once data is ingested, your RAG system can:

1. **Retrieve Relevant Content**: Find the most relevant medical knowledge for user questions
2. **Generate Contextual Responses**: Combine retrieved knowledge with AI-generated responses
3. **Maintain Conversation Memory**: Keep track of conversation history for context
4. **Stream Real-time Responses**: Provide live token-by-token responses

### Testing RAG Responses

```bash
# Test with medical questions
curl -X POST "http://localhost:8000/chat" \
     -H "Authorization: Bearer dev-token" \
     -H "Content-Type: application/json" \
     -d '{
       "thread_id": "123e4567-e89b-12d3-a456-426614174000",
       "message": "What are the best practices for chronic pain assessment?"
     }'
```

## 📊 Monitoring and Management

### Knowledge Base Statistics

Check comprehensive stats about your ingested data:

```bash
make knowledge-status
```

Example output:
```
📈 Overall Statistics:
   • Total knowledge chunks: 247
   • Total embeddings: 247
   • Knowledge threads: 15
   • RAG system ready: ✅ Yes

📚 Content Breakdown by Source:
   • Clinical Practice: 4 document(s)
   • Patient Education: 3 document(s)
   • Medical Guidelines: 1 document(s)
```

### Performance Considerations

- **Chunk Size**: 1000 characters balances context and specificity
- **Overlap**: 200 characters ensures continuity between chunks
- **Embedding Model**: `text-embedding-3-small` provides good performance/cost ratio
- **Vector Similarity**: Cosine similarity used for retrieval ranking

## 🔐 Security

- **Authentication**: All ingestion endpoints require Bearer token authentication
- **Development Token**: Uses `dev-token` for local development
- **File Validation**: Only allowed file types are accepted
- **Temporary Storage**: Uploaded files are cleaned up after processing

## 🛠️ Customization

### Adding New Document Types

Extend the `DocumentIngestionService` to support additional formats:

```python
def _get_loader(self, file_path: Path):
    extension = file_path.suffix.lower()
    
    if extension == '.docx':
        return DocxLoader(str(file_path))
    # Add more loaders as needed
```

### Custom Text Splitting

Modify chunk size and overlap for different content types:

```python
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,      # Larger chunks for technical documents
    chunk_overlap=300,    # More overlap for complex content
    separators=["\n\n", "\n", ". ", " ", ""]
)
```

### Enhanced Metadata

Add custom metadata during ingestion:

```python
metadata = {
    "document_type": "clinical_guideline",
    "publication_date": "2024-01-15",
    "authority": "WHO",
    "language": "en"
}
```

## 🎯 Best Practices

1. **Organize by Category**: Use the folder structure to categorize documents
2. **Quality Content**: Ensure documents are high-quality, relevant medical content
3. **Regular Updates**: Re-ingest updated guidelines and protocols
4. **Monitor Performance**: Check knowledge-status regularly
5. **Test Retrieval**: Validate that relevant content is being retrieved for queries

## 🔄 Maintenance

### Regular Updates

```bash
# Clear existing data and re-ingest
make ingest-data

# Or clear everything and start fresh
curl -X DELETE "http://localhost:8000/ingestion/clear-knowledge" \
     -H "Authorization: Bearer dev-token"
make setup-data
```

### Backup Knowledge Base

The knowledge base is stored in PostgreSQL. Regular database backups will preserve your ingested content.

---

Your PainAR RAG system is now equipped with comprehensive medical knowledge ingestion capabilities! 🏥✨
