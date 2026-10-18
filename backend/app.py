"""Flask application factory."""
from flask import Flask, jsonify
from auth import auth_bp
from products import products_bp
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from reviews import reviews_bp
from admin import admin_bp
from config import Config
from extensions import db, jwt
import models  # noqa: F401  (import so SQLAlchemy knows about the tables)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Fail fast if required env vars are missing
    if not app.config["SQLALCHEMY_DATABASE_URI"] or not app.config["JWT_SECRET_KEY"]:
        raise RuntimeError("Set DATABASE_URL and JWT_SECRET_KEY in backend/.env")

    # Connect extensions to this app
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})

    # Blueprints (routes) will be registered here in the next steps:
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(reviews_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")
    @app.get("/")
    def home():
        return jsonify(message="Product Review API is running", health="/api/health")
    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    # Return JSON (not HTML) for every error so the React app can read it
    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify(error=err.description), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        app.logger.exception(err)
        return jsonify(error="Internal server error"), 500

    # Create tables if they don't exist yet
    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)