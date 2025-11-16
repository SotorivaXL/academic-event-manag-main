// src/components/EnrollmentManagement.tsx
import React, {useCallback, useEffect, useState} from 'react';
import { Event } from '@/lib/types';
import { ApiService, EnrollmentWithRelations } from '@/lib/api';
import { useStudents } from '@/hooks/useStudents';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
    ClipboardText,
    Users,
    Calendar,
    MapPin,
    CircleNotch,
    Plus,
} from '@phosphor-icons/react';

import { showError, showSuccess, confirm } from '@/lib/toast';

interface EnrollmentManagementProps {
    events: Event[];
}

export function EnrollmentManagement({ events }: EnrollmentManagementProps) {
    const [expandedEvents, setExpandedEvents] = useState<string[]>([]);
    const [enrollmentsByEvent, setEnrollmentsByEvent] = useState<Record<string, EnrollmentWithRelations[]>>({});
    const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [eventForNewEnrollment, setEventForNewEnrollment] = useState<Event | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithRelations | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    const fetchEnrollmentsForEvent = useCallback(
        async (eventId: string) => {
            try {

                const data = await ApiService.listEnrollments(eventId);

                setEnrollmentsByEvent(prev => ({
                    ...prev,
                    [eventId]: data,
                }));
            } catch (err) {
                console.error('Erro ao carregar inscrições do evento', eventId, err);
            } finally {
            }
        },
        [setEnrollmentsByEvent]
    );

    // reaproveitar hook existente de alunos só para popular o select
    const {
        students,
        loading: studentsLoading,
        error: studentsError,
        searchStudents,
    } = useStudents();


    const toggleEvent = async (eventId: string) => {
        const isExpanded = expandedEvents.includes(eventId);

        if (isExpanded) {
            setExpandedEvents(prev => prev.filter(id => id !== eventId));
            return;
        }

        setExpandedEvents(prev => [...prev, eventId]);

        if (!enrollmentsByEvent[eventId]) {
            setLoadingEventId(eventId);
            try {
                await fetchEnrollmentsForEvent(eventId);
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Erro ao carregar inscrições';
                showError(msg);
            } finally {
                setLoadingEventId(null);
            }
        }
    };


    const openCreateForEvent = (event: Event) => {
        // se ainda não carregou alunos, busca agora
        if (!students.length && !studentsLoading) {
            searchStudents('');
        }

        setEventForNewEnrollment(event);
        setSelectedStudentId('');
        setIsCreateModalOpen(true);
    };

    const handleCreateEnrollment = async () => {
        if (!eventForNewEnrollment) {
            showError('Erro', 'Nenhum evento selecionado.');
            return;
        }

        if (!selectedStudentId) {
            showError('Erro', 'Selecione um aluno para inscrever.');
            return;
        }

        try {
            await ApiService.enrollStudent(
                eventForNewEnrollment.id,
                selectedStudentId,
                {
                    idempotent: true,
                    reactivate_if_canceled: true,
                }
            );

            showSuccess('Inscrição criada', 'Aluno inscrito com sucesso.');

            // 🔁 atualiza a lista de inscrições desse evento
            await fetchEnrollmentsForEvent(eventForNewEnrollment.id);

            setIsCreateModalOpen(false);
            setSelectedStudentId('');
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Erro ao criar inscrição';
            showError('Erro ao criar inscrição', msg);
        }
    };

    const openDetails = (enr: EnrollmentWithRelations) => {
        setSelectedEnrollment(enr);
        setIsDetailsOpen(true);
    };

    const handleCancelEnrollment = async () => {
        if (!selectedEnrollment) return;

        const alunoNome = selectedEnrollment.student?.name || 'este aluno';
        const eventoTitulo = selectedEnrollment.event?.title || 'este evento';

        const ok = await confirm(
            'Cancelar inscrição',
            `Tem certeza que deseja cancelar a inscrição de ${alunoNome} no evento "${eventoTitulo}"?`,
            'Cancelar inscrição',
            'Voltar'
        );

        if (!ok) return;

        setCancelLoading(true);
        try {
            await ApiService.cancelEnrollment(selectedEnrollment.id);
            showSuccess('Inscrição cancelada com sucesso.');

            // atualiza status localmente
            setEnrollmentsByEvent(prev => {
                const eventId = String(selectedEnrollment.event_id);
                const current = prev[eventId] || [];
                return {
                    ...prev,
                    [eventId]: current.map(enr =>
                        enr.id === selectedEnrollment.id
                            ? { ...enr, status: 'canceled' }
                            : enr
                    ),
                };
            });

            setSelectedEnrollment(prev =>
                prev ? { ...prev, status: 'canceled' } : prev
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao cancelar inscrição.';
            showError(msg);
        } finally {
            setCancelLoading(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        const normalized = status.toLowerCase();

        if (normalized === 'confirmed') {
            return <Badge variant="default">Confirmada</Badge>;
        }
        if (normalized === 'pending') {
            return <Badge variant="outline">Pendente</Badge>;
        }
        if (normalized === 'waitlist') {
            return <Badge variant="outline">Lista de espera</Badge>;
        }
        if (normalized === 'canceled' || normalized === 'cancelled') {
            return <Badge variant="destructive">Cancelada</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const hasEvents = events && events.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardText className="h-6 w-6" />
                        Inscrições
                    </h2>
                    <p className="text-muted-foreground">
                        Visualize e gerencie as inscrições dos alunos em cada evento.
                    </p>
                </div>
            </div>

            {!hasEvents ? (
                <Card>
                    <CardContent className="py-10 text-center space-y-2">
                        <p className="font-medium">Nenhum evento cadastrado</p>
                        <p className="text-sm text-muted-foreground">
                            Crie um evento na aba &quot;Eventos&quot; para começar a receber inscrições.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {events.map(event => {
                        const eventId = event.id;
                        const isExpanded = expandedEvents.includes(eventId);
                        const enrollments = enrollmentsByEvent[eventId] || [];

                        return (
                            <Card key={event.id} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            {event.title}
                                        </CardTitle>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            {event.location && (
                                                <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                                                    {event.location}
                        </span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                                                {enrollments.length} inscrição(s)
                      </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => openCreateForEvent(event)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Nova inscrição
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => toggleEvent(eventId)}
                                        >
                                            {isExpanded ? 'Ocultar inscrições' : 'Ver inscrições'}
                                        </Button>
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="pb-6">
                                        {loadingEventId === eventId ? (
                                            <div className="flex items-center justify-center py-8">
                                                <CircleNotch className="h-6 w-6 animate-spin text-primary" />
                                                <span className="ml-2 text-sm text-muted-foreground">
                          Carregando inscrições...
                        </span>
                                            </div>
                                        ) : enrollments.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                Nenhuma inscrição para este evento ainda.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Aluno</TableHead>
                                                            <TableHead>Email</TableHead>
                                                            <TableHead>CPF</TableHead>
                                                            <TableHead>RA</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {enrollments.map(enr => (
                                                            <TableRow
                                                                key={enr.id}
                                                                className="cursor-pointer hover:bg-muted/60"
                                                                onClick={() => openDetails(enr)}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {enr.student?.name || '—'}
                                                                </TableCell>
                                                                <TableCell>{enr.student?.email || '—'}</TableCell>
                                                                <TableCell>{enr.student?.cpf || '—'}</TableCell>
                                                                <TableCell>{enr.student?.ra || '—'}</TableCell>
                                                                <TableCell>{renderStatusBadge(enr.status)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal de nova inscrição */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Nova inscrição
                            {eventForNewEnrollment ? ` - ${eventForNewEnrollment.title}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    {studentsError && (
                        <p className="text-sm text-destructive mb-2">
                            Erro ao carregar alunos: {studentsError}
                        </p>
                    )}

                    <div className="space-y-4">
                        <div>
                            <span className="block text-sm font-medium mb-1">Aluno *</span>
                            {studentsLoading && (
                                <p className="text-xs text-muted-foreground mb-1">
                                    Carregando alunos...
                                </p>
                            )}
                            <Select
                                value={selectedStudentId}
                                onValueChange={setSelectedStudentId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um aluno" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} — {s.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleCreateEnrollment}>
                                Criar inscrição
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setEventForNewEnrollment(null);
                                    setSelectedStudentId('');
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de detalhes da inscrição */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalhes da inscrição</DialogTitle>
                    </DialogHeader>

                    {selectedEnrollment && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-muted-foreground">
                                    Evento
                                </h3>
                                <p className="font-medium">
                                    {selectedEnrollment.event?.title || '—'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedEnrollment.event?.description || ''}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-muted-foreground">
                                    Aluno
                                </h3>
                                <p className="font-medium">{selectedEnrollment.student?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedEnrollment.student?.email}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    CPF: {selectedEnrollment.student?.cpf} · RA:{' '}
                                    {selectedEnrollment.student?.ra}
                                </p>
                                {selectedEnrollment.student?.phone && (
                                    <p className="text-xs text-muted-foreground">
                                        Telefone: {selectedEnrollment.student.phone}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-muted-foreground">
                                    Status
                                </h3>
                                {renderStatusBadge(selectedEnrollment.status)}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={
                                        cancelLoading ||
                                        selectedEnrollment.status.toLowerCase() === 'canceled' ||
                                        selectedEnrollment.status.toLowerCase() === 'cancelled'
                                    }
                                    onClick={handleCancelEnrollment}
                                >
                                    {cancelLoading ? (
                                        <>
                                            <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                                            Cancelando...
                                        </>
                                    ) : (
                                        'Cancelar inscrição'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDetailsOpen(false)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}