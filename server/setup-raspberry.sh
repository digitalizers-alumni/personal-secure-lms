#!/bin/bash

# Automated setup script for Raspberry Pi BGE-M3 + Qdrant + Testing

set -e  # Exit on error

echo "Raspberry Pi RAG Setup"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo "[1/5] Checking Python version"
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

# Compare python versions
if [[ $MAJOR -lt 3 ]] || [[ $MAJOR -eq 3 && $MINOR -lt 9 ]]; then
    echo -e "${RED} Python 3.9+ required (found $PYTHON_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN} Python $PYTHON_VERSION OK ${NC}"
echo ""

# Create virtual environment
echo "[2/5] Setting up Python virtual environment"
if [ -d "venv" ]; then
    echo "(venv already exists)"
else
    python3 -m venv venv
    echo -e "${GREEN} venv created ${NC}"
fi

# Activate venv
source venv/bin/activate
echo "venv activated"
echo ""

# Upgrade pip
echo "[3/5] Upgrading pip, setuptools, wheel"
pip install --upgrade pip setuptools wheel --quiet
echo -e "${GREEN} pip upgraded ${NC}"
echo ""

# Install requirements
echo "[4/5] Installing dependencies for bge-m3 model and creating data directories for qdrant, redis and models"
pip install sentence-transformers --quiet
mkdir -p data/qdrant data/redis data/models data/documents
echo -e "${GREEN} Dependencies installed ${NC}"
echo ""

# Check Docker is installed
echo "[5/5] Docker installation check"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found on this system${NC}"
    echo ""
    echo "Docker is required to run Qdrant vector database."
    echo ""
    echo -n "Would you like to install Docker now? (y/n) - you need to have superuser privilegies : "
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

# Ask if user wants to download BGE-M3 model
echo ""
echo -n "Would you like to download BGE-M3 model now? (y/n) - This will take ~1.5GB and 5-10 minutes : "
read -r DOWNLOAD_MODEL

if [[ "$DOWNLOAD_MODEL" == "yes" || "$DOWNLOAD_MODEL" == "y" || "$DOWNLOAD_MODEL" == "Y" || "$DOWNLOAD_MODEL" == "YES" ]]; then
    echo ""
    echo -e "${BLUE}Downloading BGE-M3 model${NC}"
    echo ""
    
    # Make sure venv is activated
    source venv/bin/activate
    
    # Run the download script
    python rag/download_model.py
    
    echo ""
    echo -e "${GREEN}BGE-M3 model downloaded successfully! ${NC}"
    echo ""
else
    echo -e "${YELLOW}Model download skipped ${NC}"
    echo "You can download it later with:"
    echo "   $ source venv/bin/activate"
    echo "   $ python download_model.py"
    echo ""
fi

echo -e "${GREEN}Setup complete! ${NC}"
echo ""
echo "Next steps:"
echo "Import sample pdfs"
echo ""
echo "Run full test:"
echo "   $ python test_rag_with_pdfs.py"

# Ask if user wants to start docker compose now
if command -v docker &> /dev/null; then
    echo -n "Would you like to start API + Qdrant + Redis with docker compose now ? Before you might need to reboot to be able to use docker compose (y/n): "
    read -r START_DOCKER_COMPOSE
    
    if [[ "$START_DOCKER_COMPOSE" == "yes" || "$START_DOCKER_COMPOSE" == "y" || "$START_DOCKER_COMPOSE" == "Y" || "$START_DOCKER_COMPOSE" == "YES" ]]; then
        echo ""
        echo -e "${BLUE}Starting Qdrant + Redis ${NC}"
        docker compose -f docker-compose-raspberry.yml up -d
        
        echo ""
        echo "Waiting for services to start"
        sleep 5
        
        echo ""
        echo -e "${BLUE} Checking services status:${NC}"
        docker compose -f docker-compose-raspberry.yml ps
        
        echo ""
        echo "Testing Qdrant connection"
        if curl -s http://localhost:6333/health > /dev/null; then
            echo -e "${GREEN}Qdrant is running! ${NC}"
        else
            echo -e "${YELLOW}Qdrant health check failed (might still be starting) ${NC}"
        fi
        
        echo ""
        echo "Testing Redis connection"
        if docker exec redis-pi redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}Redis is running! ${NC}"
        else
            echo -e "${YELLOW}Redis health check failed (might still be starting) ${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}Docker services started! ${NC}"
        echo ""
    else
        echo -e "${YELLOW}ℹ Skipped starting Docker services ${NC}"
        echo "Start them later with: $ docker-compose -f docker-compose-raspberry.yml up -d"
        echo ""
    fi
else
    echo -e "${YELLOW}Docker not available yet ${NC}"
    echo "Once Docker is installed, start services with : $ docker-compose -f docker-compose-raspberry.yml up -d"
    echo ""
fi