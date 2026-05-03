// Changed: Added "Edit profile" link, updated button states per spec
// (disabled: grey bg + muted text, enabled: blue bg + glow)
import { useState } from 'react';

export default function ClientForm({ onSubmit, onEditProfile, tradieProfile }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const isValid = name.trim().length > 0 && email.includes('@');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ name: name.trim(), email: email.trim().toLowerCase() });
  };

  return (
    <div>
      <div className="form-header-row">
        <h1>
          <span className="heading-icon">⚡</span>
          New Quote
        </h1>
        {tradieProfile && (
          <button className="edit-profile-link" onClick={onEditProfile}>
            Edit profile
          </button>
        )}
      </div>
      <p className="subheading">
        Enter your client's details, then you'll record the job description.
      </p>

      {tradieProfile && (
        <div className="profile-badge">
          <span className="profile-badge-icon">🔧</span>
          <span>{tradieProfile.businessName} · {tradieProfile.trade} · ${tradieProfile.labourRate}/hr</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="client-name">Client Name <span className="required">*</span></label>
            <input
              id="client-name"
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              autoCapitalize="words"
            />
          </div>

          <div className="field">
            <label htmlFor="client-email">Client Email <span className="required">*</span></label>
            <input
              id="client-email"
              type="email"
              placeholder="e.g. sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="email"
            />
          </div>

          <button
            type="submit"
            className={`btn ${isValid ? 'btn-primary' : 'btn-disabled'}`}
            disabled={!isValid}
            style={{ marginTop: '8px' }}
          >
            {isValid ? 'Next — Record Job →' : 'Fill in details above'}
          </button>
        </form>
      </div>

      <p className="form-footnote">
        📧 Quote PDF emailed to your client instantly
      </p>
    </div>
  );
}
