export default function StatusScreen({ title, subtitle }) {
  return (
    <div className="status-screen">
      <div className="spinner" role="status" aria-label="Loading" />
      <h2 className="status-title">{title}</h2>
      <p className="status-sub">{subtitle}</p>
    </div>
  );
}
