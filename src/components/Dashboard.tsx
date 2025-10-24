import React from 'react';
import { Event, Student, Enrollment, Attendance, Certificate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Users, Certificate as CertificateIcon } from '@phosphor-icons/react';

interface DashboardProps {
  events: Event[];
  students: Student[];
  enrollments: Enrollment[];
  attendances: Attendance[];
  certificates: Certificate[];
}

export function Dashboard({ events, students, enrollments, attendances, certificates }: DashboardProps) {
  const activeEvents = events.filter(e => e.status === 'published');
  const completedEvents = events.filter(e => e.status === 'completed');
  const totalEnrollments = enrollments.length;
  const confirmedEnrollments = enrollments.filter(e => e.status === 'confirmed');
  const issuedCertificates = certificates.filter(c => c.status === 'issued');

  const stats = [
    {
      title: 'Eventos Ativos',
      value: activeEvents.length,
      icon: Calendar,
      color: 'text-primary'
    },
    {
      title: 'Total de Alunos',
      value: students.length,
      icon: Users,
      color: 'text-accent'
    },
    {
      title: 'Inscrições Confirmadas',
      value: confirmedEnrollments.length,
      icon: GraduationCap,
      color: 'text-green-600'
    },
    {
      title: 'Certificados Emitidos',
      value: issuedCertificates.length,
      icon: CertificateIcon,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema de gerenciamento de eventos acadêmicos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge 
                    variant={event.status === 'published' ? 'default' : 
                             event.status === 'completed' ? 'secondary' : 'outline'}
                  >
                    {event.status === 'published' ? 'Ativo' :
                     event.status === 'completed' ? 'Concluído' : 'Rascunho'}
                  </Badge>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum evento cadastrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendances.slice(-5).reverse().map((attendance) => {
                const enrollment = enrollments.find(e => e.id === attendance.enrollmentId);
                const student = enrollment ? students.find(s => s.id.toString() === enrollment.studentId) : null;
                const event = enrollment ? events.find(e => e.id === enrollment.eventId) : null;
                
                return (
                  <div key={attendance.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student?.name || 'Aluno desconhecido'}</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in em {event?.title || 'Evento desconhecido'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {new Date(attendance.checkedInAt).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                );
              })}
              {attendances.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}