import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth-context";
import ProductImage from "../components/productImage";
import SentimentBadge from "../components/SentimentBadge";
import { StarInput, Stars } from "../components/Stars";
import { useApi } from "../useApi";
import { formatDate, formatPrice } from "../utils";

const MAX_LENGTH = 2000; // same limit the backend enforces
const DEFAULT_FILTERS = { sentiment: "", rating: "", sort: "newest" };

/** The "write a review" box. Only rendered for logged-in users. */
function ReviewForm({ productId, onPosted }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    // Check the basics here first so the user gets instant feedback
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    if (!text.trim()) {
      setError("Please write a few words about the product.");
      return;
    }

    setBusy(true);
    try {
      const data = await api("/reviews", { method: "POST", body: { product_id: productId, rating, text } });
      setRating(0);
      setText("");
      setNotice(`Thanks! Your review was analysed as ${data.review.sentiment_label}.`);
      onPosted();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card review-form" onSubmit={handleSubmit}>
      <h3>Write a review</h3>
      <StarInput value={rating} onChange={setRating} />

      <label htmlFor="review-text">Your review</label>
      <textarea
        id="review-text"
        rows={4}
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What did you like or dislike?"
      />
      <p className="muted small">
        {text.length}/{MAX_LENGTH}
      </p>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert alert-ok" role="status">
          {notice}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const product = useApi(`/products/${id}`);

  // Turn the chosen filters into "?sentiment=negative&sort=highest" for the backend
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const reviews = useApi(`/reviews/${id}${query ? `?${query}` : ""}`);

  function updateFilter(name, value) {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handlePosted() {
    // Show the new review (clear filters that might hide it) and refresh the average rating
    setFilters(DEFAULT_FILTERS);
    product.reload();
    reviews.reload();
  }

  if (product.loading) return <p className="muted">Loading product…</p>;
  if (product.error) {
    return (
      <div className="card center">
        <h2>Product not found</h2>
        <p className="muted">{product.error}</p>
        <Link to="/" className="btn btn-primary">
          Back to products
        </Link>
      </div>
    );
  }

  const p = product.data.product;

  return (
    <>
      <Link to="/" className="back-link">
        ← All products
      </Link>

      <section className="card product-detail">
        <ProductImage key={p.image_url} src={p.image_url} name={p.name} className="detail-img" />
        <div>
          {p.category && <span className="chip">{p.category}</span>}
          <h1>{p.name}</h1>
          <p className="price big">{formatPrice(p.price)}</p>
          <p className="rating-line">
            <Stars value={p.avg_rating} />
            <span className="muted">
              {p.avg_rating ? `${p.avg_rating} average` : "No ratings yet"} · {p.review_count} review
              {p.review_count === 1 ? "" : "s"}
            </span>
          </p>
          <p className="description">{p.description}</p>
        </div>
      </section>

      <section>
        <h2>Reviews</h2>

        {user ? (
          <ReviewForm productId={Number(id)} onPosted={handlePosted} />
        ) : (
          <p className="card">
            <Link to="/login" state={{ from: `/products/${id}` }}>
              Log in
            </Link>{" "}
            to write a review.
          </p>
        )}

        <div className="toolbar">
          <select aria-label="Filter by sentiment" value={filters.sentiment} onChange={(e) => updateFilter("sentiment", e.target.value)}>
            <option value="">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
          <select aria-label="Filter by rating" value={filters.rating} onChange={(e) => updateFilter("rating", e.target.value)}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <select aria-label="Sort reviews" value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rating</option>
            <option value="lowest">Lowest rating</option>
          </select>
        </div>

        {reviews.loading && <p className="muted">Loading reviews…</p>}
        {reviews.error && (
          <p className="alert alert-error" role="alert">
            {reviews.error}
          </p>
        )}
        {reviews.data && reviews.data.reviews.length === 0 && (
          <p className="muted">{query === "sort=newest" ? "No reviews yet. Be the first!" : "No reviews match these filters."}</p>
        )}
        {reviews.data && (
          <ul className="review-list">
            {reviews.data.reviews.map((review) => (
              <li key={review.id} className="card review">
                <div className="review-head">
                  <strong>{review.user_name}</strong>
                  <Stars value={review.rating} />
                  <SentimentBadge sentiment={review.sentiment_label} />
                  <span className="muted small">{formatDate(review.created_at)}</span>
                </div>
                <p className="review-text">{review.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}