import { useState, useEffect } from 'react';
import { Event, EventDay, Session } from '@/lib/types';
import { ApiService, CreateEventRequest, UpdateEventRequest, EventResponse, CreateEventDayRequest, UpdateEventDayRequest } from '@/lib/api';
import { showSuccess, showError, showInfo } from '@/lib/toast';

// Transform API event to local Event interface
const transformApiEvent = (apiEvent: EventResponse): Event => {
  const base: Event = {
    id: apiEvent.id.toString(),
    title: apiEvent.title,
    description: apiEvent.description,
    location: apiEvent.venue,
    capacity: apiEvent.capacity_total,
    startDate: apiEvent.start_at || '',
    endDate: apiEvent.end_at || '',
    sessions: [], // Sessions will be populated after fetching event days
    minAttendancePercentage: apiEvent.min_presence_pct,
    status: apiEvent.status === 'published' ? 'published' : apiEvent.status === 'completed' ? 'completed' : 'draft',
    eventDays: [],
  } as Event;

  // attach optional fields if present and return
  return ({
    ...base,
    ...(apiEvent.tracks ? { tracks: apiEvent.tracks } : {}),
    ...(apiEvent.speakers ? { speakers: apiEvent.speakers } : {}),
  }) as Event;
}

const transformApiEventDay = (apiDay: any): EventDay => {
  const base: EventDay = {
    id: apiDay.id.toString(),
    eventId: apiDay.event_id.toString(),
    date: apiDay.date,
    startTime: apiDay.start_time,
    endTime: apiDay.end_time,
    room: apiDay.room,
    capacity: apiDay.capacity,
  } as EventDay;

  return ({
    ...base,
    ...(apiDay.session_type ? { sessionType: apiDay.session_type } : {}),
  }) as EventDay;
}

const eventDayToSession = (day: EventDay): Session => {
  const base: Session = {
    id: day.id,
    eventId: day.eventId,
    date: day.date,
    startTime: day.startTime,
    endTime: day.endTime,
    room: day.room,
    capacity: day.capacity,
  } as Session;

  return ({
    ...base,
    ...(day.sessionType ? { sessionType: day.sessionType } : {}),
  }) as Session;
}

// Transform local Event to API format - removed unused function
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.listEvents();
      const transformedEvents = response.map(transformApiEvent);

      // Fetch event days for each event and attach
      const enriched = await Promise.all(transformedEvents.map(async (ev) => {
        try {
          const days = await ApiService.listEventDays(ev.id);
          const transformedDays = days.map(transformApiEventDay);
          const sessions = transformedDays.map(eventDayToSession);
          return { ...ev, eventDays: transformedDays, sessions } as Event;
        } catch (err) {
          // If fetching days fails for one event, continue with empty days
          return { ...ev } as Event;
        }
      }));

      setEvents(enriched);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateEventCapacityAgainstSessions = (capacity: number, sessions?: Partial<Session>[]) => {
    if (!sessions) return { ok: true };
    for (const s of sessions) {
      if (s.capacity && s.capacity > capacity) {
        return { ok: false, message: `Capacidade da sessão (${s.capacity}) não pode exceder capacidade do evento (${capacity}).` };
      }
    }
    return { ok: true };
  };

  const createEvent = async (eventData: Partial<Event> & { workloadHours?: number }): Promise<Event | null> => {
    try {
      const capacity = eventData.capacity || 100;

      // Validate sessions if provided
      const validation = validateEventCapacityAgainstSessions(capacity, eventData.sessions);
      if (!validation.ok) {
        showError(validation.message?.toString() || 'Erro de validação de capacidade');
        return null;
      }

      const apiEventData: CreateEventRequest = {
        title: eventData.title || '',
        description: eventData.description || '',
        venue: eventData.location || '',
        capacity_total: capacity,
        workload_hours: eventData.workloadHours || 4,
        min_presence_pct: eventData.minAttendancePercentage || 75,
        start_at: eventData.startDate || null,
        end_at: eventData.endDate || null,
        status: eventData.status || 'published',
      };
      
      const newApiEvent = await ApiService.createEvent(apiEventData);
      const newEvent = transformApiEvent(newApiEvent);
      
      // If sessions were provided, try to create event days for them
      if (eventData.sessions && eventData.sessions.length) {
        const createdDays = [] as EventDay[];
        for (const s of eventData.sessions) {
          const dayPayload: CreateEventDayRequest = {
            date: s.date || newEvent.startDate,
            start_time: s.startTime || '00:00',
            end_time: s.endTime || '00:00',
            room: s.room || '',
            capacity: s.capacity || newEvent.capacity,
          };
          try {
            const created = await ApiService.createEventDay(newEvent.id, dayPayload as any);
            createdDays.push(transformApiEventDay(created));
          } catch (err) {
            // continue creating other days, but notify
            const msg = err instanceof Error ? err.message : 'Erro ao criar dia do evento';
            showError(`${msg} (um dos dias)`);
          }
        }

        const sessions = createdDays.map(eventDayToSession);
        newEvent.eventDays = createdDays;
        newEvent.sessions = sessions;
      }

      // Add to local state
      setEvents(prev => [...prev, newEvent]);
      showSuccess('Evento criado com sucesso');
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento';
      showError(errorMessage);
      return null;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event | null> => {
    try {
      // Find existing event capacity for validation
      const existing = events.find(e => e.id === id);
      const capacity = eventData.capacity ?? existing?.capacity ?? 100;

      const validation = validateEventCapacityAgainstSessions(capacity, eventData.sessions || existing?.sessions);
      if (!validation.ok) {
        showError(validation.message?.toString() || 'Erro de validação de capacidade');
        return null;
      }

      const apiEventData: UpdateEventRequest = {
        ...(eventData.title && { title: eventData.title }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.location && { venue: eventData.location }),
        ...(eventData.capacity && { capacity_total: eventData.capacity }),
        ...(eventData.minAttendancePercentage && { min_presence_pct: eventData.minAttendancePercentage }),
        ...(eventData.startDate && { start_at: eventData.startDate }),
        ...(eventData.endDate && { end_at: eventData.endDate }),
        ...(eventData.status && { status: eventData.status })
      };
      
      const updatedApiEvent = await ApiService.updateEvent(id, apiEventData);
      const updatedEvent = transformApiEvent(updatedApiEvent);

      // If sessions were provided in eventData, do not overwrite server-managed sessions here;
      // sessions/days should be managed via dedicated methods below.
      const merged = { ...existing, ...updatedEvent } as Event;
      setEvents(prev => prev.map(e => e.id === id ? merged : e));
      showSuccess('Evento atualizado com sucesso');
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      showError(errorMessage);
      return null;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      console.debug('[useEvents] Deleting event', id);
      await ApiService.deleteEvent(id);
      console.debug('[useEvents] Delete request completed for', id);

      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== id));
      showSuccess('Evento excluído com sucesso');
      return true;
    } catch (err) {
      // Inspect error message to provide a more helpful toast when the backend
      // refuses deletion because the event still has days (sessions) associated.
      const rawMsg = err instanceof Error ? err.message : String(err);
      console.error('[useEvents] deleteEvent error:', err);

      // Look for common indicators that deletion failed due to existing child records.
      const isHasDaysError = /\b409\b|conflict|dias|days|existing\s+days|has\s+days|children|foreign\s+key|constraint|cannot\s+delete|has\s+children/i.test(rawMsg);

      if (isHasDaysError) {
        const userMsg = 'Não foi possível excluir o evento: existem dias cadastrados neste evento. Exclua primeiro os dias do evento e tente novamente.';
        showError(userMsg);
      } else {
        const errorMessage = rawMsg || 'Erro ao excluir evento';
        showError(errorMessage);
      }

      return false;
    }
  };

  const getEventById = async (id: string): Promise<Event | null> => {
    try {
      const apiEvent = await ApiService.getEvent(id);
      const transformed = transformApiEvent(apiEvent);
      // fetch days
      try {
        const days = await ApiService.listEventDays(id);
        const transformedDays = days.map(transformApiEventDay);
        transformed.eventDays = transformedDays;
        transformed.sessions = transformedDays.map(eventDayToSession);
      } catch (e) {
        // ignore days failure
      }
      return transformed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Evento não encontrado';
      showError(errorMessage);
      return null;
    }
  };

  // Event Days (sessions) CRUD
  const listEventDays = async (eventId: string): Promise<EventDay[]> => {
    try {
      const days = await ApiService.listEventDays(eventId);
      return days.map(transformApiEventDay);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao listar dias do evento';
      showError(errorMessage);
      return [];
    }
  };

  const createEventDay = async (eventId: string, dayData: Partial<EventDay>): Promise<EventDay | null> => {
    try {
      const ev = events.find(e => e.id === eventId);
      if (!ev) {
        showError('Evento não encontrado para adicionar dia');
        return null;
      }

      // Validate capacity
      const dayCapacity = dayData.capacity ?? ev.capacity;
      if (dayCapacity > ev.capacity) {
        showError('Capacidade da sessão não pode exceder a capacidade do evento');
        return null;
      }

      const payload: CreateEventDayRequest = {
        date: dayData.date || ev.startDate,
        start_time: dayData.startTime || '00:00',
        end_time: dayData.endTime || '00:00',
        room: dayData.room || ev.location,
        capacity: dayCapacity,
      };

      const created = await ApiService.createEventDay(eventId, payload as any);
      const transformed = transformApiEventDay(created);

      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, eventDays: [...(e.eventDays || []), transformed], sessions: [...(e.sessions || []), eventDayToSession(transformed)] } : e));
      showSuccess('Dia do evento criado com sucesso');
      return transformed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar dia do evento';
      showError(errorMessage);
      return null;
    }
  };

  const updateEventDay = async (eventId: string, dayId: string, dayData: Partial<EventDay>): Promise<EventDay | null> => {
    try {
      const ev = events.find(e => e.id === eventId);
      if (!ev) {
        showError('Evento não encontrado para atualizar dia');
        return null;
      }

      const dayCapacity = dayData.capacity ?? undefined;
      if (dayCapacity && dayCapacity > ev.capacity) {
        showError('Capacidade da sessão não pode exceder a capacidade do evento');
        return null;
      }

      const payload: UpdateEventDayRequest = {
        ...(dayData.date && { date: dayData.date }),
        ...(dayData.startTime && { start_time: dayData.startTime }),
        ...(dayData.endTime && { end_time: dayData.endTime }),
        ...(dayData.room && { room: dayData.room }),
        ...(dayData.capacity && { capacity: dayData.capacity }),
      };

      const updated = await ApiService.updateEventDay(eventId, dayId, payload as any);
      const transformed = transformApiEventDay(updated);

      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e;
        const updatedDays = (e.eventDays || []).map(d => d.id === dayId ? transformed : d);
        const updatedSessions = (e.sessions || []).map(s => s.id === dayId ? eventDayToSession(transformed) : s);
        return { ...e, eventDays: updatedDays, sessions: updatedSessions };
      }));

      showSuccess('Dia do evento atualizado com sucesso');
      return transformed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dia do evento';
      showError(errorMessage);
      return null;
    }
  };

  const deleteEventDay = async (eventId: string, dayId: string): Promise<boolean> => {
    try {
      await ApiService.deleteEventDay(eventId, dayId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, eventDays: (e.eventDays || []).filter(d => d.id !== dayId), sessions: (e.sessions || []).filter(s => s.id !== dayId) } : e));
      showSuccess('Dia do evento excluído com sucesso');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir dia do evento';
      showError(errorMessage);
      return false;
    }
  };

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    // event days
    listEventDays,
    createEventDay,
    updateEventDay,
    deleteEventDay,
  };
}