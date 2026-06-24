import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 & auto-refresh ─────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token!));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry &&
        (error.response.data as any)?.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
};

export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  resetPassword: (id: string, newPassword: string) => api.patch(`/users/${id}/reset-password`, { newPassword }),
  updatePermissions: (id: string, permissions: unknown[], useCustom: boolean) =>
    api.patch(`/users/${id}/permissions`, { permissions, useCustomPermissions: useCustom }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const studentsApi = {
  list: (params?: Record<string, unknown>) => api.get('/students', { params }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: Record<string, unknown>) => api.post('/students', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/students/${id}`, data),
  enroll: (id: string, courseId: string, batchId?: string) =>
    api.post(`/students/${id}/enroll`, { courseId, batchId }),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const teachersApi = {
  list: (params?: Record<string, unknown>) => api.get('/teachers', { params }),
  get: (id: string) => api.get(`/teachers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/teachers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/teachers/${id}`, data),
};

export const coursesApi = {
  list: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  create: (data: Record<string, unknown>) => api.post('/courses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

export const batchesApi = {
  list: (params?: Record<string, unknown>) => api.get('/batches', { params }),
  create: (data: Record<string, unknown>) => api.post('/batches', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/batches/${id}`, data),
  enroll: (id: string, studentId: string) => api.patch(`/batches/${id}/enroll`, { studentId }),
};

export const feesApi = {
  list: (params?: Record<string, unknown>) => api.get('/fees', { params }),
  create: (data: Record<string, unknown>) => api.post('/fees', data),
  addPayment: (id: string, data: Record<string, unknown>) => api.post(`/fees/${id}/payment`, data),
  overdueList: () => api.get('/fees/overdue/list'),
  bulkGenerate: (data: Record<string, unknown>) => api.post('/fees/bulk-generate', data),
  collectionSummary: (params?: Record<string, unknown>) => api.get('/fees/collection/summary', { params }),
};

export const salaryApi = {
  list: (params?: Record<string, unknown>) => api.get('/salary', { params }),
  calculate: (data: Record<string, unknown>) => api.post('/salary/calculate', data),
  pay: (id: string, data: Record<string, unknown>) => api.patch(`/salary/${id}/pay`, data),
  summary: (params?: Record<string, unknown>) => api.get('/salary/summary/monthly', { params }),
};

export const attendanceApi = {
  list: (params?: Record<string, unknown>) => api.get('/attendance', { params }),
  bulkMark: (data: Record<string, unknown>) => api.post('/attendance/bulk', data),
  analytics: (params?: Record<string, unknown>) => api.get('/attendance/analytics/monthly', { params }),
  studentReport: (studentId: string, month: string) => api.get(`/attendance/student/${studentId}/report`, { params: { month } }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard'),
};

export const reportsApi = {
  profitLoss: (params?: Record<string, unknown>) => api.get('/reports/profit-loss', { params }),
  feeCollection: (params?: Record<string, unknown>) => api.get('/reports/fee-collection', { params }),
  attendance: (params?: Record<string, unknown>) => api.get('/reports/attendance', { params }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

export const auditLogsApi = {
  list: (params?: Record<string, unknown>) => api.get('/audit-logs', { params }),
};

export default api;
