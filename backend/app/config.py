import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:SQL123@127.0.0.1:3306/telecare_db"
)
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_telecare_jwt_key_2026_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
UPLOAD_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",")

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

