// Changed: Simplified — email already sent at this point (from review screen),
//          show confirmation with quote summary
function fmt(n) {
  return Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuoteResult({ quote, quoteId, clientName, clientEmail, onNewQuote }) {
  return (
    <div>
      <div className="success-banner">
        <span className="success-icon-large">✅</span>
        <h1 style={{ justifyContent: 'center' }}>Quote Sent!</h1>
        <p className="subheading" style={{ textAlign: 'center', marginBottom: '8px' }}>
          PDF emailed to <strong>{clientName}</strong>
        </p>
        {clientEmail && (
          <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
            {clientEmail}
          </p>
        )}
      </div>

      <div className="quote-summary">
        {/* Dark header — quote number + total */}
        <div className="quote-summary-header">
          <div>
            <div className="quote-id">{quoteId}</div>
            <div style={{ color: '#777', fontSize: '11px', marginTop: '4px' }}>
              Valid {quote.validDays || 30} days
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="quote-total">${fmt(quote.totalIncGST)}</div>
            <div className="quote-total-label">inc. GST · AUD</div>
          </div>
        </div>

        {/* Job summary */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #F2F4F8',
          fontSize: '13px',
          color: '#555',
          lineHeight: '1.6',
        }}>
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
        <div className="gst-row" style={{ borderBottom: '1px solid #DDE3EF' }}>
          <span>GST (10%)</span>
          <span>${fmt(quote.gst)}</span>
        </div>
        <div className="total-row-ui">
          <span>TOTAL</span>
          <span>${fmt(quote.totalIncGST)} AUD</span>
        </div>
      </div>

      {quote.notes && (
        <div className="card" style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
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
