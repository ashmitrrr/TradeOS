// Changed: New file — Tradie profile setup form (Part A of Step 1)
// Shown only on first use, stores profile in localStorage
import { useState, useRef } from 'react';

const TRADE_OPTIONS = [
  'Plumber',
  'Electrician',
  'Landscaper',
  'Builder',
  'Painter',
  'Carpenter',
  'Tiler',
  'Concreter',
  'Cleaner',
  'Pest Control',
  'HVAC / Air Conditioning',
  'Pool Maintenance',
  'Other',
];

const PAYMENT_OPTIONS = [
  '7 days',
  '14 days',
  '30 days',
  'On completion',
  '50% upfront + 50% on completion',
];

export default function TradieProfileForm({ onSave }) {
  const [businessName, setBusinessName] = useState('');
  const [trade, setTrade] = useState('');
  const [labourRate, setLabourRate] = useState('');
  const [calloutFee, setCalloutFee] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('14 days');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const fileInputRef = useRef(null);

  const isValid = businessName.trim().length > 0 && trade && labourRate;

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoBase64(ev.target.result);
      setLogoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const profile = {
      businessName: businessName.trim(),
      trade,
      labourRate: Number(labourRate),
      calloutFee: calloutFee ? Number(calloutFee) : 0,
      paymentTerms,
      logoBase64: logoBase64 || null,
    };

    localStorage.setItem('tradieProfile', JSON.stringify(profile));
    onSave(profile);
  };

  return (
    <div>
      <h1>
        <span className="heading-icon">🔧</span>
        Set Up Your Profile
      </h1>
      <p className="subheading">
        Tell us about your business so every quote has your rates, branding, and payment terms baked in.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="biz-name">Your Business Name <span className="required">*</span></label>
            <input
              id="biz-name"
              type="text"
              placeholder="e.g. Mitchell Plumbing"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="trade-select">Your Trade <span className="required">*</span></label>
            <select
              id="trade-select"
              className="select-input"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            >
              <option value="" disabled>Select your trade…</option>
              {TRADE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="labour-rate">Hourly Labour Rate <span className="required">*</span></label>
              <div className="input-with-affix">
                <span className="input-prefix">$</span>
                <input
                  id="labour-rate"
                  type="number"
                  placeholder="e.g. 145"
                  value={labourRate}
                  onChange={(e) => setLabourRate(e.target.value)}
                  min="0"
                  step="1"
                  className="affixed-input"
                />
                <span className="input-suffix">/hr</span>
              </div>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="callout-fee">Callout / Travel Fee</label>
              <div className="input-with-affix">
                <span className="input-prefix">$</span>
                <input
                  id="callout-fee"
                  type="number"
                  placeholder="e.g. 150"
                  value={calloutFee}
                  onChange={(e) => setCalloutFee(e.target.value)}
                  min="0"
                  step="1"
                  className="affixed-input"
                />
              </div>
              <p className="field-hint">Leave blank if none</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="payment-terms">Payment Terms</label>
            <select
              id="payment-terms"
              className="select-input"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            >
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Your Logo <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <div className="logo-upload-area" onClick={() => fileInputRef.current?.click()}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  <span style={{ fontSize: '24px' }}>📷</span>
                  <span>Tap to upload logo</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn ${isValid ? 'btn-primary' : 'btn-disabled'}`}
            disabled={!isValid}
          >
            {isValid ? 'Save Profile →' : 'Fill in required fields above'}
          </button>
        </form>
      </div>

      <p className="form-footnote">
        You only need to do this once. Change anytime in settings.
      </p>
    </div>
  );
}
