"""Authentication: register, login, and the admin-only decorator."""
import re
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db, jwt
from models import User

# A Blueprint is a "mini app" that groups related routes together
auth_bp = Blueprint("auth", __name__)

# Very simple email shape check: something@something.something
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------- Friendly JSON errors for token problems ----------
@jwt.unauthorized_loader
def missing_token(reason):
    return jsonify(error="Missing or malformed token. Please log in."), 401


@jwt.invalid_token_loader
def invalid_token(reason):
    return jsonify(error="Invalid token. Please log in again."), 401


@jwt.expired_token_loader
def expired_token(header, payload):
    return jsonify(error="Token expired. Please log in again."), 401


# ---------- Reusable guard for admin-only routes ----------
def admin_required(fn):
    """Put @admin_required under a route to block everyone except admins."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()                    # 1. is there a valid token?
        if get_jwt().get("role") != "admin":       # 2. does the badge say admin?
            return jsonify(error="Admin access required"), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------- POST /api/register ----------
@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # Validate input
    if not name or not email or not password:
        return jsonify(error="name, email and password are required"), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Please enter a valid email address"), 400
    if len(password) < 6:
        return jsonify(error="Password must be at least 6 characters"), 400

    # Email must be unique
    if User.query.filter_by(email=email).first():
        return jsonify(error="This email is already registered"), 409

    # New accounts are ALWAYS "user". Admins are promoted manually in the DB.
    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),  # never store plain text
        role="user",
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(message="Registration successful", user=user.to_dict()), 201


# ---------- POST /api/login ----------
@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify(error="email and password are required"), 400

    user = User.query.filter_by(email=email).first()
    # Same message for wrong email OR wrong password, so attackers learn nothing
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify(error="Invalid email or password"), 401

    # The token carries the user's id and role (the "badge")
    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )
    return jsonify(access_token=token, user=user.to_dict()), 200


# ---------- GET /api/me (handy for testing a token) ----------
@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None:
        return jsonify(error="User not found"), 404
    return jsonify(user=user.to_dict()), 200