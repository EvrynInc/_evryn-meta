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
  const decoded = atob(authHeader.split(' ')[1]);
  const [user, password] = decoded.split(':');
  const validPassword = process.env.DASHBOARD_PASSWORD || 'jbev0124';
  if (user !== 'evryn' || password !== validPassword) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Evryn Dashboard"' },
    });
  }
  return null;
}

function truncateToBucket(isoString: string, granularity: string): string {
  const d = new Date(isoString);
  if (granularity === 'day') {
    return d.toISOString().split('T')[0] + 'T00:00:00Z';
  }
  if (granularity === 'hour') {
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }
  // minute
  d.setSeconds(0, 0);
  return d.toISOString();
}

export default async function handler(request: Request) {
  const authResponse = checkAuth(request);
  if (authResponse) return authResponse;

  try {
    const url = new URL(request.url);
    const granularity = url.searchParams.get('granularity') || 'minute';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'from and to params required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Support both date strings (YYYY-MM-DD) and full ISO timestamps
    const fromTs = from.includes('T') ? from : from + 'T00:00:00Z';
    const toTs = to.includes('T') ? to : to + 'T23:59:59Z';

    // Fetch all API calls in the date range (max 10000 rows)
    const { data, error } = await supabase
      .from('agent_api_calls')
      .select('agent_name, input_tokens, output_tokens, cost_usd, created_at')
      .gte('created_at', fromTs)
      .lte('created_at', toTs)
      .order('created_at', { ascending: true })
      .limit(10000);

    if (error) throw error;

    // Bucket the data
    const buckets: Record<string, Record<string, { tokens: number; cost: number; calls: number }>> = {};

    (data || []).forEach(row => {
      const bucket = truncateToBucket(row.created_at, granularity);
      const agent = row.agent_name;
      if (!buckets[bucket]) buckets[bucket] = {};
      if (!buckets[bucket][agent]) buckets[bucket][agent] = { tokens: 0, cost: 0, calls: 0 };
      buckets[bucket][agent].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
      buckets[bucket][agent].cost += row.cost_usd || 0;
      buckets[bucket][agent].calls += 1;
    });

    // Flatten to array sorted by bucket
    const result = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bucket, agents]) => ({ bucket, agents }));

    return new Response(JSON.stringify({ granularity, from: fromTs, to: toTs, data: result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch usage data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
