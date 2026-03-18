import sqlite3
import uuid
import os
import subprocess
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