// Quick test script to: 1) login, 2) create event, 3) create event day
// Run with: node scripts/test_api.js

const BASE = 'https://events-backend-zug5.onrender.com/api/v1/demo';

async function run() {
  try {
    // 1) Login
    const params = new URLSearchParams();
    params.append('username', 'admin@demo');
    params.append('password', 'admin123');

    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const loginText = await loginRes.text();
    console.log('LOGIN STATUS:', loginRes.status);
    try { console.log('LOGIN BODY:', JSON.parse(loginText)); } catch { console.log('LOGIN BODY (raw):', loginText); }

    if (!loginRes.ok) {
      console.error('Login failed, aborting flow');
      return;
    }

    const loginJson = JSON.parse(loginText);
    const token = loginJson.access_token;
    if (!token) {
      console.error('No access_token in login response');
      return;
    }

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 2) Create event
    const eventPayload = {
      title: 'Teste Automático - Evento',
      description: 'Evento criado por script de testes',
      venue: 'Auditório de Teste',
      capacity_total: 50,
      workload_hours: 4,
      min_presence_pct: 75,
      start_at: new Date().toISOString().slice(0,10),
      end_at: new Date(Date.now()+2*24*3600*1000).toISOString().slice(0,10),
      status: 'published'
    };

    const createEvRes = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventPayload),
    });
    const createEvText = await createEvRes.text();
    console.log('CREATE EVENT STATUS:', createEvRes.status);
    try { console.log('CREATE EVENT BODY:', JSON.parse(createEvText)); } catch { console.log('CREATE EVENT BODY (raw):', createEvText); }

    if (!createEvRes.ok) {
      console.error('Create event failed, aborting');
      return;
    }

    const createdEvent = JSON.parse(createEvText);
    const eventId = createdEvent.id;
    console.log('Created event id:', eventId);

    // 3) Create event day
    const dayPayload = {
      date: new Date().toISOString().slice(0,10),
      start_time: '09:00',
      end_time: '12:00',
      room: 'Sala Principal',
      capacity: 30,
      session_type: 'Palestra'
    };

    const createDayRes = await fetch(`${BASE}/events/${eventId}/days`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dayPayload),
    });
    const createDayText = await createDayRes.text();
    console.log('CREATE DAY STATUS:', createDayRes.status);
    try { console.log('CREATE DAY BODY:', JSON.parse(createDayText)); } catch { console.log('CREATE DAY BODY (raw):', createDayText); }

    if (!createDayRes.ok) {
      console.error('Create day failed');
      return;
    }

    console.log('Test flow completed successfully');
  } catch (err) {
    console.error('Error running test flow', err);
  }
}

run();

