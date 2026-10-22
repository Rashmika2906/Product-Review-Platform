import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../authcontext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/"); // back to the landing page
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          Product Reviews
        </Link>

        <nav className="nav-links" aria-label="Main">
          {/* Products now lives at /products (the landing page is at /) */}
          <NavLink to="/products" end>
            Products
          </NavLink>
          {/* These two links only exist for admins */}
          {isAdmin && (
            <>
              <NavLink to="/admin" end>
                Dashboard
              </NavLink>
              <NavLink to="/admin/products">Manage products</NavLink>
            </>
          )}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="muted">Hi, {user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}