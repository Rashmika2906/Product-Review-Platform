import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Register from "./pages/Register";

// The navbar stays on every page; <Routes> swaps the content below it.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin-only pages */}
          <Route
            path="/admin"
            element={
              <RequireAuth adminOnly>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/products"
            element={
              <RequireAuth adminOnly>
                <AdminProducts />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}