"""Database models. Each class = one table, each attribute = one column."""
from datetime import datetime, timezone
from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)  # never store plain text
    role = db.Column(db.String(20), nullable=False, default="user")  # 'user' or 'admin'
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    reviews = db.relationship("Review", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        db.CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
    )

    def to_dict(self):
        # Note: password_hash is deliberately left out
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    price = db.Column(db.Numeric(10, 2), nullable=False)
    image_url = db.Column(db.String(500))
    category = db.Column(db.String(100), index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    # Deleting a product also deletes its reviews
    reviews = db.relationship("Review", back_populates="product", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "image_url": self.image_url,
            "category": self.category,
            "created_at": self.created_at.isoformat(),
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"),
                           nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    sentiment_label = db.Column(db.String(10), nullable=False)  # positive / negative / neutral
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    user = db.relationship("User", back_populates="reviews")
    product = db.relationship("Product", back_populates="reviews")

    __table_args__ = (
        db.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
        db.CheckConstraint("sentiment_label IN ('positive', 'negative', 'neutral')",
                           name="ck_reviews_sentiment"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "product_id": self.product_id,
            "text": self.text,
            "rating": self.rating,
            "sentiment_label": self.sentiment_label,
            "created_at": self.created_at.isoformat(),
        }