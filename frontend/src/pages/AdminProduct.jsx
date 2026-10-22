import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../useApi";
import { formatPrice } from "../utils";

const EMPTY = { name: "", description: "", price: "", image_url: "", category: "" };

/** Admin screen: add, edit and delete products. (The server re-checks the admin role on every call.) */
export default function AdminProducts() {
  const list = useApi("/products");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null); // null = the form adds a new product
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      image_url: product.image_url || "",
      category: product.category || "",
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: "PUT", body: form });
        setNotice("Product updated.");
      } else {
        await api("/products", { method: "POST", body: form });
        setNotice("Product added.");
      }
      setEditingId(null);
      setForm(EMPTY);
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}" and all of its reviews? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api(`/products/${product.id}`, { method: "DELETE" });
      if (editingId === product.id) cancelEdit();
      setNotice(`Deleted "${product.name}".`);
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Manage products</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit product" : "Add a product"}</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="p-name">Name</label>
            <input id="p-name" name="name" required maxLength={200} value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="p-price">Price</label>
            <input id="p-price" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="p-category">Category</label>
            <input id="p-category" name="category" maxLength={100} value={form.category} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="p-image">Image URL</label>
            <input id="p-image" name="image_url" type="url" maxLength={500} placeholder="https://…" value={form.image_url} onChange={handleChange} />
          </div>
        </div>
        <label htmlFor="p-desc">Description</label>
        <textarea id="p-desc" name="description" rows={3} value={form.description} onChange={handleChange} />

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
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All products</h2>
      {list.loading && <p className="muted">Loading products…</p>}
      {list.data && list.data.products.length === 0 && <p className="muted">No products yet. Add your first one above.</p>}
      {list.data && list.data.products.length > 0 && (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.data.products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{p.category || "–"}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td className="actions">
                    <button type="button" className="btn btn-ghost" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => handleDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}