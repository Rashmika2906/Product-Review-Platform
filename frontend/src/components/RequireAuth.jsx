import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";

/**
 * Wrap a page in <RequireAuth> to keep out anonymous visitors,
 * or <RequireAuth adminOnly> to keep out everyone except admins.
 * (The real protection is on the server; this just gives a friendly screen.)
 */
export default function RequireAuth({ adminOnly = false, children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted">Checking your login…</p>;

  if (!user) {
    // Send them to the login page, and remember where they wanted to go
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="card center">
        <h2>Admins only</h2>
        <p className="muted">Your account does not have permission to view this page.</p>
        <Link to="/" className="btn btn-primary">
          Back to products
        </Link>
      </div>
    );
  }

  return children;
}