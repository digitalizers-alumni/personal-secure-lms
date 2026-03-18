import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.getcwd())

from app.db.database import SessionLocal, engine, Base
from app.models.users import User, UserRole
from app.api.core.security import get_password_hash

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin_email = "admin@lumina-swiss.ch"
        db_user = db.query(User).filter(User.email == admin_email).first()
        
        if not db_user:
            print(f"Creating seed user: {admin_email}")
            new_user = User(
                email=admin_email,
                password_hash=get_password_hash("admin1234"),
                first_name="Admin",
                last_name="Portal",
                user_role=UserRole.ADMIN,
                is_active=True
            )
            db.add(new_user)
        else:
            print(f"Updating existing seed user: {admin_email}")
            db_user.password_hash = get_password_hash("admin1234")
            db_user.user_role = UserRole.ADMIN
            db_user.is_active = True
        
        db.commit()
        print("Seed complete.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed()
