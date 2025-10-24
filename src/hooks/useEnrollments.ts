import { useState, useEffect, useCallback } from 'react'
import { Enrollment } from '@/lib/types'
import { ApiService } from '@/lib/api'
import { showError } from '@/lib/toast'

// Transform API enrollment (guessing backend fields) to local Enrollment interface
const transformApiEnrollment = (api: any): Enrollment => ({
  id: api.id?.toString() ?? String(api.id),
  studentId: api.student_id?.toString() ?? api.studentId?.toString() ?? String(api.studentId ?? ''),
  eventId: api.event_id?.toString() ?? api.eventId?.toString() ?? String(api.eventId ?? ''),
  status: api.status ?? 'pending',
  enrolledAt: api.enrolled_at ?? api.enrolledAt ?? new Date().toISOString(),
  qrCode: api.qr_code ?? api.qrCode ?? ''
})

export function useEnrollments(eventId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eventId) {
      setEnrollments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await ApiService.listEnrollments(eventId);
      console.log ('Enrollments API response:', res);
      const transformed = Array.isArray(res) ? res.map(transformApiEnrollment) : []
      setEnrollments(transformed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar inscrições'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  return { enrollments, loading, error, reload: load }
}

