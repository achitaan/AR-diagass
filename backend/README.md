# PainAR Backend

A complete Python backend for an augmented-reality healthcare application that provides streaming chat, vector-memory retrieval, and mobile synchronization capabilities.

## 🏥 Features

- **Streaming Chat API**: Real-time conversation with GPT-4o-mini using Server-Sent Events
- **Vector Memory**: Semantic search and retrieval using PostgreSQL with pgvector extension
- **Mobile Sync**: Realm database delta synchronization endpoint
- **Healthcare Focus**: Designed for augmented reality pain management applications
- **Observability**: Prometheus metrics, LangSmith tracing, and Sentry error tracking

## 🛠 Technology Stack

- **Python 3.11+** with FastAPI and Uvicorn
- **LangChain 0.2** with pgvector integration for RAG
- **PostgreSQL 16** with pgvector extension
- **OpenAI GPT-4o-mini** for chat completion and Whisper for speech-to-text
- **Pydantic 2** for data validation
- **Alembic** for database migrations
- **Async testing** with pytest-asyncio and httpx

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application factory
│   ├── settings.py             # Pydantic settings configuration
│   ├── api/
│   │   ├── chat.py            # Streaming chat endpoint
│   │   ├── sync.py            # Mobile synchronization endpoint
│   │   └── health.py          # Health check endpoints
│   ├── db/
│   │   ├── core.py            # Database engine and connection management
│   │   ├── models.py          # SQLModel definitions (Thread, Message, Embedding)
│   │   └── vector.py          # PGVector wrapper for LangChain
│   └── services/
│       ├── rag.py             # ConversationalRetrievalChain factory
│       └── whisper.py         # OpenAI Whisper integration
├── migrations/                 # Alembic database migrations
├── tests/
│   └── test_chat_flow.py      # Integration tests
├── pyproject.toml             # Poetry dependencies and configuration
├── Makefile                   # Development commands
├── alembic.ini               # Alembic configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Python 3.11 or newer**
2. **PostgreSQL 16** running locally on port 5432
3. **OpenAI API Key** for GPT-4o-mini and embeddings

### Setup Instructions

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   make install
   # or manually: pip install poetry && poetry install
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/painar
   MODEL_NAME=gpt-4o-mini
   VECTOR_DIM=1536
   DEBUG=true
   DEV_TOKEN=dev-token
   ```

5. **Set up the database:**
   ```bash
   # Create database and enable pgvector extension
   createdb painar
   make setup-db
   
   # Run migrations
   make migrate
   ```

6. **Start the development server:**
   ```bash
   make dev
   ```
   
   The API will be available at `http://localhost:8000`

## 🔧 Development Commands

```bash
# Install dependencies
make install

# Run development server (with auto-reload)
make dev

# Run tests
make test

# Run database migrations
make migrate

# Create new migration
make migration message="your migration description"

# Format code
make format

# Lint code
make lint

# Full setup for new developers
make setup

# Run all checks (format, lint, test)
make check

# Clean temporary files
make clean
```

## 📡 API Endpoints

### Chat Endpoint
```bash
POST /chat/
Authorization: Bearer dev-token
Content-Type: application/json

{
  "thread_id": "uuid-here",
  "message": "I'm experiencing lower back pain after sitting for long periods",
  "svg_path": null
}
```

**Response**: Server-Sent Events stream
```
data: {"content": "I"}
data: {"content": " understand"}
data: {"content": " you're"}
...
event: done
data: {}
```

### Mobile Sync Endpoint
```bash
POST /sync/
Authorization: Bearer dev-token
Content-Type: application/json

{
  "threads": [
    {
      "id": "uuid-here",
      "title": "Back Pain Discussion",
      "operation": "insert"
    }
  ],
  "messages": [
    {
      "id": "uuid-here", 
      "thread_id": "thread-uuid",
      "role": "user",
      "content": "My back hurts",
      "operation": "insert"
    }
  ],
  "client_id": "mobile-app-v1",
  "sync_timestamp": 1234567890
}
```

### Health Check
```bash
GET /healthz

# Response
{"status": "ok"}
```

## 🧪 Testing

Run the complete test suite:
```bash
make test
```

The integration test covers:
1. Thread creation in the database
2. Posting to chat endpoint with streaming consumption
3. Verification of assistant token delivery
4. Confirmation of embedding storage (two vectors per conversation)

### Example cURL Commands

**Test chat streaming:**
```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "What exercises can help with chronic lower back pain?"
  }' \
  --no-buffer
```

**Test health endpoint:**
```bash
curl "http://localhost:8000/healthz"
```

## 📊 Observability

### Prometheus Metrics
Available at `/metrics` endpoint:
- `http_requests_total` - Total HTTP requests by method, endpoint, and status
- `http_request_duration_seconds` - Request duration histogram

### LangSmith Tracing
Set environment variables to enable:
```env
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=painar-backend
```

### Sentry Error Tracking
Set environment variable to enable:
```env
SENTRY_DSN=your_sentry_dsn_here
```

## 🐛 Troubleshooting

### Common Issues

**Port 8000 already in use:**
```bash
# Kill process using port 8000
# On Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On macOS/Linux  
lsof -ti:8000 | xargs kill -9

# Or run on different port
uvicorn app.main:create_app --port 8001
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# Check if database exists
psql -h localhost -p 5432 -U postgres -l | grep painar

# Recreate database if needed
dropdb painar && createdb painar
make setup-db && make migrate
```

**Missing pgvector extension:**
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql painar

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**OpenAI API errors:**
- Verify your API key is valid and has sufficient credits
- Check the model name matches exactly: `gpt-4o-mini`
- Ensure network connectivity to OpenAI endpoints

**Poetry/dependency issues:**
```bash
# Clear poetry cache
poetry cache clear pypi --all

# Reinstall dependencies
rm poetry.lock
poetry install
```

## 🔮 Future Enhancements

The codebase includes TODO stubs for:

- **On-device Llama integration**: Endpoint for local model inference
- **Thread summarization**: Nightly job using APScheduler for conversation summaries  
- **FHIR integration**: Webhook for exporting sessions as FHIR Observation resources

## 📄 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT and embeddings | *Required* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:password@localhost:5432/painar` |
| `MODEL_NAME` | OpenAI model name | `gpt-4o-mini` |
| `VECTOR_DIM` | Embedding vector dimensions | `1536` |
| `DEBUG` | Enable debug mode | `false` |
| `SECRET_KEY` | Application secret key | `dev-secret-key` |
| `DEV_TOKEN` | Development authentication token | `dev-token` |
| `LANGSMITH_API_KEY` | LangSmith tracing API key | *Optional* |
| `SENTRY_DSN` | Sentry error tracking DSN | *Optional* |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `make check` to verify formatting, linting, and tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**PainAR Backend** - Empowering healthcare through augmented reality and intelligent conversation. 🏥✨
