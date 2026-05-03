// Changed: Accept tradieProfile (logo, businessName, paymentTerms),
//          show logo in PDF header, use edited line items, add BlueCrewAI footer
import puppeteer from 'puppeteer';

export async function generatePDF({ quoteData, clientName, clientEmail, quoteId, quoteDate, tradieProfile }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Railway/Docker
  });

  try {
    const page = await browser.newPage();
    const html = buildQuoteHTML({ quoteData, clientName, clientEmail, quoteId, quoteDate, tradieProfile });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function fmt(n) {
  return Number(n).toFixed(2);
}

// HTML-escape user input to prevent XSS
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildQuoteHTML({ quoteData, clientName, clientEmail, quoteId, quoteDate, tradieProfile }) {
  const businessName = esc(tradieProfile?.businessName || process.env.BUSINESS_NAME || 'TradeOS');
  const paymentTerms = esc(tradieProfile?.paymentTerms || '14 days');
  const logoBase64 = tradieProfile?.logoBase64 || null;

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (quoteData.validDays || 30));
  const expiryStr = expiry.toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const itemRows = quoteData.items
    .map(
      (item) => `
      <tr>
        <td class="desc">${esc(item.description)}</td>
        <td class="num">${esc(item.quantity)} ${esc(item.unit)}</td>
        <td class="num">$${fmt(item.unitPrice)}</td>
        <td class="num bold">$${fmt(item.subtotal)}</td>
      </tr>`
    )
    .join('');

  // Build the logo/brand section for the header
  const brandSection = logoBase64
    ? `<div style="display:flex;align-items:center;gap:14px;">
         <img src="${logoBase64}" alt="${businessName}" style="max-height:60px;width:auto;border-radius:6px;" />
         <div>
           <div class="brand">${businessName}</div>
           <div class="brand-sub">Professional Trade Quoting</div>
         </div>
       </div>`
    : `<div>
         <div class="brand">${businessName}</div>
         <div class="brand-sub">Professional Trade Quoting</div>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    line-height: 1.5;
  }

  /* ─── Header bar ─── */
  .header {
    background: #1a1a1a;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand { color: #1B6AE4; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
  .brand-sub { color: #888; font-size: 10px; margin-top: 2px; }
  .quote-badge { text-align: right; }
  .quote-badge h2 { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 2px; }
  .quote-badge .qid { color: #1B6AE4; font-size: 11px; margin-top: 4px; font-weight: 600; }

  /* ─── Body ─── */
  .body { padding: 28px 32px; }

  /* ─── Meta grid ─── */
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e8e8e8; }
  .meta-block h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #1B6AE4; margin-bottom: 6px; font-weight: 700; }
  .meta-block .main { font-size: 13px; font-weight: 700; }
  .meta-block .sub { font-size: 11px; color: #666; }

  /* ─── Job summary callout ─── */
  .summary-box {
    background: #EBF0FB;
    border-left: 4px solid #1B6AE4;
    padding: 12px 16px;
    margin-bottom: 22px;
    border-radius: 0 4px 4px 0;
    font-size: 12px;
    color: #444;
  }
  .summary-box strong { color: #1a1a1a; }

  /* ─── Line items table ─── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th {
    background: #1B6AE4;
    color: #fff;
    padding: 9px 12px;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }
  thead th.num { text-align: right; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #efefef; vertical-align: top; }
  td.desc { width: 52%; }
  td.num { text-align: right; white-space: nowrap; }
  td.bold { font-weight: 700; }

  /* ─── Totals ─── */
  .totals { margin-left: auto; width: 260px; border-top: 1px solid #e8e8e8; padding-top: 12px; }
  .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .total-row.subtotal { color: #555; }
  .total-row.gst-row { color: #777; border-bottom: 1px solid #e8e8e8; padding-bottom: 10px; margin-bottom: 4px; }
  .total-row.grand {
    font-size: 16px;
    font-weight: 900;
    padding-top: 8px;
    color: #1a1a1a;
  }
  .total-row.grand span:last-child { color: #1B6AE4; }

  /* ─── Notes ─── */
  .notes { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e8e8e8; }
  .notes h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 8px; }
  .notes p { font-size: 11px; color: #666; }

  /* ─── Footer ─── */
  .footer {
    margin-top: 36px;
    text-align: center;
    font-size: 10px;
    color: #bbb;
    border-top: 1px solid #eee;
    padding-top: 14px;
  }
  .footer strong { color: #1B6AE4; }
</style>
</head>
<body>

<div class="header">
  ${brandSection}
  <div class="quote-badge">
    <h2>QUOTE</h2>
    <div class="qid">${quoteId}</div>
  </div>
</div>

<div class="body">

  <div class="meta">
    <div class="meta-block">
      <h3>Prepared For</h3>
      <div class="main">${esc(clientName)}</div>
      <div class="sub">${esc(clientEmail)}</div>
    </div>
    <div class="meta-block">
      <h3>From</h3>
      <div class="main">${businessName}</div>
      <div class="sub">Payment terms: ${paymentTerms}</div>
    </div>
    <div class="meta-block">
      <h3>Quote Date</h3>
      <div class="main">${quoteDate}</div>
    </div>
    <div class="meta-block">
      <h3>Valid Until</h3>
      <div class="main">${expiryStr}</div>
      <div class="sub">${quoteData.validDays || 30} days from issue</div>
    </div>
    ${quoteData.jobAddress ? `
    <div class="meta-block">
      <h3>Job Location</h3>
      <div class="main">${esc(quoteData.jobAddress)}</div>
    </div>` : ''}
  </div>

  <div class="summary-box">
    <strong>Scope of work:</strong> ${esc(quoteData.jobSummary)}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty / Unit</th>
        <th class="num">Unit Price</th>
        <th class="num">Subtotal (ex. GST)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row subtotal">
      <span>Subtotal (ex. GST)</span>
      <span>$${fmt(quoteData.subtotalExGST)}</span>
    </div>
    <div class="total-row gst-row">
      <span>GST (10%)</span>
      <span>$${fmt(quoteData.gst)}</span>
    </div>
    <div class="total-row grand">
      <span>TOTAL (inc. GST)</span>
      <span>$${fmt(quoteData.totalIncGST)} AUD</span>
    </div>
  </div>

  ${quoteData.notes ? `
  <div class="notes">
    <h3>Notes &amp; Conditions</h3>
    <p>${esc(quoteData.notes)}</p>
  </div>` : ''}

  <div class="footer">
    Quote generated with <strong>BlueCrewAI</strong> · bluecrewai.com ·
    This quote is valid for ${quoteData.validDays || 30} days from the date of issue.
    All prices in AUD and include GST where indicated.
  </div>

</div>
</body>
</html>`;
}
