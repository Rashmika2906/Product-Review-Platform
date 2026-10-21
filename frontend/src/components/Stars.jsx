const FIVE = [1, 2, 3, 4, 5];

/** Read-only stars, e.g. <Stars value={4} /> shows ★★★★☆ */
export function Stars({ value }) {
  const filled = Math.round(value || 0);
  return (
    <span className="stars" role="img" aria-label={`${value ?? 0} out of 5 stars`}>
      {FIVE.map((n) => (
        <span key={n} className={n <= filled ? "star on" : "star"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/** Clickable stars for the review form. */
export function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Your rating">
      {FIVE.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={n <= value ? "star on" : "star"}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}