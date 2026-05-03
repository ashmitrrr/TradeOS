// Changed: New file — Supabase client + saveQuote + getQuotes helpers
import { createClient } from '@supabase/supabase-js';

// Silently skip if env vars not set — never block the main quote flow
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    : null;

export async function saveQuote({ quoteNumber, clientName, clientEmail, businessName, items, subtotal, gst, total }) {
  if (!supabase) {
    console.log('[supabase] Not configured — skipping quote save');
    return;
  }
  try {
    const { error } = await supabase.from('quotes').insert([{
      quote_number: quoteNumber,
      client_name: clientName,
      client_email: clientEmail,
      business_name: businessName,
      items,
      subtotal,
      gst,
      total,
    }]);
    if (error) console.error('[supabase] Save error:', error.message);
  } catch (err) {
    console.error('[supabase] Unexpected error:', err.message);
  }
}

export async function getQuotes(businessName) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('business_name', businessName)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabase] Fetch error:', err.message);
    return [];
  }
}
