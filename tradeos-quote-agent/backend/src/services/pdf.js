import puppeteer from 'puppeteer';

export async function generatePDF({ quoteData, clientName, clientEmail, quoteId, quoteDate }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Railway/Docker
  });

  try {
    const page = await browser.newPage();
    const html = buildQuoteHTML({ quoteData, clientName, clientEmail, quoteId, quoteDate });

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

function buildQuoteHTML({ quoteData, clientName, clientEmail, quoteId, quoteDate }) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (quoteData.validDays || 30));
  const expiryStr = expiry.toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const itemRows = quoteData.items
    .map(
      (item) => `
      <tr>
        <td class="desc">${item.description}</td>
        <td class="num">${item.quantity} ${item.unit}</td>
        <td class="num">$${fmt(item.unitPrice)}</td>
        <td class="num bold">$${fmt(item.subtotal)}</td>
      </tr>`
    )
    .join('');

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
  .brand { color: #E8521A; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
  .brand-sub { color: #888; font-size: 10px; margin-top: 2px; }
  .quote-badge { text-align: right; }
  .quote-badge h2 { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 2px; }
  .quote-badge .qid { color: #E8521A; font-size: 11px; margin-top: 4px; font-weight: 600; }

  /* ─── Body ─── */
  .body { padding: 28px 32px; }

  /* ─── Meta grid ─── */
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e8e8e8; }
  .meta-block h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #E8521A; margin-bottom: 6px; font-weight: 700; }
  .meta-block .main { font-size: 13px; font-weight: 700; }
  .meta-block .sub { font-size: 11px; color: #666; }

  /* ─── Job summary callout ─── */
  .summary-box {
    background: #fdf4f0;
    border-left: 4px solid #E8521A;
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
    background: #E8521A;
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
  .total-row.grand span:last-child { color: #E8521A; }

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
  .footer strong { color: #E8521A; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">TradeOS</div>
    <div class="brand-sub">Professional Trade Quoting</div>
  </div>
  <div class="quote-badge">
    <h2>QUOTE</h2>
    <div class="qid">${quoteId}</div>
  </div>
</div>

<div class="body">

  <div class="meta">
    <div class="meta-block">
      <h3>Prepared For</h3>
      <div class="main">${clientName}</div>
      <div class="sub">${clientEmail}</div>
    </div>
    <div class="meta-block">
      <h3>From</h3>
      <div class="main">[Your Business Name]</div>
      <div class="sub">[Your Phone] · [Your Email]</div>
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
      <div class="main">${quoteData.jobAddress}</div>
    </div>` : ''}
  </div>

  <div class="summary-box">
    <strong>Scope of work:</strong> ${quoteData.jobSummary}
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
    <p>${quoteData.notes}</p>
  </div>` : ''}

  <div class="footer">
    Quote generated by <strong>TradeOS</strong> · tradeos.com.au ·
    This quote is valid for ${quoteData.validDays || 30} days from the date of issue.
    All prices in AUD and include GST where indicated.
  </div>

</div>
</body>
</html>`;
}
