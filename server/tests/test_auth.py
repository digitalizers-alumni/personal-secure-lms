import pytest

def test_register_user(client):
    response = client.post(
        "/api/register",
        json={"email": "test@example.com", "password": "password123", "first_name": "Test", "last_name": "User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_login_user(client):
    # First, register a user
    email = "login_test@example.com"
    client.post(
        "/api/register",
        json={"email": email, "password": "password123", "first_name": "Login", "last_name": "User"}
    )
    
    # Then login
    response = client.post(
        "/api/login",
        json={"email": email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "role" in data

def test_get_me(client):
    email = "me_test@example.com"
    client.post(
        "/api/register",
        json={"email": email, "password": "password123", "first_name": "Me", "last_name": "User"}
    )
    
    login_res = client.post(
        "/api/login",
        json={"email": email, "password": "password123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == email
