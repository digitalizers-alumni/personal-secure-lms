import pytest
from unittest.mock import patch

def get_token(client, email):
    client.post(
        "/api/register",
        json={"email": email, "password": "password123", "first_name": "User", "last_name": "Test"}
    )
    login_res = client.post(
        "/api/login",
        json={"email": email, "password": "password123"}
    )
    return login_res.json()["access_token"]

@patch("app.api.routes.generate.run_rag_pipeline")
def test_generate_rag(mock_rag, client):
    token = get_token(client, "rag_user@example.com")
    
    # Mock the RAG response
    mock_rag.return_value = {
        "answer": "The capital of France is Paris.",
        "keywords": ["France", "Paris", "Capital"],
        "sources": [
            {"text": "Paris is the capital and largest city of France.", "doc_id": 1, "score": 0.95}
        ]
    }
    
    response = client.post(
        "/api/generate",
        headers={"Authorization": f"Bearer {token}"},
        json={"prompt": "What is the capital of France?"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "Paris" in data["answer"]
    assert "sources" in data
    assert len(data["sources"]) > 0
    assert data["sources"][0]["doc_id"] == 1
