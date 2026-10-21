import { Link } from "react-router-dom";
import { formatPrice } from "../utils";
import ProductImage from "./productImage";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="card product-card">
      {/* key={image_url} resets the "broken image" memory if the URL changes */}
      <ProductImage key={product.image_url} src={product.image_url} name={product.name} />
      <div className="product-card-body">
        {product.category && <span className="chip">{product.category}</span>}
        <h3>{product.name}</h3>
        <p className="muted clamp">{product.description}</p>
        <p className="price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}