import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useApi } from "../useApi";

export default function Products() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");

  // Wait 300ms after the last keystroke before asking the server (saves needless requests)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (category) params.set("category", category);
  const query = params.toString();

  const products = useApi(`/products${query ? `?${query}` : ""}`);

  // A second, unfiltered request just to fill the category dropdown
  const everything = useApi("/products");
  const categories = useMemo(() => {
    const names = (everything.data?.products ?? []).map((p) => p.category).filter(Boolean);
    return [...new Set(names)].sort();
  }, [everything.data]);

  return (
    <>
      <h1>Products</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search products…"
          aria-label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {products.loading && <p className="muted">Loading products…</p>}
      {products.error && (
        <p className="alert alert-error" role="alert">
          {products.error}
        </p>
      )}
      {products.data && products.data.products.length === 0 && (
        <p className="muted">No products found{query ? " for that search" : " yet"}.</p>
      )}
      {products.data && (
        <div className="grid">
          {products.data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}