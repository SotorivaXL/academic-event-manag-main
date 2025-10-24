import React, { useState } from 'react';
import { Event } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, CircleNotch, Clock } from '@phosphor-icons/react';
import { showSuccess, showError, showInfo, confirm as showConfirm } from '@/lib/toast';
import { EventDaysManagement } from '@/components/EventDaysManagement';

interface EventManagementProps {
  events: Event[];
  loading?: boolean;
  onEventCreate: (event: Event & { workloadHours?: number }) => void;
  onEventUpdate: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
}

export function EventManagement({ 
  events, 
  loading = false,
  onEventCreate, 
  onEventUpdate, 
  onEventDelete 
}: EventManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [managingDaysEvent, setManagingDaysEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    capacity: number;
    workloadHours: number;
    minAttendancePercentage: number;
    status: 'draft' | 'published' | 'completed';
  }>({
    title: '',
    description: '',
    location: '',
    capacity: 100,
    workloadHours: 4,
    minAttendancePercentage: 75,
    status: 'published' as const
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      capacity: 100,
      workloadHours: 4,
      minAttendancePercentage: 75,
      status: 'published'
    });
    setIsCreating(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    const eventData: Event & { workloadHours?: number } = {
      id: editingEvent?.id || '', // API will generate the ID
      title: formData.title,
      description: formData.description,
      location: formData.location,
      capacity: formData.capacity,
      startDate: '', // These fields are not currently required by the API
      endDate: '',
      minAttendancePercentage: formData.minAttendancePercentage,
      status: formData.status,
      sessions: [], // Sessions will be handled separately when API supports them
      workloadHours: formData.workloadHours
    };

    if (editingEvent) {
      await onEventUpdate(eventData);
    } else {
      await onEventCreate(eventData);
    }

    resetForm();
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      capacity: event.capacity,
      workloadHours: 4, // Default value since it's not in Event interface
      minAttendancePercentage: event.minAttendancePercentage,
      status: event.status
    });
    setIsCreating(true);
  };

  const handleDelete = async (event: Event) => {
    const confirmed = await showConfirm(
      'Excluir evento',
      `Tem certeza que deseja excluir o evento "${event.title}"?`,
      'Excluir',
      'Cancelar'
    )
    if (confirmed) {
      onEventDelete(event.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Eventos</h2>
          <p className="text-muted-foreground">Crie e gerencie eventos acadêmicos</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2" disabled={loading}>
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        )}
      </div>

      {loading && !isCreating ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <CircleNotch className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando eventos...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>{editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Nome do evento"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Local</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Localização do evento"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do evento"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacidade Total</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                        min="1"
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workloadHours">Carga Horária (horas)</Label>
                      <Input
                        id="workloadHours"
                        type="number"
                        value={formData.workloadHours}
                        onChange={(e) => setFormData({ ...formData, workloadHours: parseInt(e.target.value) || 0 })}
                        min="1"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minAttendance">Presença Mínima (%)</Label>
                      <Input
                        id="minAttendance"
                        type="number"
                        value={formData.minAttendancePercentage}
                        onChange={(e) => setFormData({ ...formData, minAttendancePercentage: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        placeholder="75"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'draft' | 'published' | 'completed') => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Após criar o evento, você poderá gerenciar os dias e horários específicos 
                      através do botão "Dias" no cartão do evento.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingEvent ? 'Atualizar Evento' : 'Criar Evento'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge 
                      variant={event.status === 'published' ? 'default' : 
                               event.status === 'completed' ? 'secondary' : 'outline'}
                    >
                      {event.status === 'published' ? 'Ativo' :
                       event.status === 'completed' ? 'Concluído' : 'Rascunho'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  
                  {event.startDate && event.endDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Capacidade: {event.capacity}</span>
                    <span>Presença mín: {event.minAttendancePercentage}%</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => startEditing(event)}>
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setManagingDaysEvent(event)}
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      Dias
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(event)}
                      className="text-destructive hover:text-destructive-foreground"
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {events.length === 0 && !isCreating && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum evento cadastrado</p>
                <p className="text-muted-foreground mb-4">Comece criando seu primeiro evento acadêmico</p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Evento
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Event Days Management Dialog */}
      <Dialog open={!!managingDaysEvent} onOpenChange={(open) => !open && setManagingDaysEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Dias do Evento: {managingDaysEvent?.title}</DialogTitle>
          </DialogHeader>
          {managingDaysEvent && (
            <EventDaysManagement 
              eventId={managingDaysEvent.id}
              eventTitle={managingDaysEvent.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}