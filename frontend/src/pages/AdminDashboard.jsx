import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../useApi";

// Same three colours as the badges on the product page
const COLORS = { positive: "#16a34a", negative: "#dc2626", neutral: "#6b7280" };
const LABELS = { positive: "Positive", negative: "Negative", neutral: "Neutral" };
const SENTIMENTS = ["positive", "negative", "neutral"];

export default function AdminDashboard() {
  const { data, error, loading } = useApi("/admin/sentiment-summary");

  if (loading) return <p className="muted">Loading dashboard…</p>;
  if (error) {
    return (
      <p className="alert alert-error" role="alert">
        {error}
      </p>
    );
  }

  const { overall, products } = data;

  // Pie: share of each sentiment across ALL reviews
  const pieData = SENTIMENTS.map((s) => ({ name: LABELS[s], value: overall[s], fill: COLORS[s] }));

  // Stacked bars: one row per product, each row adds up to 100%
  const barData = products.map((p) => ({
    name: p.product_name,
    positive_pct: p.positive_pct,
    negative_pct: p.negative_pct,
    neutral_pct: p.neutral_pct,
  }));

  return (
    <>
      <h1>Sentiment dashboard</h1>

      <div className="stat-row">
        <div className="card stat">
          <span className="muted">Total reviews</span>
          <strong>{overall.total}</strong>
        </div>
        {SENTIMENTS.map((s) => (
          <div key={s} className="card stat">
            <span className="muted">{LABELS[s]}</span>
            <strong style={{ color: COLORS[s] }}>{overall[`${s}_pct`]}%</strong>
            <span className="muted small">{overall[s]} reviews</span>
          </div>
        ))}
      </div>

      {overall.total === 0 ? (
        <p className="card muted">No reviews yet, so there is nothing to chart.</p>
      ) : (
        <div className="chart-grid">
          <section className="card">
            <h2>Overall sentiment</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2} />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="card">
            <h2>Sentiment by product (%)</h2>
            <ResponsiveContainer width="100%" height={Math.max(180, 70 + products.length * 46)}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="positive_pct" name="Positive" stackId="s" fill={COLORS.positive} />
                <Bar dataKey="negative_pct" name="Negative" stackId="s" fill={COLORS.negative} />
                <Bar dataKey="neutral_pct" name="Neutral" stackId="s" fill={COLORS.neutral} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}

      <h2>Per-product numbers</h2>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviews</th>
              <th>Avg rating</th>
              <th>Positive</th>
              <th>Negative</th>
              <th>Neutral</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td>
                  <Link to={`/products/${p.product_id}`}>{p.product_name}</Link>
                </td>
                <td>{p.total}</td>
                <td>{p.avg_rating ?? "–"}</td>
                <td>{p.positive_pct}%</td>
                <td>{p.negative_pct}%</td>
                <td>{p.neutral_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}