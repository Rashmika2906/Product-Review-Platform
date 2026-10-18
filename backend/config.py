"""Central configuration. Every secret comes from environment variables."""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env into os.environ


class Config:
    # PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/dbname
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # saves memory, we don't need it

    # Secret used to sign JWT tokens
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # Which frontend origin may call this API (CORS)
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")