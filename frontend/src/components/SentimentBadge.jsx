// Green / red / gray pill. The word is shown too, so the meaning never depends on colour alone.
const LABELS = { positive: "Positive", negative: "Negative", neutral: "Neutral" };

export default function SentimentBadge({ sentiment }) {
  return <span className={`badge badge-${sentiment}`}>{LABELS[sentiment] || sentiment}</span>;
}