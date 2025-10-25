import React, { useState, useEffect } from 'react';
import { EventDay } from '@/lib/types';
import { useEventDays } from '@/hooks/useEventDays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, MapPin, Users, Trash, PencilSimple, CircleNotch } from '@phosphor-icons/react';
import { showSuccess, showError, showInfo, confirm } from '@/lib/toast';

interface EventDaysDialogProps {
  eventId: string;
  eventTitle: string;
  trigger?: React.ReactNode;
}

interface EventDayFormData {
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  capacity: number;
}

export function EventDaysDialog({ eventId, eventTitle, trigger }: EventDaysDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDay, setEditingDay] = useState<EventDay | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventDayFormData>({
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    room: '',
    capacity: 100
  });

  const { eventDays, loading, createEventDay, updateEventDay, deleteEventDay } = useEventDays(eventId);

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '09:00',
      endTime: '18:00',
      room: '',
      capacity: 100
    });
    setIsCreating(false);
    setEditingDay(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.room) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate time
    if (formData.startTime >= formData.endTime) {
      showError('Horário de início deve ser anterior ao horário de término');
      return;
    }

    const dayData = {
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      room: formData.room,
      capacity: formData.capacity
    };

    let success = false;
    if (editingDay) {
      const result = await updateEventDay(editingDay.id, dayData);
      success = !!result;
    } else {
      const result = await createEventDay(dayData);
      success = !!result;
    }

    if (success) {
      resetForm();
    }
  };

  const startEditing = (day: EventDay) => {
    setEditingDay(day);
    setFormData({
      date: day.date,
      startTime: day.startTime,
      endTime: day.endTime,
      room: day.room,
      capacity: day.capacity
    });
    setIsCreating(true);
  };

  const handleDelete = async (day: EventDay) => {
    if (deletingDayId === day.id) return; // already processing
    setDeletingDayId(day.id);
    try {
      const confirmed = await confirm(
        'Excluir dia',
        `Tem certeza que deseja excluir o dia ${formatDate(day.date)}?`,
        'Excluir',
        'Cancelar'
      )
      if (confirmed) {
        await deleteEventDay(day.id);
      }
    } finally {
      setDeletingDayId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds if present
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Gerenciar Dias
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dias do Evento: {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingDay ? 'Editar Dia do Evento' : 'Adicionar Novo Dia'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room">Sala *</Label>
                      <Input
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        placeholder="Nome da sala ou auditório"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="startTime">Horário de Início *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Horário de Término *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacidade</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingDay ? 'Atualizar Dia' : 'Adicionar Dia'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add New Day Button */}
          {!isCreating && (
            <div className="flex justify-end">
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Dia
              </Button>
            </div>
          )}

          {/* Event Days List */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <CircleNotch className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando dias do evento...</span>
              </CardContent>
            </Card>
          ) : eventDays.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dias Cadastrados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventDays
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((day) => (
                    <Card key={day.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">{formatDate(day.date)}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(day)}
                              className="h-8 w-8 p-0"
                            >
                              <PencilSimple className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(day)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-secondary"
                              disabled={deletingDayId === day.id}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(day.startTime)} às {formatTime(day.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{day.room}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>Capacidade: {day.capacity}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum dia cadastrado</p>
                <p className="text-muted-foreground mb-4 text-center">
                  Adicione os dias e horários deste evento
                </p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Dia
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}