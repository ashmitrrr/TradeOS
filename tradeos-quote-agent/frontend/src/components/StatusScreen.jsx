export default function StatusScreen({ title, subtitle, variant }) {
  return (
    <div className="status-screen status-screen--dark">
      {variant === 'generating' ? (
        <div className="pulse-dots" role="status" aria-label="Loading">
          <span /><span /><span />
        </div>
      ) : (
        <div className="spinner-dark" role="status" aria-label="Loading" />
      )}
      <h2 className="status-title status-title--white">{title}</h2>
      <p className="status-sub status-sub--muted">{subtitle}</p>
    </div>
  );
}
