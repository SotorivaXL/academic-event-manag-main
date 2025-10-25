import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Event, Student, Enrollment, Attendance, Certificate } from '../lib/types'
import { useEvents } from '../hooks/useEvents'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dashboard } from './Dashboard'
import { EventManagement } from './EventManagement'
import { StudentManagement } from './StudentManagement'
import { AttendanceTracking } from './AttendanceTracking'
import { CertificateManagement } from './CertificateManagement'
import { AppHeader } from './AppHeader'
import { 
  Calendar, 
  Users, 
  QrCode, 
  Certificate as CertificateIcon,
  ChartBar 
} from '@phosphor-icons/react'

export function MainApp() {
  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent, getEventById } = useEvents()

  const [students, setStudents] = useKV<Student[]>('students', [])
  const [enrollments, setEnrollments] = useKV<Enrollment[]>('enrollments', [])
  const [attendances, setAttendances] = useKV<Attendance[]>('attendances', [])
  const [certificates, setCertificates] = useKV<Certificate[]>('certificates', [])

  const handleEventCreate = async (event: Event & { workloadHours?: number }) => {
    await createEvent(event)
  }

  const handleEventUpdate = async (updatedEvent: Event) => {
    await updateEvent(updatedEvent.id, updatedEvent)
  }

  const handleEventDelete = async (eventId: string) => {
    const success = await deleteEvent(eventId)
    if (success) {
      setEnrollments((current) => (current || []).filter(enrollment => enrollment.eventId !== eventId))
      const enrollmentIds = (enrollments || [])
        .filter(enrollment => enrollment.eventId === eventId)
        .map(enrollment => enrollment.id)
      setAttendances((current) => 
        (current || []).filter(attendance => !enrollmentIds.includes(attendance.enrollmentId))
      )
      setCertificates((current) => 
        (current || []).filter(cert => !enrollmentIds.includes(cert.enrollmentId))
      )
    }
  }

  const handleEnrollmentCreate = (enrollment: Enrollment) => {
    setEnrollments((current) => [...(current || []), enrollment])
  }

  const handleAttendanceCreate = (attendance: Attendance) => {
    setAttendances((current) => [...(current || []), attendance])
  }

  const handleCertificateCreate = (certificate: Certificate) => {
    setCertificates((current) => [...(current || []), certificate])
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-2">
              <ChartBar className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Presença</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <CertificateIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Certificados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              events={events || []}
              students={students || []}
              enrollments={enrollments || []}
              attendances={attendances || []}
              certificates={certificates || []}
            />
          </TabsContent>

          <TabsContent value="events">
            <EventManagement
              events={events || []}
              loading={eventsLoading}
              onEventCreate={handleEventCreate}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement
              events={events || []}
              enrollments={enrollments || []}
              onEnrollmentCreate={handleEnrollmentCreate}
            />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTracking
              events={events || []}
              students={students || []}
              enrollments={enrollments || []}
              attendances={attendances || []}
              onAttendanceCreate={handleAttendanceCreate}
            />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificateManagement
              events={events || []}
              students={students || []}
              enrollments={enrollments || []}
              attendances={attendances || []}
              certificates={certificates || []}
              onCertificateCreate={handleCertificateCreate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}