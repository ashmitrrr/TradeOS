// Changed: New file — Editable quote review screen (Change 3)
// Tradie can edit line items, add/remove rows, then send when ready
import { useState, useCallback } from 'react';

function fmt(n) {
  return Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function QuoteEditor({ quote, quoteId, clientName, clientEmail, onSend, onBack }) {
  const [items, setItems] = useState(() =>
    quote.items.map((item, i) => ({ ...item, _key: `item-${i}` }))
  );
  const [sending, setSending] = useState(false);
  const [jobSummary] = useState(quote.jobSummary);
  const [notes, setNotes] = useState(quote.notes || '');

  // Recalculate totals from current items
  const subtotalExGST = items.reduce((sum, item) => {
    const sub = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + sub;
  }, 0);
  const gst = Math.round(subtotalExGST * 0.1 * 100) / 100;
  const totalIncGST = Math.round((subtotalExGST + gst) * 100) / 100;

  const updateItem = useCallback((key, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: value };
        // Recalculate subtotal when qty or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.subtotal = Math.round((Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0) * 100) / 100;
        }
        return updated;
      })
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((item) => item._key !== key));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        _key: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'each',
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  }, []);

  const handleSend = async () => {
    setSending(true);
    // Build clean quote data from edited items (strip _key)
    const editedQuote = {
      ...quote,
      items: items.map(({ _key, ...rest }) => ({
        ...rest,
        quantity: Number(rest.quantity) || 0,
        unitPrice: Number(rest.unitPrice) || 0,
        subtotal: Math.round((Number(rest.quantity) || 0) * (Number(rest.unitPrice) || 0) * 100) / 100,
      })),
      subtotalExGST: Math.round(subtotalExGST * 100) / 100,
      gst,
      totalIncGST,
      notes,
    };
    await onSend(editedQuote);
  };

  return (
    <div className="editor-screen">
      {/* ─── Quote Header Card ─── */}
      <div className="editor-header">
        <div>
          <div className="editor-qid">{quoteId}</div>
          <div className="editor-client">{clientName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="editor-total">${fmt(totalIncGST)}</div>
          <div className="editor-total-label">inc. GST · AUD</div>
        </div>
      </div>

      {/* ─── Job Summary ─── */}
      {jobSummary && (
        <div className="editor-summary">
          <strong>Scope:</strong> {jobSummary}
          {quote.jobAddress && (
            <span className="editor-address">📍 {quote.jobAddress}</span>
          )}
        </div>
      )}

      {/* ─── Editable Line Items ─── */}
      <div className="editor-items">
        <div className="editor-items-header">
          <span style={{ flex: 2 }}>Description</span>
          <span style={{ width: '70px', textAlign: 'center' }}>Qty</span>
          <span style={{ width: '100px', textAlign: 'center' }}>Unit $</span>
          <span style={{ width: '90px', textAlign: 'right' }}>Subtotal</span>
          <span style={{ width: '36px' }}></span>
        </div>

        {items.map((item) => (
          <div className="editor-item-row" key={item._key}>
            {/* Desktop layout */}
            <div className="editor-item-desktop">
              <input
                type="text"
                className="editor-input editor-input-desc"
                value={item.description}
                onChange={(e) => updateItem(item._key, 'description', e.target.value)}
                placeholder="Item description"
              />
              <input
                type="number"
                className="editor-input editor-input-qty"
                value={item.quantity}
                onChange={(e) => updateItem(item._key, 'quantity', e.target.value)}
                min="0"
                step="0.5"
              />
              <div className="editor-input-price-wrap">
                <span className="editor-dollar">$</span>
                <input
                  type="number"
                  className="editor-input editor-input-price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item._key, 'unitPrice', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="editor-item-subtotal">
                ${fmt((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
              </div>
              <button
                className="editor-remove-btn"
                onClick={() => removeItem(item._key)}
                title="Remove line item"
              >
                ×
              </button>
            </div>

            {/* Mobile layout */}
            <div className="editor-item-mobile">
              <input
                type="text"
                className="editor-input"
                value={item.description}
                onChange={(e) => updateItem(item._key, 'description', e.target.value)}
                placeholder="Item description"
                style={{ width: '100%', marginBottom: '8px' }}
              />
              <div className="editor-mobile-row">
                <div className="editor-mobile-field">
                  <span className="editor-mobile-label">Qty</span>
                  <input
                    type="number"
                    className="editor-input"
                    value={item.quantity}
                    onChange={(e) => updateItem(item._key, 'quantity', e.target.value)}
                    min="0"
                    step="0.5"
                  />
                </div>
                <div className="editor-mobile-field">
                  <span className="editor-mobile-label">Unit $</span>
                  <div className="editor-input-price-wrap">
                    <span className="editor-dollar">$</span>
                    <input
                      type="number"
                      className="editor-input editor-input-price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item._key, 'unitPrice', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="editor-mobile-subtotal">
                  <span className="editor-mobile-label">Subtotal</span>
                  <span className="editor-item-subtotal">
                    ${fmt((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                  </span>
                </div>
                <button
                  className="editor-remove-btn"
                  onClick={() => removeItem(item._key)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-outline editor-add-btn" onClick={addItem}>
          + Add line item
        </button>
      </div>

      {/* ─── Totals ─── */}
      <div className="editor-totals">
        <div className="editor-total-row">
          <span>Subtotal (ex. GST)</span>
          <span>${fmt(subtotalExGST)}</span>
        </div>
        <div className="editor-total-row" style={{ borderBottom: '1px solid #DDE3EF' }}>
          <span>GST (10%)</span>
          <span>${fmt(gst)}</span>
        </div>
        <div className="editor-total-row editor-grand-total">
          <span>TOTAL</span>
          <span>${fmt(totalIncGST)} AUD</span>
        </div>
      </div>

      {/* ─── Notes ─── */}
      <div className="field" style={{ marginTop: '16px' }}>
        <label htmlFor="quote-notes">Notes & Conditions</label>
        <textarea
          id="quote-notes"
          className="text-fallback"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, conditions, assumptions…"
          style={{ minHeight: '70px' }}
        />
      </div>

      {/* ─── Actions ─── */}
      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={sending || items.length === 0}
        style={{ marginTop: '16px' }}
      >
        {sending ? 'Sending…' : 'Send Quote →'}
      </button>
      <button className="btn btn-secondary" onClick={onBack}>
        ← Back to Voice
      </button>

      <p className="form-footnote" style={{ marginTop: '12px' }}>
        ✉️ Quote will be emailed to <strong>{clientEmail}</strong>
      </p>
    </div>
  );
}
