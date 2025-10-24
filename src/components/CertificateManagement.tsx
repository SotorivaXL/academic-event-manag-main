import React, { useState } from 'react';
import { Event, Student, Enrollment, Attendance, Certificate } from '@/lib/types';
import { generateId, generateVerificationCode, calculateAttendancePercentage, isEligibleForCertificate, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Certificate as CertificateIcon, Download, Medal, CheckCircle, XCircle, FileText } from '@phosphor-icons/react';
import { showSuccess, showError, showInfo } from '@/lib/toast';

interface CertificateManagementProps {
  events: Event[];
  students: Student[];
  enrollments: Enrollment[];
  attendances: Attendance[];
  certificates: Certificate[];
  onCertificateCreate: (certificate: Certificate) => void;
}

export function CertificateManagement({
  events,
  students,
  enrollments,
  attendances,
  certificates,
  onCertificateCreate
}: CertificateManagementProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<{
    student: Student;
    event: Event;
    attendanceRate: number;
  } | null>(null);

  const generateCertificateForEnrollment = (enrollment: Enrollment) => {
    const event = events.find(e => e.id === enrollment.eventId);
    const student = students.find(s => s.id.toString() === enrollment.studentId);
    const enrollmentAttendances = attendances.filter(a => a.enrollmentId === enrollment.id);

    if (!event || !student) return null;

    const attendancePercentage = calculateAttendancePercentage(enrollmentAttendances);
    if (!isEligibleForCertificate(attendancePercentage, event.minAttendancePercentage)) {
      return null;
    }

    // Check if certificate already exists
    const existingCertificate = certificates.find(c => c.enrollmentId === enrollment.id);
    if (existingCertificate && existingCertificate.status === 'issued') {
      return null;
    }

    const certificate: Certificate = {
      id: generateId(),
      enrollmentId: enrollment.id,
      issuedAt: new Date().toISOString(),
      verificationCode: generateVerificationCode(),
      status: 'issued',
      pdfUrl: `/certificates/${generateId()}.pdf` // Simulated PDF URL
    };

    return certificate;
  };

  const handleBatchGeneration = async () => {
    if (!selectedEventId) {
      showError('Selecione um evento');
      return;
    }

    setIsGeneratingBatch(true);

    // Simulate batch generation delay
    setTimeout(() => {
      const eventEnrollments = enrollments.filter(e => 
        e.eventId === selectedEventId && e.status === 'confirmed'
      );

      let generatedCount = 0;
      
      eventEnrollments.forEach(enrollment => {
        const certificate = generateCertificateForEnrollment(enrollment);
        if (certificate) {
          onCertificateCreate(certificate);
          generatedCount++;
        }
      });

      if (generatedCount > 0) {
        showSuccess(`${generatedCount} certificado(s) gerado(s) com sucesso`);
      } else {
        showInfo('Nenhum certificado foi gerado. Verifique os critérios de elegibilidade.');
      }

      setIsGeneratingBatch(false);
    }, 2000);
  };

  const getEligibleStudents = (eventId: string) => {
    const eventEnrollments = enrollments.filter(e => 
      e.eventId === eventId && e.status === 'confirmed'
    );
    
    return eventEnrollments.map(enrollment => {
      const student = students.find(s => s.id.toString() === enrollment.studentId);
      const event = events.find(e => e.id === eventId);
      const enrollmentAttendances = attendances.filter(a => a.enrollmentId === enrollment.id);
      
      if (!student || !event) return null;
      
      const attendanceRate = calculateAttendancePercentage(enrollmentAttendances);
      const eligible = isEligibleForCertificate(attendanceRate, event.minAttendancePercentage);
      const existingCertificate = certificates.find(c => c.enrollmentId === enrollment.id);
      
      return {
        enrollment,
        student,
        event,
        attendanceRate,
        eligible,
        hasCertificate: !!existingCertificate,
        certificate: existingCertificate
      };
    }).filter(Boolean);
  };

  const completedEvents = events.filter(e => e.status === 'completed' || e.status === 'published');

  const handlePreviewCertificate = (student: Student, event: Event, attendanceRate: number) => {
    setPreviewCertificate({ student, event, attendanceRate });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Certificados</h2>
          <p className="text-muted-foreground">Gere e gerencie certificados baseados na presença mínima</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total de Certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-sm text-muted-foreground">
              {certificates.filter(c => c.status === 'issued').length} emitidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Eventos com Certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(certificates.map(c => {
                const enrollment = enrollments.find(e => e.id === c.enrollmentId);
                return enrollment?.eventId;
              })).size}
            </div>
            <p className="text-sm text-muted-foreground">
              de {completedEvents.length} eventos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Taxa de Certificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.length > 0 ? Math.round((certificates.length / enrollments.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              dos inscritos certificados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geração em Lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Selecionar Evento</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um evento para gerar certificados" />
                </SelectTrigger>
                <SelectContent>
                  {completedEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} ({event.status === 'completed' ? 'Concluído' : 'Em andamento'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleBatchGeneration}
              disabled={!selectedEventId || isGeneratingBatch}
              className="gap-2"
            >
              {isGeneratingBatch ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Medal className="h-4 w-4" />
                  Gerar Certificados
                </>
              )}
            </Button>
          </div>
          
          {selectedEventId && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Prévia da geração:</p>
              {(() => {
                const eligible = getEligibleStudents(selectedEventId);
                const eligibleCount = eligible.filter(s => s?.eligible && !s?.hasCertificate).length;
                const event = events.find(e => e.id === selectedEventId);
                
                return (
                  <div className="text-sm space-y-1">
                    <p><strong>Evento:</strong> {event?.title}</p>
                    <p><strong>Presença mínima exigida:</strong> {event?.minAttendancePercentage}%</p>
                    <p><strong>Alunos elegíveis:</strong> {eligibleCount}</p>
                    <p><strong>Já possuem certificado:</strong> {eligible.filter(s => s?.hasCertificate).length}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Status dos Alunos - {events.find(e => e.id === selectedEventId)?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Presença</TableHead>
                  <TableHead>Elegibilidade</TableHead>
                  <TableHead>Status do Certificado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getEligibleStudents(selectedEventId).map((item, index) => {
                  if (!item) return null;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.student.name}</p>
                          <p className="text-sm text-muted-foreground">{item.student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={item.attendanceRate} className="w-16 h-2" />
                            <span className="text-sm">{item.attendanceRate}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attendances.filter(a => a.enrollmentId === item.enrollment.id).length}/{item.event.sessions.length} sessões
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.eligible ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {item.eligible ? 'Elegível' : 'Não elegível'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.hasCertificate ? (
                          <Badge variant="default">Certificado emitido</Badge>
                        ) : item.eligible ? (
                          <Badge variant="outline">Pendente</Badge>
                        ) : (
                          <Badge variant="secondary">Não elegível</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewCertificate(item.student, item.event, item.attendanceRate)}
                            className="gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Visualizar
                          </Button>
                          {item.hasCertificate && (
                            <Button size="sm" variant="outline" className="gap-1">
                              <Download className="h-3 w-3" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {completedEvents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CertificateIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum evento concluído</p>
            <p className="text-muted-foreground">Complete eventos para começar a gerar certificados</p>
          </CardContent>
        </Card>
      )}

      {/* Certificate Preview Dialog */}
      <Dialog open={!!previewCertificate} onOpenChange={() => setPreviewCertificate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prévia do Certificado</DialogTitle>
          </DialogHeader>
          {previewCertificate && (
            <div className="border-2 border-dashed border-muted-foreground/50 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-primary">CERTIFICADO DE PARTICIPAÇÃO</h3>
                  <div className="w-32 h-1 bg-accent mx-auto mt-2"></div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-lg">
                    Certificamos que
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {previewCertificate.student.name}
                  </p>
                  <p className="text-lg">
                    participou do evento acadêmico
                  </p>
                  <p className="text-xl font-semibold">
                    {previewCertificate.event.title}
                  </p>
                </div>

                <div className="space-y-2">
                  <p>Realizado no período de {formatDate(previewCertificate.event.startDate)} a {formatDate(previewCertificate.event.endDate)}</p>
                  <p>Com {previewCertificate.attendanceRate}% de presença</p>
                  <p>Carga horária: {previewCertificate.event.sessions.length * 2}h</p>
                </div>

                <div className="pt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Emitido em: {formatDate(new Date().toISOString())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Código de verificação: {generateVerificationCode()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}