import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../authcontext";
import Login from "./Login";
import Register from "./Register";

export default function Home() {
  // user is null when logged out; isAdmin is true for admins
  const { user, isAdmin } = useAuth();

  // "login" or "register": decides which form shows inside the box
  const [mode, setMode] = useState("login");

  return (
    <section className="landing">
      {/* LEFT: big bold title */}
      <div className="landing-left">
        <h1 className="landing-title">
          <span className="blue">REVIEW</span>
          <span className="pink">SENSE</span>
        </h1>
        <p className="landing-sub">
          A product review platform with instant sentiment analysis
        </p>
      </div>

      {/* RIGHT */}
      <div className="landing-right">
        {user ? (
          <>
            {/* Logged in: replace the login box with a welcome panel */}
            <div className="welcome-box">
              <span className="status-pill">● Logged in</span>
              <h2 className="welcome-title">Hi, {user.name}!</h2>
              <p>Want to review a product?</p>
            </div>

            {/* Arrow 1: go pick a product and write a review */}
            <Link to="/products" className="products-arrow">
              <span>Write a review</span>
              <span className="arrow">→</span>
            </Link>

            {/* Arrow 2: admins get the dashboard, everyone else browses products */}
            {isAdmin ? (
              <Link to="/admin" className="products-arrow alt">
                <span>Admin dashboard</span>
                <span className="arrow">→</span>
              </Link>
            ) : (
              <Link to="/products" className="products-arrow alt">
                <span>Browse products</span>
                <span className="arrow">→</span>
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Logged out: login / sign-up box */}
            <div className="login-box">
              {mode === "login" ? <Login /> : <Register />}

              <p className="switch">
                {mode === "login" ? (
                  <>
                    New user?{" "}
                    <button type="button" className="link-btn" onClick={() => setMode("register")}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" className="link-btn" onClick={() => setMode("login")}>
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>

            <Link to="/products" className="products-arrow">
              <span>Products</span>
              <span className="arrow">→</span>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}