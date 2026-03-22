export default function MetricCard({ title, value, subtitle, accent = 'var(--color-primary)' }) {
  return (
    <article className="metric-card card">
      <p className="metric-title">{title}</p>
      <p className="metric-value" style={{ color: accent }}>{value}</p>
      {subtitle ? <p className="metric-subtitle">{subtitle}</p> : null}
    </article>
  );
}
