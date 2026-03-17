#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Lumina backend setup"
echo ""

# [1/5] Check Python version
echo "[1/5] Checking Python version"
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [[ $MAJOR -lt 3 ]] || [[ $MAJOR -eq 3 && $MINOR -lt 11 ]]; then
    echo -e "${RED} Python 3.11+ required (found $PYTHON_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN} Python $PYTHON_VERSION OK ${NC}"
echo ""

# [2/5] Virtual environment
echo "[2/5] Setting up Python virtual environment"
if [ -d "venv" ]; then
    echo "(venv already exists)"
else
    python3 -m venv venv
    echo -e "${GREEN} venv created ${NC}"
fi
source venv/bin/activate
echo "venv activated"
echo ""

# [3/5] Upgrade pip
echo "[3/5] Upgrading pip, setuptools, wheel"
pip install --upgrade pip setuptools wheel --quiet
echo -e "${GREEN} pip upgraded ${NC}"
echo ""

# [4/5] Docker installation check
echo "[4/5] Docker installation check"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found on this system${NC}"
    echo ""
    echo "Docker is required to run the backend services."
    echo ""
    echo -n "Would you like to install Docker now? (y/n) - you need superuser privileges: "
    read -r INSTALL_DOCKER

    if [[ "$INSTALL_DOCKER" == "yes" || "$INSTALL_DOCKER" == "y" || "$INSTALL_DOCKER" == "Y" || "$INSTALL_DOCKER" == "YES" ]]; then
        echo ""
        echo "Installing Docker"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh

        echo ""
        echo "Adding user to docker group"
        sudo usermod -aG docker $USER

        echo -e "${GREEN} Docker installed! ${NC}"
        echo -e "${YELLOW} Please log out and log back in for group changes to take effect. ${NC}"
        echo ""
    else
        echo -e "${YELLOW} Docker installation skipped ${NC}"
        echo "You can install Docker later with:"
        echo "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        echo ""
    fi
else
    docker --version
    echo -e "${GREEN}Docker already installed ${NC}"
fi

# [5/5] Environment configuration
echo ""
echo "[5/5] Environment configuration"

SKIP_ENV=false
if [ -f ".env" ]; then
    echo -e "${YELLOW}.env file already exists${NC}"
    echo -n "Would you like to overwrite it? (y/n): "
    read -r OVERWRITE_ENV
    if [[ "$OVERWRITE_ENV" != "yes" && "$OVERWRITE_ENV" != "y" && "$OVERWRITE_ENV" != "Y" && "$OVERWRITE_ENV" != "YES" ]]; then
        echo -e "${YELLOW}Keeping existing .env file${NC}"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != "true" ]; then
    echo ""
    echo "Please enter the following configuration values:"
    echo "(Press Enter to use the default value shown in brackets)"
    echo ""

    read -rp "  INFOMANIAK_API_KEY      : " INFOMANIAK_API_KEY
    while [ -z "$INFOMANIAK_API_KEY" ]; do
        echo -e "${RED}  INFOMANIAK_API_KEY is required${NC}"
        read -rp "  INFOMANIAK_API_KEY      : " INFOMANIAK_API_KEY
    done

    read -rp "  INFOMANIAK_PRODUCT_ID   : " INFOMANIAK_PRODUCT_ID
    while [ -z "$INFOMANIAK_PRODUCT_ID" ]; do
        echo -e "${RED}  INFOMANIAK_PRODUCT_ID is required${NC}"
        read -rp "  INFOMANIAK_PRODUCT_ID   : " INFOMANIAK_PRODUCT_ID
    done

    read -rp "  INFOMANIAK_MODEL        [mistral-7b]: " INFOMANIAK_MODEL
    INFOMANIAK_MODEL=${INFOMANIAK_MODEL:-mistral-7b}

    read -rp "  CORS_ORIGINS            [http://localhost:8080]: " CORS_ORIGINS
    CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:8080}

    read -rp "  SECRET_KEY              [lumina-swiss-secret-change-me]: " SECRET_KEY
    SECRET_KEY=${SECRET_KEY:-lumina-swiss-secret-change-me}

    cat > .env << EOF
# Infomaniak LLM API
INFOMANIAK_API_KEY=${INFOMANIAK_API_KEY}
INFOMANIAK_PRODUCT_ID=${INFOMANIAK_PRODUCT_ID}
INFOMANIAK_MODEL=${INFOMANIAK_MODEL}

# Security
SECRET_KEY=${SECRET_KEY}

# CORS — comma-separated list of allowed origins
CORS_ORIGINS=${CORS_ORIGINS}

# Database
DATABASE_URL=sqlite:////app/data/rag_lms.db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
EOF

    echo ""
    echo -e "${GREEN}.env file created${NC}"
fi

# Create SQLite database with default admin account
echo ""
echo "Creating SQLite database with default admin account"

mkdir -p data

python3 - << 'PYTHON_SCRIPT'
import sqlite3
import uuid
import os

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("admin1234")
except ImportError:
    # Fallback si passlib pas installé dans le venv
    import subprocess
    subprocess.check_call(["pip", "install", "passlib[bcrypt]", "--quiet"])
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash("admin1234")

db_path = "./data/rag_lms.db"
os.makedirs("./data", exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create users table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        job_function TEXT,
        user_role TEXT DEFAULT 'USER',
        is_active INTEGER DEFAULT 1,
        is_deleted INTEGER DEFAULT 0,
        last_activity DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
    )
""")

# Check if admin already exists
cursor.execute("SELECT id FROM users WHERE email = 'admin@lumina-swiss.ch'")
existing = cursor.fetchone()

if existing:
    print("Admin account already exists — skipping creation")
else:
    admin_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, first_name, last_name, user_role, is_active, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (admin_id, "admin@lumina-swiss.ch", password_hash, "Admin", "Lumina", "ADMIN", 1, 0))
    conn.commit()
    print(f"Admin account created: admin@lumina-swiss.ch / admin1234")

conn.close()
PYTHON_SCRIPT

echo -e "${GREEN}Database ready Default lumina account is :${NC}"
echo "Admin user : admin@lumina-swiss.ch"
echo "Password   : admin1234"
echo ""

# Start docker compose
if command -v docker &> /dev/null; then
    echo -n "Would you like to start API + Qdrant + Redis with docker compose now? (y/n): "
    read -r START_DOCKER_COMPOSE

    if [[ "$START_DOCKER_COMPOSE" == "yes" || "$START_DOCKER_COMPOSE" == "y" || "$START_DOCKER_COMPOSE" == "Y" || "$START_DOCKER_COMPOSE" == "YES" ]]; then
        echo ""
        echo -e "${BLUE}Starting services${NC}"
        docker compose up -d

        echo ""
        echo "Waiting for services to start"
        sleep 5

        echo ""
        echo -e "${BLUE}Checking services status:${NC}"
        docker compose ps

        echo ""
        echo "Testing Qdrant connection"
        if curl -s http://localhost:6333/healthz > /dev/null; then
            echo -e "${GREEN}Qdrant is running!${NC}"
        else
            echo -e "${YELLOW}Qdrant health check failed (might still be starting)${NC}"
        fi

        echo ""
        echo "Testing Redis connection"
        if docker exec redis-pi redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}Redis is running!${NC}"
        else
            echo -e "${YELLOW}Redis health check failed (might still be starting)${NC}"
        fi

        echo ""
        echo -e "${GREEN}Docker services started!${NC}"
        echo ""
    else
        echo -e "${YELLOW}Skipped starting Docker services${NC}"
        echo "Start them later with: docker compose up -d"
        echo ""
    fi
else
    echo -e "${YELLOW}Docker not available yet${NC}"
    echo "Once Docker is installed, start services with: docker compose up -d"
    echo ""
fi

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Create an admin account: POST http://localhost:8000/auth/register"
echo "  2. Access the API docs at:  http://localhost:8000/docs"
echo ""