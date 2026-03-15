import httpx
import json

BASE_URL = "http://localhost:8000"

def get_token():
    # Helper to get a token for testing
    with httpx.Client(base_url=BASE_URL) as client:
        # Register if needed
        client.post("/api/register", json={
            "email": "course_test@example.com",
            "password": "password123",
            "first_name": "Course",
            "last_name": "Tester"
        })
        # Login
        res = client.post("/api/login", json={
            "email": "course_test@example.com",
            "password": "password123"
        })
        return res.json()["access_token"]

def test_course_gen():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("[TEST] Requesting course generation for 'Quantum Computing'...")
    with httpx.Client(base_url=BASE_URL, timeout=120.0) as client:
        res = client.post("/api/courses/generate", headers=headers, json={
            "topic": "Quantum Computing",
            "learning_goal": "Understand qubits and entanglement",
            "difficulty": "Débutant",
            "passing_score": 70
        })
        
        if res.status_code == 200:
            data = res.json()
            print("\n[SUCCESS] Course Generated!")
            print(f"Title: {data['title']}")
            print(f"Quiz Questions: {len(data['quiz'])}")
            print(f"Reward: {data['reward_title']}")
            
            # Basic validation
            assert len(data['quiz']) == 10
            for q in data['quiz']:
                assert len(q['options']) == 4
                assert q['correct_answer'] in q['options']
            print("[PASSED] Structure validation successful.")
        else:
            print(f"\n[FAILED] Status {res.status_code}")
            print(res.text)

if __name__ == "__main__":
    test_course_gen()
