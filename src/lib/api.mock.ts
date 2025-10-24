// Simple in-memory mock ApiService for local testing/debugging
import { CreateEventRequest, CreateEventDayRequest, UpdateEventDayRequest } from './api';

type StoredEvent = any;
let events: StoredEvent[] = [];
let days: Record<string, any[]> = {};
let nextEventId = 1;
let nextDayId = 1;

class MockApiService {
  static async login(_credentials: { username: string; password: string }) {
    // return a fake token
    return { access_token: 'mock-token', refresh_token: 'mock-refresh', token_type: 'bearer' };
  }

  static logout() {}
  static isAuthenticated() { return true; }

  static async getEvents() {
    return events.map(e => ({ ...e }));
  }

  static async listEvents() { return this.getEvents(); }

  static async getEvent(id: string) {
    const ev = events.find(e => e.id.toString() === id.toString());
    if (!ev) throw new Error('Evento não encontrado');
    return { ...ev };
  }

  static async createEvent(event: CreateEventRequest) {
    const newEv = {
      id: nextEventId++,
      client_id: 1,
      title: event.title,
      description: event.description,
      venue: event.venue,
      capacity_total: event.capacity_total,
      workload_hours: event.workload_hours,
      min_presence_pct: event.min_presence_pct,
      start_at: event.start_at || null,
      end_at: event.end_at || null,
      status: event.status,
      tracks: (event as any).tracks || [],
      speakers: (event as any).speakers || [],
    };
    events.push(newEv);
    days[newEv.id] = [];
    return { ...newEv };
  }

  static async updateEvent(id: string, data: any) {
    const idx = events.findIndex(e => e.id.toString() === id.toString());
    if (idx === -1) throw new Error('Evento não encontrado');
    events[idx] = { ...events[idx], ...data };
    return { ...events[idx] };
  }

  static async deleteEvent(id: string) {
    events = events.filter(e => e.id.toString() !== id.toString());
    delete days[id];
  }

  static async listEventDays(eventId: string) {
    return (days[eventId] || []).map(d => ({ ...d }));
  }

  static async createEventDay(eventId: string, dayData: CreateEventDayRequest) {
    const ev = events.find(e => e.id.toString() === eventId.toString());
    if (!ev) throw new Error('Evento não encontrado');
    const newDay = {
      id: nextDayId++,
      event_id: ev.id,
      date: dayData.date,
      start_time: dayData.start_time,
      end_time: dayData.end_time,
      room: dayData.room || '',
      capacity: dayData.capacity,
      session_type: (dayData as any).session_type || null,
    };
    days[eventId] = days[eventId] || [];
    days[eventId].push(newDay);
    return { ...newDay };
  }

  static async getEventDay(eventId: string, dayId: string) {
    const list = days[eventId] || [];
    const d = list.find(x => x.id.toString() === dayId.toString());
    if (!d) throw new Error('Dia não encontrado');
    return { ...d };
  }

  static async updateEventDay(eventId: string, dayId: string, dayData: UpdateEventDayRequest) {
    const list = days[eventId] || [];
    const idx = list.findIndex(x => x.id.toString() === dayId.toString());
    if (idx === -1) throw new Error('Dia não encontrado');
    list[idx] = { ...list[idx], ...dayData } as any;
    return { ...list[idx] };
  }

  static async deleteEventDay(eventId: string, dayId: string) {
    days[eventId] = (days[eventId] || []).filter(x => x.id.toString() !== dayId.toString());
  }
}

export { MockApiService };

