// Small display helpers.

// Prices show in Indian rupees. Change "INR" / "en-IN" for another currency.
export function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}