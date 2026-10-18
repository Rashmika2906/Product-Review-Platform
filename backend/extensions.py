"""Extension objects live here (not in app.py) so models and routes can
import them without causing circular imports."""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()