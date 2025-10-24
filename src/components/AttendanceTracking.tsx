import React, { useState } from 'react';
import { Event, Student, Enrollment, Attendance } from '@/lib/types';
import { generateId, formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { QrCode, CheckCircle, Clock, Users, Scan } from '@phosphor-icons/react';
import { showSuccess, showError } from '@/lib/toast';
import { useEnrollments } from '@/hooks/useEnrollments';

interface AttendanceTrackingProps {
  events: Event[];
  students: Student[];
  enrollments: Enrollment[];
  attendances: Attendance[];
  onAttendanceCreate: (attendance: Attendance) => void;
}

export function AttendanceTracking({ 
  events, 
  students, 
  enrollments, 
  attendances, 
  onAttendanceCreate 
}: AttendanceTrackingProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  // Fetch latest enrollments for the selected event from API
  const { enrollments: remoteEnrollments, loading: enrollmentsLoading } = useEnrollments(selectedEventId || undefined);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedSession = selectedEvent?.sessions.find(s => s.id === selectedSessionId);

  // Use remote enrollments when an event is selected.
  // While remote data is loading keep the local `enrollments` prop as fallback; once loading finishes use remote (even if empty).
  const sourceEnrollments = selectedEventId ? (enrollmentsLoading ? enrollments : remoteEnrollments) : enrollments;

  const handleQRScan = () => {
    if (!selectedEventId || !selectedSessionId || !qrInput.trim()) {
      showError('Selecione um evento, sessão e insira o código QR');
      return;
    }

    setIsScanning(true);
    
    // Simulate QR scanning delay
    setTimeout(() => {
      // Find enrollment by QR code
      const enrollment = sourceEnrollments.find(e =>
        e.qrCode === qrInput.trim() &&
        e.eventId === selectedEventId &&
        e.status === 'confirmed'
      );

      if (!enrollment) {
        showError('QR Code inválido ou inscrição não confirmada');
        setIsScanning(false);
        return;
      }

      // Check if already checked in for this session
      const existingAttendance = attendances.find(a => 
        a.enrollmentId === enrollment.id && 
        a.sessionId === selectedSessionId
      );

      if (existingAttendance) {
        if (!existingAttendance.checkedOutAt) {
          // In a real app, this would be an update operation to persist check-out
          showSuccess('Check-out realizado com sucesso');
        } else {
          showError('Aluno já realizou check-in e check-out para esta sessão');
        }
        setIsScanning(false);
        return;
      }

      // Create new attendance record
      const newAttendance: Attendance = {
        id: generateId(),
        enrollmentId: enrollment.id,
        sessionId: selectedSessionId,
        checkedInAt: new Date().toISOString(),
        isValid: true
      };

      onAttendanceCreate(newAttendance);
      
      const student = students.find(s => s.id.toString() === enrollment.studentId);
      showSuccess(`Check-in realizado: ${student?.name}`);

      setQrInput('');
      setIsScanning(false);
    }, 1000);
  };

  const getSessionAttendances = (sessionId: string) => {
    return attendances.filter(a => a.sessionId === sessionId);
  };

  const getEventEnrollments = (eventId: string) => {
    return sourceEnrollments.filter(e => e.eventId === eventId && e.status === 'confirmed');
  };

  const getAttendanceStats = (eventId: string) => {
    const eventEnrollments = getEventEnrollments(eventId);
    const eventAttendances = attendances.filter(a => 
      eventEnrollments.some(e => e.id === a.enrollmentId)
    );
    
    const totalSessions = selectedEvent?.sessions.length || 0;
    const totalPossibleAttendances = eventEnrollments.length * totalSessions;
    const actualAttendances = eventAttendances.length;
    
    return {
      enrolled: eventEnrollments.length,
      attendanceRate: totalPossibleAttendances > 0 ? Math.round((actualAttendances / totalPossibleAttendances) * 100) : 0,
      totalAttendances: actualAttendances
    };
  };

  const activeEvents = events.filter(e => e.status === 'published' || e.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Controle de Presença</h2>
        <p className="text-muted-foreground">Registre a presença dos participantes via QR Code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scanner de Presença
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Selecionar Evento</Label>
              <Select value={selectedEventId} onValueChange={(value) => {
                setSelectedEventId(value);
                setSelectedSessionId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um evento" />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <div>
                <Label>Selecionar Sessão</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedEvent.sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {formatDate(session.date)} - {formatTime(session.startTime)} às {formatTime(session.endTime)} 
                        {session.room && ` (${session.room})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="qr-input">Código QR do Aluno</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-input"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Digite ou escaneie o código QR"
                  onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                />
                <Button 
                  onClick={handleQRScan}
                  disabled={isScanning || !selectedEventId || !selectedSessionId || !qrInput.trim()}
                  className="gap-2"
                >
                  {isScanning ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {isScanning ? 'Processando...' : 'Registrar'}
                </Button>
              </div>
            </div>

            {selectedSession && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Sessão Atual</span>
                  <Badge variant="outline">{formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedSession.date)} • {selectedSession.room || 'Sala não especificada'}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Presenças registradas</span>
                    <span>{getSessionAttendances(selectedSession.id).length}</span>
                  </div>
                  <Progress 
                    value={(getSessionAttendances(selectedSession.id).length / getEventEnrollments(selectedEventId).length) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEventId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas do Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const stats = getAttendanceStats(selectedEventId);
                const event = events.find(e => e.id === selectedEventId);
                
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{event?.title}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Inscritos confirmados</p>
                          <p className="text-2xl font-bold">{stats.enrolled}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taxa de presença</p>
                          <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-3">Presença por Sessão</h5>
                      <div className="space-y-2">
                        {event?.sessions.map(session => {
                          const sessionAttendances = getSessionAttendances(session.id);
                          const attendanceRate = stats.enrolled > 0 ? 
                            Math.round((sessionAttendances.length / stats.enrolled) * 100) : 0;
                          
                          return (
                            <div key={session.id} className="flex items-center justify-between text-sm">
                              <div>
                                <p>{formatDate(session.date)} {formatTime(session.startTime)}</p>
                                {session.room && <p className="text-muted-foreground text-xs">{session.room}</p>}
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs">
                                  {sessionAttendances.length}/{stats.enrolled}
                                </Badge>
                                <p className="text-xs text-muted-foreground">{attendanceRate}%</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Presença - Tempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status da Inscrição</TableHead>
                  <TableHead>Sessões Participadas</TableHead>
                  <TableHead>Última Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getEventEnrollments(selectedEventId).map(enrollment => {
                  const student = students.find(s => s.id.toString() === enrollment.studentId);
                  const studentAttendances = attendances.filter(a => a.enrollmentId === enrollment.id);
                  const lastAttendance = studentAttendances.sort((a, b) => 
                    new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
                  )[0];
                  
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{student?.name}</TableCell>
                      <TableCell>{student?.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">Confirmado</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{studentAttendances.length}/{selectedEvent?.sessions.length || 0}</span>
                          <Progress 
                            value={selectedEvent ? (studentAttendances.length / selectedEvent.sessions.length) * 100 : 0}
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastAttendance ? (
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {new Date(lastAttendance.checkedInAt).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhuma presença</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeEvents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum evento ativo</p>
            <p className="text-muted-foreground">Publique um evento para começar a registrar presenças</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}