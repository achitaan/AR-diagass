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

   pip install -r requirements.txt
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

   **First, ensure PostgreSQL is installed and running:**
   ```powershell
   # Check if PostgreSQL is installed and get version
   postgres --version
   
   # Check if PostgreSQL service is running
   Get-Service postgresql*
   
   # Start PostgreSQL service if not running
   Start-Service postgresql-x64-16  # Adjust version number as needed
   ```

   **If PostgreSQL is not installed, install it:**
   ```powershell
   # Using Chocolatey (install Chocolatey first if needed)
   choco install postgresql
   
   # Or using winget
   winget install PostgreSQL.PostgreSQL
   
   # Or download from https://www.postgresql.org/download/windows/
   ```

   **Create the database and user:**
   ```powershell
   # Create the database
   createdb painar
   
   # If createdb is not in PATH, use full path:
   & "C:\Program Files\PostgreSQL\16\bin\createdb.exe" painar
   
   # Connect to PostgreSQL as superuser to create user and grant permissions
   psql -U postgres -d painar
   ```

   **In the PostgreSQL prompt, run these commands:**
   ```sql
   -- Create user if it doesn't exist
   CREATE USER painar_user WITH PASSWORD 'your_password_here';
   
   -- Grant all privileges on database
   GRANT ALL PRIVILEGES ON DATABASE painar TO painar_user;
   
   -- Enable pgvector extension (required for vector embeddings)
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Grant usage on schema
   GRANT USAGE ON SCHEMA public TO painar_user;
   GRANT CREATE ON SCHEMA public TO painar_user;
   
   -- Exit PostgreSQL prompt
   \q
   ```

   **Set up database structure and run migrations:**
   ```powershell
   # Initialize database schema
   make setup-db
   
   # Run database migrations
   make migrate
   
   # If make is not available, run directly:
   alembic upgrade head
   ```

   **Verify database setup:**
   ```powershell
   # Connect to verify everything is working
   psql -U painar_user -d painar -h localhost -p 5432
   
   # In PostgreSQL prompt, check tables and extensions:
   ```sql
   -- Check if pgvector extension is installed
   \dx
   
   -- List all tables
   \dt
   
   -- Check if required tables exist
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   
   -- Verify vector extension functions
   SELECT proname FROM pg_proc WHERE proname LIKE '%vector%' LIMIT 5;
   
   -- Exit
   \q
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

**PostgreSQL not found in PATH:**
```powershell
# Add PostgreSQL to PATH temporarily
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"

# Or add permanently via System Properties > Environment Variables
# Or use full paths:
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" painar
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

**PostgreSQL service not running:**
```powershell
# Check service status
Get-Service postgresql*

# Start the service
Start-Service postgresql-x64-16

# Set to start automatically
Set-Service postgresql-x64-16 -StartupType Automatic
```

**Database connection errors:**
```powershell
# Verify PostgreSQL is running and accepting connections
Test-NetConnection localhost -Port 5432

# Check if database exists
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -l | Select-String "painar"

# Recreate database if needed
& "C:\Program Files\PostgreSQL\16\bin\dropdb.exe" painar
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" painar
make setup-db
make migrate
```

**Permission denied errors:**
```sql
-- Connect as superuser and grant permissions
-- Connect: psql -U postgres -d painar
GRANT ALL PRIVILEGES ON DATABASE painar TO painar_user;
GRANT USAGE ON SCHEMA public TO painar_user;
GRANT CREATE ON SCHEMA public TO painar_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO painar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO painar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO painar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO painar_user;
```

**Missing pgvector extension:**
```sql
-- Connect to PostgreSQL as superuser
-- psql -U postgres -d painar

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Port 8000 already in use:**
```powershell
# Find process using port 8000
netstat -ano | Select-String ":8000"

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Or run on different port
uvicorn app.main:create_app --port 8001
```

## 📄 Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT and embeddings | *Required* | `sk-...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:password@localhost:5432/painar` | `postgresql+psycopg://painar_user:your_password_here@localhost:5432/painar` |
| `MODEL_NAME` | OpenAI model name | `gpt-4o-mini` | `gpt-4o-mini` |
| `VECTOR_DIM` | Embedding vector dimensions | `1536` | `1536` |
| `DEBUG` | Enable debug mode | `false` | `true` |
| `SECRET_KEY` | Application secret key | `dev-secret-key` | `your-secret-key` |
| `DEV_TOKEN` | Development authentication token | `dev-token` | `dev-token` |
| `LANGSMITH_API_KEY` | LangSmith tracing API key | *Optional* | `ls__...` |
| `SENTRY_DSN` | Sentry error tracking DSN | *Optional* | `https://...` |

**Sample .env file:**
```env
OPENAI_API_KEY=sk-your_openai_api_key_here
DATABASE_URL=postgresql+psycopg://painar_user:your_password_here@localhost:5432/painar
MODEL_NAME=gpt-4o-mini
VECTOR_DIM=1536
DEBUG=true
SECRET_KEY=your-secret-key-here
DEV_TOKEN=dev-token
```

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
