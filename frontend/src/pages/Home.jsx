import { useState } from "react";
import { Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";

export default function Home() {
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

      {/* RIGHT: login box, then the products arrow */}
      <div className="landing-right">
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
      </div>
    </section>
  );
}