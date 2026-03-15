import pytest
import io
from app.models.documents import Document

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

def test_upload_document(client):
    token = get_token(client, "uploader@example.com")
    file_content = b"Test document content"
    
    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.txt", file_content, "text/plain")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert "doc_id" in data

def test_list_documents_only_owned(client):
    token_a = get_token(client, "user_a@example.com")
    token_b = get_token(client, "user_b@example.com")
    
    # User A uploads
    client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("file_a.txt", b"file a content", "text/plain")}
    )
    
    # User B uploads
    client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token_b}"},
        files={"file": ("file_b.txt", b"file b content", "text/plain")}
    )
    
    # User A lists
    res_a = client.get("/api/documents/", headers={"Authorization": f"Bearer {token_a}"})
    assert len(res_a.json()) == 1
    assert res_a.json()[0]["filename"] == "file_a.txt"
    
    # User B lists
    res_b = client.get("/api/documents/", headers={"Authorization": f"Bearer {token_b}"})
    assert len(res_b.json()) == 1
    assert res_b.json()[0]["filename"] == "file_b.txt"

def test_document_security_idor(client):
    token_a = get_token(client, "user_a_sec@example.com")
    token_b = get_token(client, "user_b_sec@example.com")
    
    # User A uploads
    up_res = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token_a}"},
        files={"file": ("secret.txt", b"top secret", "text/plain")}
    )
    doc_id = up_res.json()["doc_id"]
    
    # User B tries to access User A's document
    status_res = client.get(
        f"/api/documents/{doc_id}/status",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert status_res.status_code == 404 # Should be hidden
    
    # User B tries to delete User A's document
    del_res = client.delete(
        f"/api/documents/{doc_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert del_res.status_code == 404 # Should fail
