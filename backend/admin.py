"""Admin routes. Every route here requires an admin token."""
from flask import Blueprint, jsonify
from sqlalchemy import func

from auth import admin_required
from extensions import db
from models import Product, Review

admin_bp = Blueprint("admin", __name__)

SENTIMENTS = ("positive", "negative", "neutral")


def percentages(counts, total):
    """Turn counts into percentages (0 when there are no reviews yet)."""
    if total == 0:
        return {f"{s}_pct": 0.0 for s in SENTIMENTS}
    return {f"{s}_pct": round(counts[s] * 100 / total, 1) for s in SENTIMENTS}


def build_summary(rows, avg_ratings):
    """rows: (product_id, product_name, sentiment_label or None, count) tuples.
    avg_ratings: {product_id: average rating}. Returns the JSON-ready summary."""
    products = {}
    for product_id, name, label, count in rows:
        entry = products.setdefault(product_id, {
            "product_id": product_id,
            "product_name": name,
            "positive": 0, "negative": 0, "neutral": 0,
        })
        if label in SENTIMENTS:  # label is None for products with no reviews
            entry[label] = count

    overall = {s: 0 for s in SENTIMENTS}
    for entry in products.values():
        entry["total"] = sum(entry[s] for s in SENTIMENTS)
        entry.update(percentages(entry, entry["total"]))
        entry["avg_rating"] = avg_ratings.get(entry["product_id"])
        for s in SENTIMENTS:
            overall[s] += entry[s]

    overall_total = sum(overall.values())
    overall["total"] = overall_total
    overall.update(percentages(overall, overall_total))
    return {"overall": overall, "products": list(products.values())}


# ---------- GET /api/admin/sentiment-summary (admin only) ----------
@admin_bp.get("/admin/sentiment-summary")
@admin_required
def sentiment_summary():
    # One row per (product, sentiment). The outer join keeps products with 0 reviews.
    rows = (
        db.session.query(Product.id, Product.name, Review.sentiment_label, func.count(Review.id))
        .outerjoin(Review, Review.product_id == Product.id)
        .group_by(Product.id, Product.name, Review.sentiment_label)
        .order_by(Product.name)
        .all()
    )
    avg_ratings = {
        product_id: round(float(avg), 1)
        for product_id, avg in db.session.query(Review.product_id, func.avg(Review.rating))
        .group_by(Review.product_id)
        .all()
    }
    return jsonify(build_summary(rows, avg_ratings)), 200