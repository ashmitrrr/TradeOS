// Changed: Accept businessName from tradieProfile instead of env-only,
//          updated branding to BlueCrewAI blue
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function fmt(n) {
  return Number(n).toFixed(2);
}

// HTML-escape user input to prevent injection
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendQuoteEmail({ clientName, clientEmail, quoteData, pdfBuffer, quoteId, businessName }) {
  const fromEmail = process.env.FROM_EMAIL || 'quotes@bluecrewai.com';
  const biz = esc(businessName || process.env.BUSINESS_NAME || 'TradeOS');

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:#1a1a1a;padding:24px 32px;">
    <span style="color:#1B6AE4;font-size:24px;font-weight:900;letter-spacing:-0.5px;">${biz}</span>
  </div>

  <div style="padding:32px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:16px;">Your Quote is Ready</h2>

    <p style="color:#444;line-height:1.6;margin-bottom:12px;">Hi ${esc(clientName)},</p>
    <p style="color:#444;line-height:1.6;margin-bottom:24px;">
      Thank you for your enquiry. Please find your quote attached to this email (PDF).
    </p>

    <div style="background:#EBF0FB;border-left:4px solid #1B6AE4;padding:16px 20px;border-radius:0 6px 6px 0;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#666;font-size:12px;padding:3px 0;">Quote Reference</td>
          <td style="color:#1a1a1a;font-weight:700;font-size:12px;text-align:right;">${quoteId}</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:3px 0;">Total (inc. GST)</td>
          <td style="color:#1B6AE4;font-weight:900;font-size:18px;text-align:right;">$${fmt(quoteData.totalIncGST)} AUD</td>
        </tr>
        <tr>
          <td style="color:#666;font-size:12px;padding:3px 0;">Valid for</td>
          <td style="color:#1a1a1a;font-weight:700;font-size:12px;text-align:right;">${quoteData.validDays || 30} days</td>
        </tr>
      </table>
    </div>

    <p style="color:#444;line-height:1.6;margin-bottom:24px;">${esc(quoteData.jobSummary)}</p>

    <p style="color:#444;line-height:1.6;">
      If you have any questions about this quote, please get in touch.<br><br>
      Kind regards,<br>
      <strong style="color:#1a1a1a;">${biz}</strong>
    </p>
  </div>

  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;">
    <p style="color:#aaa;font-size:11px;margin:0;">
      Quote generated with <a href="https://bluecrewai.com" style="color:#1B6AE4;text-decoration:none;">BlueCrewAI</a>
      &mdash; AI Built for Tradies
    </p>
  </div>

</div>`;

  await resend.emails.send({
    from: fromEmail,
    to: clientEmail,
    subject: `Your Quote from ${biz} — ${quoteId}`,
    html,
    attachments: [
      {
        filename: `Quote-${quoteId}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
}
