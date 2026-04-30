import { useState } from 'react';

export default function ClientForm({ onSubmit }) {
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
      <h1>New Quote</h1>
      <p className="subheading">
        Enter your client's details, then you'll record the job description.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="client-name">Client Name</label>
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
            <label htmlFor="client-email">Client Email</label>
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
            className="btn btn-primary"
            disabled={!isValid}
            style={{ marginTop: '8px' }}
          >
            Next — Record Job
          </button>
        </form>
      </div>

      <p style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>
        The quote PDF will be emailed directly to your client.
      </p>
    </div>
  );
}
