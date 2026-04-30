function fmt(n) {
  return Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuoteResult({ quote, quoteId, clientName, onNewQuote }) {
  return (
    <div>
      <div style={{ textAlign: 'center', paddingTop: '8px', paddingBottom: '24px' }}>
        <div className="success-icon" role="img" aria-label="Success">✅</div>
        <h1>Quote Sent!</h1>
        <p className="subheading" style={{ marginTop: '8px' }}>
          The PDF has been emailed to <strong>{clientName}</strong>.
        </p>
      </div>

      <div className="quote-summary">
        {/* Header — quote ID + total */}
        <div className="quote-summary-header">
          <div>
            <div className="quote-id">{quoteId}</div>
            <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>
              Valid {quote.validDays || 30} days
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="quote-total">${fmt(quote.totalIncGST)}</div>
            <div className="quote-total-label">inc. GST · AUD</div>
          </div>
        </div>

        {/* Job summary */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
          {quote.jobSummary}
          {quote.jobAddress && (
            <span style={{ display: 'block', marginTop: '4px', color: '#999', fontSize: '12px' }}>
              📍 {quote.jobAddress}
            </span>
          )}
        </div>

        {/* Line items */}
        <div className="items-list">
          {quote.items.map((item, i) => (
            <div className="item-row" key={i}>
              <span className="item-desc">
                {item.description}
                <span style={{ display: 'block', fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {item.quantity} {item.unit} × ${fmt(item.unitPrice)}
                </span>
              </span>
              <span className="item-price">${fmt(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="gst-row">
          <span>Subtotal (ex. GST)</span>
          <span>${fmt(quote.subtotalExGST)}</span>
        </div>
        <div className="gst-row" style={{ borderBottom: '1px solid #e8e8e8' }}>
          <span>GST (10%)</span>
          <span>${fmt(quote.gst)}</span>
        </div>
        <div className="total-row-ui">
          <span>Total (inc. GST)</span>
          <span>${fmt(quote.totalIncGST)} AUD</span>
        </div>
      </div>

      {quote.notes && (
        <div className="card" style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          <strong style={{ color: '#1a1a1a', display: 'block', marginBottom: '6px' }}>Notes</strong>
          {quote.notes}
        </div>
      )}

      <button className="btn btn-primary" onClick={onNewQuote} style={{ marginTop: '8px' }}>
        New Quote
      </button>
    </div>
  );
}
