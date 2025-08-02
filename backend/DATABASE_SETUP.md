# PostgreSQL Database Setup for PainAR Backend

## Prerequisites

1. **Install PostgreSQL 16+** from [postgresql.org](https://www.postgresql.org/downloads/)
2. **Install pgvector extension** - This is REQUIRED for vector operations

### Installing pgvector on Windows:

**Option 1: Download pre-compiled binary**
1. Go to [pgvector releases](https://github.com/pgvector/pgvector/releases)
2. Download the Windows binary for your PostgreSQL version
3. Extract and copy files to your PostgreSQL installation directory

**Option 2: Using Scoop (easiest)**
```powershell
# Install Scoop if not already installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install pgvector
scoop bucket add extras
scoop install pgvector
```

**Option 3: Using Docker (recommended for development)**
```bash
# Stop your local PostgreSQL and use Docker instead
docker run --name painar-postgres \
  -e POSTGRES_DB=painar \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1412 \
  -p 5432:5432 \
  -d pgvector/pgvector:pg17
```

**Option 4: Compile from source**
```powershell
# Install build tools
choco install msys2 cmake

# Clone and build pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector
# Follow Windows build instructions in their README
```

## Database Setup Commands

### 1. Start PostgreSQL Service

**Windows (if using PostgreSQL installer):**
```cmd
# Start PostgreSQL service
net start postgresql-x64-16

# Or use Services.msc to start "postgresql-x64-16" service
```

**Windows (if using chocolatey/scoop):**
```powershell
# Start PostgreSQL
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

**macOS (using Homebrew):**
```bash
# Start PostgreSQL service
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Connect to PostgreSQL and Create Database

**Option A: Using psql command line**
```bash
# Connect as postgres superuser
psql -U postgres -h localhost

# In the psql prompt, run these commands:
CREATE DATABASE painar;
CREATE USER painarus WITH PASSWORD '1412';
GRANT ALL PRIVILEGES ON DATABASE painar TO painarus;

# Connect to the painar database
\c painar

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify extension is installed
\dx

# Exit psql
\q
```

**Option B: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `painar`
5. Owner: `postgres` (or create a new user)
6. Click "Save"
7. Right-click on the `painar` database → "Query Tool"
8. Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### 3. Update Your Environment File

Your `.env` file should have the correct connection string:

```env
# For asyncpg (recommended for async operations)
DATABASE_URL=postgresql+asyncpg://postgres:1412@localhost:5432/painar

# For psycopg (alternative)
# DATABASE_URL=postgresql+psycopg://postgres:1412@localhost:5432/painar
```

### 4. Test Database Connection

**Test with psql:**
```bash
psql -U postgres -h localhost -d painar -c "SELECT version();"
```

**Test with Python:**
```python
# Run this from your backend directory with virtual environment activated
python -c "
import asyncio
import asyncpg

async def test_connection():
    try:
        conn = await asyncpg.connect('postgresql://postgres:1412@localhost:5432/painar')
        result = await conn.fetchval('SELECT version()')
        print(f'Connected! PostgreSQL version: {result}')
        await conn.close()
    except Exception as e:
        print(f'Connection failed: {e}')

asyncio.run(test_connection())
"
```

## Running Database Migrations

Once PostgreSQL is set up and your virtual environment is activated:

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Initialize Alembic (if not done already)
alembic init migrations

# Create initial migration
alembic revision --autogenerate -m "Initial tables"

# Run migrations
alembic upgrade head
```

## Troubleshooting

### Common Issues:

1. **"psql: error: connection to server at localhost (127.0.0.1), port 5432 failed"**
   - PostgreSQL service is not running
   - Check if PostgreSQL is installed correctly
   - Verify the port (default is 5432)

2. **"database 'painar' does not exist"**
   - Create the database using the commands above

3. **"extension 'vector' is not available"**
   ```sql
   # Install pgvector extension (run as superuser)
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **"authentication failed for user"**
   - Check username/password in your .env file
   - Make sure the user exists and has proper permissions

### Windows-specific Setup:

If you don't have PostgreSQL installed:

```powershell
# Using Chocolatey
choco install postgresql16

# Using Scoop
scoop install postgresql

# Or download installer from postgresql.org
```

### Verify Everything Works:

```bash
# Test the full stack
cd backend
python -c "
import asyncio
from app.db.core import create_extension, create_tables

async def setup():
    await create_extension()
    await create_tables()
    print('Database setup complete!')

asyncio.run(setup())
"
```

## Alternative: Using Docker (Optional)

If you prefer using Docker for PostgreSQL:

```bash
# Run PostgreSQL with pgvector in Docker
docker run --name painar-postgres \
  -e POSTGRES_DB=painar \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1412 \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16

# Your DATABASE_URL would be:
# DATABASE_URL=postgresql+asyncpg://postgres:1412@localhost:5432/painar
```
