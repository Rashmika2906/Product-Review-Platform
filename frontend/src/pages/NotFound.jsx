import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card center">
      <h2>Page not found</h2>
      <p className="muted">That address does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to products
      </Link>
    </div>
  );
}