import { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Users, Pencil, Trash } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useEventDays } from '../hooks/useEventDays';
import { EventDay } from '../lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { confirm } from '@/lib/toast';

interface EventDaysManagementProps {
  eventId: string | null;
  eventTitle?: string;
}

export function EventDaysManagement({ eventId, eventTitle }: EventDaysManagementProps) {
  const { eventDays, loading, createEventDay, updateEventDay, deleteEventDay } = useEventDays(eventId || undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<EventDay | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '08:00',
    end_time: '18:00',
    room: '',
    capacity: 100,
  });
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createEventDay({
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room || '',
      capacity: formData.capacity,
    });
    if (success) {
      setIsCreateDialogOpen(false);
      setFormData({
        date: '',
        start_time: '08:00',
        end_time: '18:00',
        room: '',
        capacity: 100,
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;
    
    const success = await updateEventDay(editingDay.id, {
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room || '',
      capacity: formData.capacity,
    });
    if (success) {
      setIsEditDialogOpen(false);
      setEditingDay(null);
    }
  };

  const handleEdit = (day: EventDay) => {
    setEditingDay(day);
    setFormData({
      date: day.date,
      start_time: day.startTime,
      end_time: day.endTime,
      room: day.room || '',
      capacity: day.capacity,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (day: EventDay) => {
    if (deletingDayId === day.id) return; // already processing
    setDeletingDayId(day.id);
    try {
      const confirmed = await confirm(
        'Remover dia do evento',
        'Tem certeza que deseja remover este dia do evento? Esta ação não pode ser desfeita.',
        'Remover',
        'Cancelar'
      );

      if (!confirmed) return;

      await deleteEventDay(day.id);
    } finally {
      setDeletingDayId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  if (!eventId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Selecione um evento para gerenciar seus dias</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dias do Evento</h2>
          {eventTitle && (
            <p className="text-muted-foreground">{eventTitle}</p>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Dia ao Evento</DialogTitle>
              <DialogDescription>
                Configure os detalhes do novo dia do evento.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_time">Hora Início</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_time">Hora Fim</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="room">Sala</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Ex: Sala 101, Auditório Principal..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacidade</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Dia</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {eventDays.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum dia configurado</p>
                <p className="text-muted-foreground text-center mb-4">
                  Adicione dias ao evento para definir quando ele acontecerá.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Dia
                </Button>
              </CardContent>
            </Card>
          ) : (
            eventDays.map((day) => (
              <Card key={day.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDate(day.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(day)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(day)}
                        disabled={deletingDayId === day.id}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTime(day.startTime)} - {formatTime(day.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{day.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{day.capacity} pessoas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dia do Evento</DialogTitle>
            <DialogDescription>
              Atualize os detalhes do dia do evento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Data</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start_time">Hora Início</Label>
                  <Input
                    id="edit-start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end_time">Hora Fim</Label>
                  <Input
                    id="edit-end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-room">Sala</Label>
                <Input
                  id="edit-room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Ex: Sala 101, Auditório Principal..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-capacity">Capacidade</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}