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

    // Parse query params for pagination
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch daily spend
    const { data: dailySpend, error: spendError } = await supabase
      .from('agent_daily_spend')
      .select('*')
      .eq('date', today);

    if (spendError) throw spendError;

    // Fetch month spend (all days in current month)
    const monthStart = today.substring(0, 7) + '-01'; // YYYY-MM-01
    const { data: monthSpend, error: monthError } = await supabase
      .from('agent_daily_spend')
      .select('agent_name, total_cost_usd')
      .gte('date', monthStart);

    if (monthError) throw monthError;

    // Aggregate month spend by agent
    const monthByAgent: Record<string, number> = {};
    (monthSpend || []).forEach(s => {
      monthByAgent[s.agent_name] = (monthByAgent[s.agent_name] || 0) + (s.total_cost_usd || 0);
    });
    const monthTotal = Object.values(monthByAgent).reduce((a, b) => a + b, 0);

    // Fetch recent API calls with pagination
    const { data: apiCalls, error: apiError } = await supabase
      .from('agent_api_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (apiError) throw apiError;

    // Fetch recent messages with pagination
    const { data: messages, error: msgError } = await supabase
      .from('agent_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (msgError) throw msgError;

    // Fetch backlog items
    const { data: backlog, error: backlogError } = await supabase
      .from('backlog_items')
      .select('*')
      .order('priority', { ascending: false })
      .order('item_number', { ascending: true });

    // Don't throw if backlog table doesn't exist yet
    const backlogItems = backlogError ? [] : (backlog || []);

    // Build unified activity feed (merge API calls and messages)
    const activity = [
      ...(apiCalls || []).map(call => ({
        type: 'api_call' as const,
        created_at: call.created_at,
        agent_name: call.agent_name,
        model: call.model,
        tokens: (call.input_tokens || 0) + (call.output_tokens || 0),
        cost_usd: call.cost_usd,
        description: call.task_description,
        trigger_type: call.trigger_type,
      })),
      ...(messages || []).map(msg => ({
        type: 'message' as const,
        created_at: msg.created_at,
        agent_name: msg.agent_name,
        direction: msg.direction,
        from_address: msg.from_address,
        to_address: msg.to_address,
        subject: msg.subject,
        message_type: msg.message_type,
        body: msg.body,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Agent status: check for recent activity and halt status
    const agentStatus: Record<string, { lastActivity: string | null; halted: boolean; todaySpend: number }> = {};
    const agents = ['thea', 'taylor', 'jordan', 'dana', 'dominic', 'nathan', 'lucas', 'alex'];

    for (const agent of agents) {
      const spendRecord = (dailySpend || []).find(s => s.agent_name === agent);
      agentStatus[agent] = {
        lastActivity: activity.find(a => a.agent_name === agent)?.created_at || null,
        halted: spendRecord?.halted || false,
        todaySpend: spendRecord?.total_cost_usd || 0,
      };
    }

    return new Response(JSON.stringify({
      today,
      dailySpend: dailySpend || [],
      monthSpend: { byAgent: monthByAgent, total: monthTotal },
      activity,
      backlog: backlogItems,
      agentStatus,
      budgetPerAgent: 0.21,
      alertThreshold: 0.63,  // 3x daily
      haltThreshold: 1.05,   // 5x daily
      pagination: { offset, limit, hasMore: activity.length >= limit },
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
