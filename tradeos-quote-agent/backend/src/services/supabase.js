// Changed: Uses shared supabase client. Added getProfile, updateProfile.
//          saveQuote includes user_id. getQuotes queries by user_id.
import supabase from '../lib/supabaseClient.js';

// ── Profile ──

export async function getProfile(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[supabase] getProfile error:', err.message);
    return null;
  }
}

export async function updateProfile(userId, profile) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        business_name: profile.businessName,
        trade: profile.trade,
        labour_rate: profile.labourRate,
        callout_fee: profile.calloutFee || 0,
        payment_terms: profile.paymentTerms || '14 days',
        logo_base64: profile.logoBase64 || null,
        updated_at: new Date().toISOString(),
      });
    if (error) console.error('[supabase] updateProfile error:', error.message);
  } catch (err) {
    console.error('[supabase] updateProfile unexpected error:', err.message);
  }
}

// ── Quotes ──

export async function saveQuote({ quoteNumber, clientName, clientEmail, businessName, items, subtotal, gst, total, userId }) {
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
      user_id: userId || null,
    }]);
    if (error) console.error('[supabase] Save error:', error.message);
  } catch (err) {
    console.error('[supabase] Unexpected error:', err.message);
  }
}

export async function getQuotes(userId) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Cap history to prevent large response payloads
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabase] Fetch error:', err.message);
    return [];
  }
}
