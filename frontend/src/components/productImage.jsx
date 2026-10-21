import { useState } from "react";

/** Shows the product photo, or a letter tile when there is no URL or the link is broken. */
export default function ProductImage({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`img-placeholder ${className}`} aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img className={className} src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />;
}