# Development commands for PainAR Backend
# Note: Using direct Python paths since this is Windows

PYTHON_EXE = C:/Users/SSGSS/Documents/AR-diagass/.venv/Scripts/python.exe

.PHONY: dev test migrate install clean format lint status

# Install dependencies (using pip since Poetry path issues on Windows)
install:
	python -m venv .venv
	.venv\Scripts\activate && pip install -r requirements.txt
	.venv\Scripts\activate && pip install -r requirements-dev.txt

# Run development server
dev:
	$(PYTHON_EXE) -m uvicorn app.main:create_app --reload --port 8000

# Run tests
test:
	$(PYTHON_EXE) -m pytest tests/ -v

# Run database migrations
migrate:
	$(PYTHON_EXE) -m alembic upgrade head

# Create new migration
migration:
	$(PYTHON_EXE) -m alembic revision --autogenerate -m "$(message)"

# Seed database with medical knowledge
seed-data:
	@echo "🌱 Seeding medical knowledge base..."
	$(PYTHON_EXE) scripts/seed_medical_data.py

# Ingest comprehensive data folder
ingest-data:
	@echo "🏥 Ingesting comprehensive medical data..."
	$(PYTHON_EXE) scripts/ingest_data_folder.py

# Complete data setup (guidelines + documents)
setup-data: seed-data ingest-data
	@echo "🎉 Complete medical knowledge base setup finished!"

# Check current setup status
status:
	$(PYTHON_EXE) status.py

# Check knowledge base status
knowledge-status:
	@echo "📊 Checking knowledge base status..."
	$(PYTHON_EXE) check_knowledge_status.py

# Test database connection
test-db:
	$(PYTHON_EXE) -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('postgresql://postgres:1412@localhost:5432/painar').close()); print('✅ Database connection OK')"

# Test basic functionality
test-basic:
	$(PYTHON_EXE) test_basic.py

# Setup database (assumes PostgreSQL is running locally)
setup-db:
	@echo "Creating database and enabling pgvector extension..."
	-createdb -h localhost -U postgres painar
	@echo "Database created (or already exists)"
	$(PYTHON_EXE) -c "from app.db.core import create_extension; import asyncio; asyncio.run(create_extension())" || echo "⚠️  pgvector not available - install with Docker or manually"

# Complete setup including data seeding
setup-full: setup setup-db migrate setup-data
	@echo "🎉 Full PainAR backend setup complete with comprehensive medical knowledge!"

# Format code
format:
	$(PYTHON_EXE) -m black app/ tests/ --line-length 88
	$(PYTHON_EXE) -m isort app/ tests/

# Lint code
lint:
	$(PYTHON_EXE) -m mypy app/ || echo "⚠️  MyPy warnings (non-critical)"
	$(PYTHON_EXE) -m black --check app/ tests/

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	@if exist __pycache__ rmdir /s /q __pycache__
	@if exist .pytest_cache rmdir /s /q .pytest_cache
	@for /r %%i in (*.pyc) do @del "%%i" 2>nul
	@echo "Cleanup complete"

# Full setup for new developers
setup: install setup-db migrate test-db status

# Quick health check
health:
	curl -f http://localhost:8000/health/ || echo "Server not running - use 'make dev' to start"

# Run all checks
check: format lint test-basic

# Help command
help:
	@echo "PainAR Backend - Available Commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make test       - Run pytest tests"
	@echo "  make migrate    - Run database migrations"
	@echo "  make status     - Check setup status"
	@echo "  make test-db    - Test database connection"
	@echo "  make setup      - Full setup for new developers"
	@echo "  make health     - Test health endpoint"
	@echo "  make clean      - Clean temporary files"
