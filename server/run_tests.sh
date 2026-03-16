#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}>>> Starting LuminaSwiss Test Suite${NC}"

# Ensure we are in the server directory
cd "$(dirname "$0")"

# 1. Run Backend Integration Tests
echo -e "\n${BLUE}1. Running Integration Tests (pytest)...${NC}"
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:.
pytest tests/ -v

echo -e "\n${GREEN}>>> Integration Tests Passed!${NC}"

# 2. Run End-to-End Demo (Requires a running server)
echo -e "\n${BLUE}2. Running E2E Demo (scripts/demo_e2e.py)...${NC}"
echo -e "${BLUE}Check if server is already running...${NC}"

if curl -s http://localhost:8000/health > /dev/null; then
    python scripts/demo_e2e.py
else
    echo -e "${BLUE}Server not detected. Starting temporary server for demo...${NC}"
    (python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/demo_api.log 2>&1 &)
    (celery -A app.worker.celery_app worker --loglevel=info --concurrency=1 --pool=solo > /tmp/demo_worker.log 2>&1 &)
    
    echo -e "${BLUE}Waiting for services to warm up...${NC}"
    sleep 10
    
    python scripts/demo_e2e.py
    
    echo -e "${BLUE}Cleaning up temporary services...${NC}"
    lsof -ti:8000 | xargs kill -9 || true
    ps aux | grep -i celery | grep -v grep | awk '{print $2}' | xargs kill -9 || true
fi

echo -e "\n${GREEN}>>> All Tests and Demos Completed Successfully!${NC}"
