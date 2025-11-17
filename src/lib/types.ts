// src/lib/types.ts

export interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    capacity: number;
    startDate: string;
    endDate: string;
    sessions: Session[];
    minAttendancePercentage: number;
    status: 'draft' | 'published' | 'completed';
    eventDays?: EventDay[];
    tracks?: string[];
    speakers?: string[];
}

export interface ApiEvent {
    id: number;
    client_id: number;
    title: string;
    description: string;
    venue: string;
    capacity_total: number;
    workload_hours: number;
    min_presence_pct: number;
    start_at: string | null;
    end_at: string | null;
    status: string;
    tracks?: string[];
    speakers?: string[];
}

export interface Session {
    id: string;
    eventId: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    capacity?: number;
    sessionType?: string;
}

export interface ApiEventDay {
    id: number;
    event_id: number;
    date: string;
    start_time: string;
    end_time: string;
    room: string;
    capacity: number;
    session_type?: string;
}

export interface EventDay {
    id: string;
    eventId: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    capacity: number;
    sessionType?: string;
}

export interface Student {
    id: number;
    client_id: number;
    name: string;
    email: string;
    cpf: string;
    ra?: string;
    phone?: string;
}

export interface Enrollment {
    id: string;
    studentId: string;
    eventId: string;
    status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled';
    enrolledAt: string;
    qrCode: string;
}

export interface Attendance {
    id: string;
    enrollmentId: string;
    sessionId: string;
    checkedInAt: string;
    checkedOutAt?: string;
    isValid: boolean;
}

export interface Certificate {
    id: string;
    enrollmentId: string;
    issuedAt: string;
    pdfUrl?: string;
    verificationCode: string;
    status: 'issued' | 'revoked';
}

export type UserRole =
    | 'admin'
    | 'organizer'
    | 'gatekeeper'
    | 'student'
    | 'client'
    | 'cliente'
    | string;

export interface User {
    id: number;
    name: string;
    email: string;
    status?: string;
    mfa?: boolean;
    roles?: string[];
    role?: UserRole;
}

export interface Client {
    id: number;
    name: string;
    cnpj: string;
    slug: string;
    logo_url?: string;
    contact_email: string;
    contact_phone?: string | null;
    certificate_template_html: string;
    default_min_presence_pct: number;
    lgpd_policy_text: string;
    config_json: Record<string, unknown>;
}