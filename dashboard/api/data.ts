import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  runtime: 'edge',
};

function checkAuth(request: Request): Response | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = atob(encoded);
  const [user, password] = decoded.split(':');

  const validPassword = process.env.DASHBOARD_PASSWORD || 'jbev0124';

  if (user !== 'evryn' || password !== validPassword) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }

  return null; // Auth passed
}

export default async function handler(request: Request) {
  // Check authentication
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  try {
    // Get today's date in Pacific time
    const now = new Date();
    const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacific.toISOString().split('T')[0];

    // Fetch daily spend
    const { data: dailySpend, error: spendError } = await supabase
      .from('agent_daily_spend')
      .select('*')
      .eq('date', today);

    if (spendError) throw spendError;

    // Fetch recent API calls (last 50)
    const { data: apiCalls, error: apiError } = await supabase
      .from('agent_api_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (apiError) throw apiError;

    // Fetch recent messages (last 30)
    const { data: messages, error: msgError } = await supabase
      .from('agent_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (msgError) throw msgError;

    return new Response(JSON.stringify({
      today,
      dailySpend: dailySpend || [],
      apiCalls: apiCalls || [],
      messages: messages || [],
      budgetPerAgent: 0.21,
      alertThreshold: 0.63,  // 3x daily
      haltThreshold: 1.05,   // 5x daily
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
