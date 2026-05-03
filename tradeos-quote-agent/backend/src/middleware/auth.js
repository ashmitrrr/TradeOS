// Auth middleware — verifies Supabase JWT from Authorization header
import supabase from '../lib/supabaseClient.js';

export async function requireAuth(req, res, next) {
  // If Supabase not configured, skip auth (dev fallback)
  if (!supabase) {
    console.warn('[auth] Supabase not configured — skipping auth check');
    req.user = { id: 'dev-user', email: 'dev@localhost' };
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    }

    // Attach user to request for downstream handlers
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
