import { useState, useEffect, useCallback } from 'react';
import { EventDay } from '@/lib/types';
import { ApiService, CreateEventDayRequest, UpdateEventDayRequest, EventDayResponse } from '@/lib/api';
import { showSuccess, showError, showInfo } from '@/lib/toast';

// Transform API EventDay to local EventDay interface
const transformApiEventDay = (apiEventDay: EventDayResponse): EventDay => ({
  id: apiEventDay.id.toString(),
  eventId: apiEventDay.event_id.toString(),
  date: apiEventDay.date,
  startTime: apiEventDay.start_time,
  endTime: apiEventDay.end_time,
  room: apiEventDay.room || '',
  capacity: apiEventDay.capacity,
});

export function useEventDays(eventId?: string) {
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventDays = useCallback(async () => {
    if (!eventId) {
      setEventDays([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.listEventDays(eventId);
      const transformedEventDays = response.map(transformApiEventDay);
      setEventDays(transformedEventDays);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dias do evento';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const createEventDay = async (dayData: CreateEventDayRequest): Promise<EventDay | null> => {
    if (!eventId) {
      showError('ID do evento é obrigatório');
      return null;
    }

    try {
      const newApiEventDay = await ApiService.createEventDay(eventId, dayData);
      const newEventDay = transformApiEventDay(newApiEventDay);
      
      // Add to local state
      setEventDays(prev => [...prev, newEventDay]);
      showSuccess('Dia do evento criado com sucesso');
      return newEventDay;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar dia do evento';
      showError(errorMessage);
      return null;
    }
  };

  const updateEventDay = async (dayId: string, dayData: UpdateEventDayRequest): Promise<EventDay | null> => {
    if (!eventId) {
      showError('ID do evento é obrigatório');
      return null;
    }

    try {
      const updatedApiEventDay = await ApiService.updateEventDay(eventId, dayId, dayData);
      const updatedEventDay = transformApiEventDay(updatedApiEventDay);
      
      // Update in local state
      setEventDays(prev => prev.map(d => d.id === dayId ? updatedEventDay : d));
      showSuccess('Dia do evento atualizado com sucesso');
      return updatedEventDay;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dia do evento';
      showError(errorMessage);
      return null;
    }
  };

  const deleteEventDay = async (dayId: string): Promise<boolean> => {
    if (!eventId) {
      showError('ID do evento é obrigatório');
      return false;
    }

    try {
      await ApiService.deleteEventDay(eventId, dayId);
      
      // Remove from local state
      setEventDays(prev => prev.filter(d => d.id !== dayId));
      showSuccess('Dia do evento excluído com sucesso');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir dia do evento';
      showError(errorMessage);
      return false;
    }
  };

  const getEventDayById = async (dayId: string): Promise<EventDay | null> => {
    if (!eventId) {
      showError('ID do evento é obrigatório');
      return null;
    }

    try {
      const apiEventDay = await ApiService.getEventDay(eventId, dayId);
      return transformApiEventDay(apiEventDay);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Dia do evento não encontrado';
      showError(errorMessage);
      return null;
    }
  };

  // Load event days when eventId changes
  useEffect(() => {
    loadEventDays();
  }, [loadEventDays]);

  return {
    eventDays,
    loading,
    error,
    loadEventDays,
    createEventDay,
    updateEventDay,
    deleteEventDay,
    getEventDayById,
  };
}