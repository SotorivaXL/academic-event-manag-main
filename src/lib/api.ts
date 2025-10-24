import { Student, ApiEvent, ApiEventDay } from './types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CreateStudentRequest {
  name: string;
  cpf: string;
  email?: string;
  ra: string;
  phone?: string;
}

export interface UpdateStudentRequest {
  name?: string;
  cpf?: string;
  email?: string;
  ra?: string;
  phone?: string;
}

export interface StudentListResponse {
  data: Student[];
  total: number;
  page: number;
  size: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  venue: string;
  capacity_total: number;
  workload_hours: number;
  min_presence_pct: number;
  start_at?: string | null;
  end_at?: string | null;
  status: string;
  tracks?: string[];
  speakers?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  venue?: string;
  capacity_total?: number;
  workload_hours?: number;
  min_presence_pct?: number;
  start_at?: string | null;
  end_at?: string | null;
  status?: string;
  tracks?: string[];
  speakers?: string[];
}

export interface EventResponse extends ApiEvent {}

export interface CreateEventDayRequest {
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  capacity: number;
  session_type?: string;
}

export interface UpdateEventDayRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  capacity?: number;
  session_type?: string;
}

export interface EventDayResponse extends ApiEventDay {}

const API_BASE_URL = 'https://events-backend-zug5.onrender.com/api/v1/demo';

class ApiService {
  private static baseURL = API_BASE_URL;
  private static refreshingPromise: Promise<boolean> | null = null;
  private static navigator = typeof window !== 'undefined' ? window.navigator : null;

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const result: LoginResponse = await response.json();
    this.storeTokens(result.access_token, result.refresh_token);
    return result;
  }

  static logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private static storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Try to refresh access token using refresh_token. Returns true if succeeded.
   * Prevents concurrent refreshes by returning the same promise while a refresh is in progress.
   */
  private static async refreshAccessToken(): Promise<boolean> {
    if (this.refreshingPromise) return this.refreshingPromise;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    this.refreshingPromise = (async () => {
      try {
        const res = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          // Refresh failed (expired/invalid) -> logout
          this.logout();
          return false;
        }

        const data = await res.json().catch(() => null) as any;
        if (!data || !data.access_token) {
          this.logout();
          return false;
        }

        const newAccess = data.access_token as string;
        const newRefresh = data.refresh_token || refreshToken;
        this.storeTokens(newAccess, newRefresh);
        return true;
      } catch (err) {
        // On network errors, treat as failed refresh
        console.error('[ApiService] refreshAccessToken error', err);
        this.logout();
        return false;
      } finally {
        // clear the in-flight promise reference
        this.refreshingPromise = null;
      }
    })();

    return this.refreshingPromise;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const doFetch = async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      return response;
    };

    let response = await doFetch();

    // If unauthorized, attempt token refresh (but avoid refreshing when calling auth endpoints)
    if (response.status === 401 && !endpoint.startsWith('/auth')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        config.headers = {
          ...(config.headers || {}),
          ...this.getAuthHeaders(),
        };
        response = await doFetch();
      } else {
        // refresh failed, provide clearer error
        // Ensure local session is cleared and redirect to login in the browser
        this.logout();
        if (typeof window !== 'undefined' && window.location) {
          window.location.assign('/login');
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      }
    }

    if (!response.ok) {
      // Try to surface server error message if present
      let errorText: string | null = null;
      try {
        const txt = await response.text();
        errorText = txt ? txt : null;
      } catch (e) {
        // ignore
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
    }

    // No content (204) -> return undefined for void responses
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    // If there's no body, return undefined
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') return undefined as unknown as T;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    // Fallback: try text then parse JSON if possible
    const text = await response.text();
    if (!text) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      return text as unknown as T;
    }
  }

  // Student endpoints
  static async getStudents(page: number = 1, size: number = 10): Promise<Student[]> {
    const endpoint = `/students?query=&page=${page}&size=${size}`;
    return this.request<Student[]>(endpoint);
  }

  static async listStudents(query: string = '', page: number = 1, size: number = 10): Promise<Student[]> {
    const endpoint = `/students?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
    return this.request<Student[]>(endpoint);
  }

  static async getStudent(id: string): Promise<Student> {
    return this.request<Student>(`/students/${id}`);
  }

  static async createStudent(student: CreateStudentRequest): Promise<Student> {
    return this.request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  static async updateStudent(id: string, student: UpdateStudentRequest): Promise<Student> {
    return this.request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  static async deleteStudent(id: string): Promise<void> {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Event endpoints
  static async getEvents(): Promise<EventResponse[]> {
    return this.request<EventResponse[]>('/events');
  }

  static async listEvents(): Promise<EventResponse[]> {
    return this.getEvents();
  }

  static async getEvent(id: string): Promise<EventResponse> {
    return this.request<EventResponse>(`/events/${id}`);
  }

  static async createEvent(event: CreateEventRequest): Promise<EventResponse> {
    return this.request<EventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  static async updateEvent(id: string, event: UpdateEventRequest): Promise<EventResponse> {
    return this.request<EventResponse>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  static async deleteEvent(id: string): Promise<void> {
    return this.request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Event Days Management Methods
  static async listEventDays(eventId: string): Promise<EventDayResponse[]> {
    return this.request<EventDayResponse[]>(`/events/${eventId}/days`);
  }

  static async createEventDay(eventId: string, dayData: CreateEventDayRequest): Promise<EventDayResponse> {
    return this.request<EventDayResponse>(`/events/${eventId}/days`, {
      method: 'POST',
      body: JSON.stringify(dayData),
    });
  }

  static async getEventDay(eventId: string, dayId: string): Promise<EventDayResponse> {
    return this.request<EventDayResponse>(`/events/${eventId}/days/${dayId}`);
  }

  static async updateEventDay(eventId: string, dayId: string, dayData: UpdateEventDayRequest): Promise<EventDayResponse> {
    return this.request<EventDayResponse>(`/events/${eventId}/days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(dayData),
    });
  }

  static async deleteEventDay(eventId: string, dayId: string): Promise<void> {
    return this.request<void>(`/events/${eventId}/days/${dayId}`, {
      method: 'DELETE',
    });
  }

  // Enrollment endpoints
  static async listEnrollments(eventId: string): Promise<any[]> {
    // Backend expects query param event_id
    const endpoint = `/enrollments?event_id=${encodeURIComponent(eventId)}`;
    return this.request<any[]>(endpoint);
  }
}

export { ApiService };
