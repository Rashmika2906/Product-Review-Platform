"""Product routes: everyone can browse/search, only admins can add/edit/delete."""
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_

from auth import admin_required
from extensions import db
from models import Product, Review

products_bp = Blueprint("products", __name__)


def validate_product(data, partial=False):
    """Check the incoming JSON. Returns (clean_fields, error_message).
    partial=True (used by PUT) means the client may send only some fields."""
    clean = {}

    # --- name ---
    if "name" in data or not partial:
        name = data.get("name")
        if not isinstance(name, str) or not name.strip():
            return None, "Product name is required"
        if len(name.strip()) > 200:
            return None, "Product name is too long (max 200 characters)"
        clean["name"] = name.strip()

    # --- price ---
    if "price" in data or not partial:
        try:
            price = Decimal(str(data.get("price")))
        except InvalidOperation:
            return None, "Price must be a number"
        if not price.is_finite() or price < 0 or price > Decimal("99999999.99"):
            return None, "Price must be between 0 and 99999999.99"
        clean["price"] = price.quantize(Decimal("0.01"))

    # --- optional text fields ---
    for field, limit in (("description", None), ("image_url", 500), ("category", 100)):
        if field in data:
            value = data.get(field)
            if value is None:
                value = ""
            if not isinstance(value, str):
                return None, f"{field} must be text"
            value = value.strip()
            if limit and len(value) > limit:
                return None, f"{field} is too long (max {limit} characters)"
            # description is never NULL; the other two are NULL when empty
            clean[field] = value if field == "description" else (value or None)

    return clean, None


# ---------- GET /api/products  (?search=mouse&category=Electronics) ----------
@products_bp.get("/products")
def list_products():
    query = Product.query

    search = (request.args.get("search") or "").strip()
    category = (request.args.get("category") or "").strip()

    if search:
        like = f"%{search}%"  # ilike = case-insensitive "contains"
        query = query.filter(or_(Product.name.ilike(like), Product.description.ilike(like)))
    if category:
        query = query.filter(func.lower(Product.category) == category.lower())

    products = query.order_by(Product.created_at.desc()).all()
    return jsonify(products=[p.to_dict() for p in products]), 200


# ---------- GET /api/products/<id> ----------
@products_bp.get("/products/<int:product_id>")
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify(error="Product not found"), 404

    # Review count and average rating for the detail page header
    count, avg = (
        db.session.query(func.count(Review.id), func.avg(Review.rating))
        .filter(Review.product_id == product_id)
        .one()
    )
    data = product.to_dict()
    data["review_count"] = count
    data["avg_rating"] = round(float(avg), 1) if avg is not None else None
    return jsonify(product=data), 200


# ---------- POST /api/products (admin only) ----------
@products_bp.post("/products")
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    clean, error = validate_product(data)
    if error:
        return jsonify(error=error), 400

    product = Product(**clean)
    db.session.add(product)
    db.session.commit()
    return jsonify(product=product.to_dict()), 201


# ---------- PUT /api/products/<id> (admin only) ----------
@products_bp.put("/products/<int:product_id>")
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify(error="Product not found"), 404

    data = request.get_json(silent=True) or {}
    clean, error = validate_product(data, partial=True)
    if error:
        return jsonify(error=error), 400
    if not clean:
        return jsonify(error="No valid fields to update"), 400

    for field, value in clean.items():
        setattr(product, field, value)
    db.session.commit()
    return jsonify(product=product.to_dict()), 200


# ---------- DELETE /api/products/<id> (admin only) ----------
@products_bp.delete("/products/<int:product_id>")
@admin_required
def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify(error="Product not found"), 404

    db.session.delete(product)  # its reviews are deleted too (cascade)
    db.session.commit()
    return jsonify(message="Product deleted"), 200