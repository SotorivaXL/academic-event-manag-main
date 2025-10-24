// scripts/test_local_mock_flow.js
// Simula o fluxo: login -> criar evento -> criar dia usando um mock em memória
(async () => {
  // MockApiService logic (self-contained) to avoid TS imports
  const MockApiService = (() => {
    let events = [];
    const days = {};
    let nextEventId = 1;
    let nextDayId = 1;

    return {
      async login() {
        return { access_token: 'mock-token' };
      },
      async createEvent(payload) {
        const ev = {
          id: nextEventId++,
          client_id: 1,
          title: payload.title,
          description: payload.description,
          venue: payload.venue,
          capacity_total: payload.capacity_total,
          workload_hours: payload.workload_hours,
          min_presence_pct: payload.min_presence_pct,
          start_at: payload.start_at || null,
          end_at: payload.end_at || null,
          status: payload.status || 'published',
          tracks: payload.tracks || [],
          speakers: payload.speakers || [],
        };
        events.push(ev);
        days[ev.id] = [];
        return ev;
      },
      async createEventDay(eventId, day) {
        const ev = events.find(e => e.id.toString() === eventId.toString());
        if (!ev) throw new Error('Evento não encontrado');
        if (day.capacity > ev.capacity_total) throw new Error('Capacidade da sessão excede capacidade do evento');
        const d = {
          id: nextDayId++,
          event_id: ev.id,
          date: day.date,
          start_time: day.start_time,
          end_time: day.end_time,
          room: day.room || '',
          capacity: day.capacity,
          session_type: day.session_type || null,
        };
        days[ev.id].push(d);
        return d;
      },
      async listEvents() { return events.slice(); },
      async listEventDays(eventId) { return (days[eventId] || []).slice(); }
    };
  })();

  try {
    console.log('1) Simulando login...');
    const token = (await MockApiService.login()).access_token;
    console.log('   token:', token);

    console.log('2) Criando evento de teste...');
    const eventPayload = {
      title: 'Evento Mock - Teste Local',
      description: 'Descrição do evento mock criado localmente',
      venue: 'Auditório Mock',
      capacity_total: 100,
      workload_hours: 8,
      min_presence_pct: 75,
      start_at: new Date().toISOString().slice(0,10),
      end_at: new Date(Date.now()+2*24*3600*1000).toISOString().slice(0,10),
      status: 'published',
      tracks: ['Trilha A','Trilha B'],
      speakers: ['Palestrante 1']
    };

    const createdEvent = await MockApiService.createEvent(eventPayload);
    console.log('   Evento criado:', createdEvent);

    console.log('3) Criando dia para o evento...');
    const dayPayload = {
      date: new Date().toISOString().slice(0,10),
      start_time: '09:00',
      end_time: '12:00',
      room: 'Sala Principal',
      capacity: 50,
      session_type: 'Palestra'
    };

    const createdDay = await MockApiService.createEventDay(createdEvent.id, dayPayload);
    console.log('   Dia criado:', createdDay);

    console.log('4) Listando eventos e dias para verificação:');
    const events = await MockApiService.listEvents();
    for (const e of events) {
      console.log('Event:', e.id, e.title, 'capacity', e.capacity_total);
      const evDays = await MockApiService.listEventDays(e.id);
      console.log('  Days:', evDays);
    }

    console.log('\nFluxo de teste local (mock) concluído com sucesso.');
  } catch (err) {
    console.error('Erro no fluxo de teste mock:', err.message || err);
    process.exitCode = 1;
  }
})();

