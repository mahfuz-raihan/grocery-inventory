import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from src.config import settings


def get_password_hash(password: str) -> str:
    """
    Hashes a password for storage.
    Pre-hashes with SHA-256 to produce a fixed 64-char hex string, which
    completely sidesteps bcrypt's 72-byte input limit for long passwords.
    """
    safe_password = hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(safe_password, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a stored bcrypt hash."""
    safe_password = hashlib.sha256(plain_password.encode("utf-8")).hexdigest().encode("utf-8")
    return bcrypt.checkpw(safe_password, hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    """Creates a signed JWT access token with an expiry claim."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )