import httpx
import time
import sys
import os

BASE_URL = "http://localhost:8000"

def log(msg):
    print(f"[\033[94mDEMO\033[0m] {msg}")

def run_demo():
    client = httpx.Client(base_url=BASE_URL, timeout=60.0) # Increased timeout for heavy RAG ops
    
    # 1. Register & Login
    email = f"demo_{int(time.time())}@lumina.ch"
    log(f"Registering new user: {email}")
    reg = client.post("/api/register", json={
        "email": email, 
        "password": "password123", 
        "first_name": "Demo", 
        "last_name": "User"
    })
    if reg.status_code != 201:
        print(f"Registration failed ({reg.status_code}): {reg.text}")
        return

    log("Logging in...")
    login = client.post("/api/login", json={"email": email, "password": "password123"})
    if login.status_code != 200:
        print(f"Login failed ({login.status_code}): {login.text}")
        return
        
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Document
    log("Uploading sensitive document (CV)...")
    content = "John Doe, living in Zurich. Email: john.doe@example.com. Phone: +41 79 123 45 67. Deep learning expert."
    files = {"file": ("cv_john.txt", content, "text/plain")}
    up = client.post("/api/documents/upload", headers=headers, files=files)
    if up.status_code != 201:
        print(f"Upload failed ({up.status_code}): {up.text}")
        return
    doc_id = up.json()["doc_id"]
    log(f"Document uploaded. ID: {doc_id}")

    # 3. Wait for Indexing
    log("Waiting for indexing to complete...")
    for _ in range(30):
        status_res = client.get(f"/api/documents/{doc_id}/status", headers=headers)
        if status_res.status_code != 200:
             time.sleep(1)
             continue
        status = status_res.json()["status"]
        if status == "indexed":
            log("\033[92mDocument indexed successfully!\033[0m")
            break
        elif status == "failed":
            log("\033[91mIndexing failed.\033[0m")
            return
        time.sleep(2)
    else:
        log("Indexing timed out or still pending.")
        return

    # 4. Query RAG
    log("Querying the RAG system: 'Who is John Doe?'")
    gen = client.post("/api/generate", headers=headers, json={"prompt": "Who is John Doe?"})
    if gen.status_code == 200:
        data = gen.json()
        print("\n\033[1m--- AI Response ---\033[0m")
        print(data["answer"])
        print("\n\033[1m--- Sources ---\033[0m")
        for src in data["sources"]:
            print(f" - [Doc {src['doc_id']}] (Score: {src['score']:.2f}): {src['text'][:100]}...")
        print("-------------------\n")
    else:
        print(f"Generation failed ({gen.status_code}): {gen.text}")

if __name__ == "__main__":
    try:
        run_demo()
    except Exception as e:
        print(f"Error during demo: {e}")
        sys.exit(1)
