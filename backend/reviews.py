"""Review routes: logged-in users post reviews, anyone can read them."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from extensions import db
from models import Product, Review, User
from sentiment import analyze_sentiment

reviews_bp = Blueprint("reviews", __name__)

MAX_REVIEW_LENGTH = 2000
SENTIMENTS = {"positive", "negative", "neutral"}


SORT_OPTIONS = {
    "newest": (Review.created_at.desc(),),
    "oldest": (Review.created_at.asc(),),
    "highest": (Review.rating.desc(), Review.created_at.desc()),
    "lowest": (Review.rating.asc(), Review.created_at.desc()),
}


def is_whole_number(value):
    # bool is a subclass of int in Python, so True/False must be rejected explicitly
    return isinstance(value, int) and not isinstance(value, bool)


# ---------- POST /api/reviews (login required) ----------
@reviews_bp.post("/reviews")
@jwt_required()
def create_review():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    text = data.get("text")
    rating = data.get("rating")

    # --- validation ---
    if not is_whole_number(product_id):
        return jsonify(error="product_id must be a number"), 400
    if not isinstance(text, str) or not text.strip():
        return jsonify(error="Review text cannot be empty"), 400
    text = text.strip()
    if len(text) > MAX_REVIEW_LENGTH:
        return jsonify(error=f"Review is too long (max {MAX_REVIEW_LENGTH} characters)"), 400
    if not is_whole_number(rating) or not 1 <= rating <= 5:
        return jsonify(error="Rating must be a whole number from 1 to 5"), 400

    # --- the product and the user must really exist ---
    if db.session.get(Product, product_id) is None:
        return jsonify(error="Product not found"), 404
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None:
        return jsonify(error="User no longer exists. Please log in again."), 401

    # --- run the text through VADER and save everything together ---
    review = Review(
        user_id=user.id,
        product_id=product_id,
        text=text,
        rating=rating,
        sentiment_label=analyze_sentiment(text),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review=review.to_dict()), 201


# ---------- GET /api/reviews/<product_id>  (?sentiment=&rating=&sort=) ----------
@reviews_bp.get("/reviews/<int:product_id>")
def list_reviews(product_id):
    if db.session.get(Product, product_id) is None:
        return jsonify(error="Product not found"), 404

    sentiment = (request.args.get("sentiment") or "").strip().lower()
    rating = (request.args.get("rating") or "").strip()
    sort = (request.args.get("sort") or "newest").strip().lower()

    if sentiment and sentiment not in SENTIMENTS:
        return jsonify(error="sentiment must be positive, negative or neutral"), 400
    if rating and (not rating.isdigit() or not 1 <= int(rating) <= 5):
        return jsonify(error="rating must be a number from 1 to 5"), 400
    if sort not in SORT_OPTIONS:
        return jsonify(error="sort must be newest, oldest, highest or lowest"), 400

    # joinedload fetches each reviewer's name in the same query (faster)
    query = Review.query.options(joinedload(Review.user)).filter_by(product_id=product_id)
    if sentiment:
        query = query.filter(Review.sentiment_label == sentiment)
    if rating:
        query = query.filter(Review.rating == int(rating))

    reviews = query.order_by(*SORT_OPTIONS[sort]).all()
    return jsonify(reviews=[r.to_dict() for r in reviews], count=len(reviews)), 200