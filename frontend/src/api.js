/* ── API configuration ─────────────────────────────────────────────────────────────────────────
 * VITE_API_BASE_URL is the full API root, including the version prefix (verified against the deployed
 * backend's OpenAPI spec: every route lives under /api/v1).
 *   Vercel / production : https://api.avinyaa.tech/api/v1          (cross-origin, Bearer JWT)
 *   Local development   : unset or /api/v1                        (Vite dev proxy -> localhost:8000)
 *   Docker (nginx)      : unset                                    (same-origin /api/ proxied by nginx)
 * Only non-secret values belong in VITE_* variables; they are readable in the browser.
 */
const DEFAULT_API_BASE = '/api/v1';
const stripSlash = (value) => String(value).trim().replace(/\/+$/, '');
export const API_BASE_URL = stripSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE);
const BASE = API_BASE_URL;
const isAbsoluteHttp = (value) => /^https?:\/\//i.test(value);
/** Origin that serves backend files (/uploads, /media). Defaults to the API origin; override with VITE_ASSET_BASE_URL. */
const ASSET_ORIGIN = (() => {
  const explicit = import.meta.env.VITE_ASSET_BASE_URL;
  if (explicit) return stripSlash(explicit);
  if (isAbsoluteHttp(API_BASE_URL)) { try { return new URL(API_BASE_URL).origin; } catch { /* fall through */ } }
  return '';
})();
/**
 * Resolves a backend-hosted file URL for use in <img src>. Absolute (http/https), protocol-relative, data: and
 * blob: URLs are returned untouched; root-relative paths such as /uploads/puzzles/... are served by the backend
 * origin (same origin in dev/Docker, where ASSET_ORIGIN is empty).
 */
export function assetUrl(url) {
  if (!url || typeof url !== 'string') return url || null;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return url;
  return url.startsWith('/') ? ASSET_ORIGIN + url : url;
}
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60000;
const LONG_TIMEOUT_MS = Math.max(DEFAULT_TIMEOUT_MS, 300000);   // uploads and AI generation can be slow
const isLongRequest = (path, isFormData) => isFormData || /generate|regenerate|upload/i.test(path);
/** fetch with a timeout and readable network errors. Every request, including downloads, goes through this. */
async function apiFetch(path, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(BASE + path, controller ? { ...init, signal: controller.signal } : init);
  } catch (cause) {
    const timedOut = cause?.name === 'AbortError';
    const error = new Error(timedOut
      ? 'The server took too long to respond. Please try again.'
      : 'Cannot reach the GamifiEd server. Check your internet connection and try again.');
    error.status = 0;
    error.code = timedOut ? 'timeout' : 'network';
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export const auth = {
  get token() { return localStorage.getItem('gamified_token'); },
  set(token) { token ? localStorage.setItem('gamified_token', token) : localStorage.removeItem('gamified_token'); },
};

function validationMessage(detail) {
  if (!Array.isArray(detail)) return detail;
  return detail.map((error) => {
    const path = (error.loc || []).filter((part) => part !== 'body').join('.');
    return path ? `${path}: ${error.msg}` : error.msg;
  }).join(' ');
}

function requireGameType(body, gameType) {
  if (!body || body.game_type !== gameType) throw new Error(`${gameType} requests require game_type: '${gameType}'.`);
  return body;
}

async function request(path, { method = 'GET', body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
  };
  const res = await apiFetch(path, {
    method,
    headers,
    body: body == null ? undefined : (isFormData ? body : JSON.stringify(body)),
  }, isLongRequest(path, isFormData) ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  if (res.status === 401 && auth.token) { auth.set(null); window.location.href = '/'; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = validationMessage(data.detail) || 'Something went wrong. Try again.';
    const error = new Error(message);
    error.status = res.status;   // lets screens show a status-appropriate, teacher-friendly message
    throw error;
  }
  return data;
}

export const api = {
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  // teacher
  topics: () => request('/teacher/topics'),
  topic: (id) => request(`/teacher/topics/${id}`),
  quiz: {
    createTopic: (body) => request('/teacher/topics', { method: 'POST', body }),
    generate: (id, body) => request(`/teacher/topics/${id}/quiz/generate`, { method: 'POST', body: requireGameType(body, 'quiz') }),
    editDraft: (id, items) => request(`/teacher/activities/${id}/draft`, { method: 'PUT', body: { game_type: 'quiz', items } }),
  },
  matching: {
    createTopic: (body) => request('/teacher/topics', { method: 'POST', body }),
    generate: (id, body) => request(`/teacher/matching/topics/${id}/generate`, { method: 'POST', body: requireGameType(body, 'matching') }),
    editDraft: (id, items) => request(`/teacher/activities/${id}/draft`, { method: 'PUT', body: { game_type: 'matching', items: items.map(({ lefts, rights, ...item }) => item) } }),
  },
  sequencing: {
    uploadMaterial: (file, subject, grade) => { const body = new FormData(); body.append('file', file); body.append('subject', subject); body.append('grade', String(grade)); return request('/teacher/sequencing/upload', { method: 'POST', body }); },
    generate: (body) => request('/teacher/sequencing/generate', { method: 'POST', body: requireGameType(body, 'sequencing') }),
    draft: (id) => request(`/teacher/sequencing/${id}/draft`),
    editDraft: (id, body) => request(`/teacher/sequencing/${id}/draft`, { method: 'PUT', body }),
    deleteDraft: (id) => request(`/teacher/sequencing/${id}/draft`, { method: 'DELETE' }),
    approve: (id) => request(`/teacher/sequencing/${id}/approve`, { method: 'POST', body: {} }),
    publish: (id, body) => request(`/teacher/sequencing/${id}/publish`, { method: 'POST', body }),
    regenerate: (id) => request(`/teacher/sequencing/${id}/regenerate`, { method: 'POST', body: {} }),
    regenerateQuestion: (activityId, questionId) => request(`/teacher/sequencing/${activityId}/questions/${questionId}/regenerate`, { method: 'POST', body: {} }),
    regenerateImage: (activityId, questionId, itemId) => request(`/teacher/sequencing/${activityId}/image/${questionId}/${encodeURIComponent(itemId)}/regenerate`, { method: 'POST', body: {} }),
  },
  createTopic: (b) => request('/teacher/topics', { method: 'POST', body: b }),
  generate: (id, body) => request(`/teacher/topics/${id}/generate`, { method: 'POST', body: { ...requireGameType(body, 'quiz'), games: ['quiz'] } }),
  jobs: (id) => request(`/teacher/topics/${id}/jobs`),
  job: (id) => request(`/teacher/generation-jobs/${id}`),
  results: (id) => request(`/teacher/topics/${id}/results`),
  preview: (id) => request(`/teacher/activities/${id}/preview`),
  editVersion: (id, items) => request(`/teacher/versions/${id}`, { method: 'PUT', body: { items } }),
  approve: (id) => request(`/teacher/activities/${id}/approve`, { method: 'POST', body: {} }),
  reject: (id, reason) => request(`/teacher/activities/${id}/reject`, { method: 'POST', body: { reason } }),
  publish: (id, body = {}) => request(`/teacher/activities/${id}/publish`, { method: 'POST', body }),
  deleteActivity: (id) => request(`/teacher/activities/${id}`, { method: 'DELETE' }),
  unpublishActivity: (id) => request(`/teacher/activities/${id}/unpublish`, { method: 'POST', body: {} }),
  activityClassrooms: (id) => request(`/teacher/activities/${id}/classrooms`),
  regenerate: (id) => request(`/teacher/activities/${id}/regenerate`, { method: 'POST' }),
  teacherDashboard: () => request('/teacher/dashboard'),
  topicDetailedReport: (id) => request(`/teacher/topics/${id}/detailed-report`),
  studentProgress: () => request('/teacher/students-progress'),
  classroomStudents: (id) => request(`/teacher/classroom/${id}/students`),
  classrooms: () => request('/teacher/classrooms'),
  classroom: (id) => request(`/teacher/classrooms/${id}`),
  createClassroom: (b) => request('/teacher/classrooms', { method: 'POST', body: b }),
  updateClassroom: (id, b) => request(`/teacher/classrooms/${id}`, { method: 'PUT', body: b }),
  puzzle: {
    // Teacher API
    create: (body) => request('/teacher/puzzle/create', { method: 'POST', body }),
    listTeacher: () => request('/teacher/puzzle'),              // teacher: list own puzzles
    getReview: (id) => request(`/teacher/puzzle/${id}/review`),
    approve: (id, puzzleImageId) => request(`/teacher/puzzle/${id}/approve`, { method: 'POST', body: { puzzle_image_id: puzzleImageId } }),
    regenerate: (id, refinePrompt) => request(`/teacher/puzzle/${id}/regenerate`, { method: 'POST', body: { refine_prompt: refinePrompt || null } }),
    publish: (id, body) => request(`/teacher/puzzle/${id}/publish`, { method: 'POST', body }),
    delete: (id) => request(`/teacher/puzzle/${id}`, { method: 'DELETE' }),
    unpublish: (id) => request(`/teacher/puzzle/${id}/unpublish`, { method: 'POST', body: {} }),
    results: (id) => request(`/teacher/puzzle/${id}/results`),
    // Student API
    list: () => request('/student/puzzles'),
    get: (id) => request(`/student/puzzles/${id}`),
    start: (id) => request(`/student/puzzles/${id}/start`, { method: 'POST', body: {} }),
    saveProgress: (attemptId, state) => request(`/student/puzzles/attempts/${attemptId}/progress`, { method: 'PATCH', body: state }),
    verify: (attemptId, body) => request(`/student/puzzles/attempts/${attemptId}/verify`, { method: 'POST', body }),
  },
  crossword: {
    generate: (body) => request('/teacher/crosswords/generate', { method: 'POST', body }),
    list: () => request('/teacher/crosswords'),
    get: (id) => request(`/teacher/crosswords/${id}`),
    editWord: (id, wordId, body) => request(`/teacher/crosswords/${id}/words/${wordId}`, { method: 'PATCH', body }),
    deleteWord: (id, wordId) => request(`/teacher/crosswords/${id}/words/${wordId}`, { method: 'DELETE' }),
    addWord: (id, body) => request(`/teacher/crosswords/${id}/words`, { method: 'POST', body }),
    regenerate: (id, body) => request(`/teacher/crosswords/${id}/regenerate`, { method: 'POST', body }),
    relayout: (id) => request(`/teacher/crosswords/${id}/relayout`, { method: 'POST' }),
    approve: (id) => request(`/teacher/crosswords/${id}/approve`, { method: 'POST' }),
    publish: (id, body) => request(`/teacher/crosswords/${id}/publish`, { method: 'POST', body }),
    unpublish: (id) => request(`/teacher/crosswords/${id}/unpublish`, { method: 'POST' }),
    delete: (id) => request(`/teacher/crosswords/${id}`, { method: 'DELETE' }),
    results: (id) => request(`/teacher/crosswords/${id}/results`),
    startAttempt: (id) => request(`/student/crosswords/${id}/attempts/start`, { method: 'POST' }),
    saveProgress: (id, attemptId, body) => request(`/student/crosswords/${id}/attempts/${attemptId}/progress`, { method: 'PATCH', body }),
    checkCells: (id, attemptId, body) => request(`/student/crosswords/${id}/attempts/${attemptId}/check`, { method: 'POST', body }),
    revealCells: (id, attemptId, body) => request(`/student/crosswords/${id}/attempts/${attemptId}/reveal`, { method: 'POST', body }),
    completeAttempt: (id, attemptId) => request(`/student/crosswords/${id}/attempts/${attemptId}/complete`, { method: 'POST' }),
    listStudent: () => request('/student/crosswords'),
    getPlay: (id) => request(`/student/crosswords/${id}`),
    previewPlay: (id) => request(`/teacher/crosswords/${id}/play-preview`),
  },
  // Compatibility aliases
  uploadMaterial: (file, subject, grade) => api.sequencing.uploadMaterial(file, subject, grade),
  generateSequencing: (body) => api.sequencing.generate(body),
  sequencingDraft: (id) => api.sequencing.draft(id),
  editSequencingDraft: (id, body) => api.sequencing.editDraft(id, body),
  deleteSequencingDraft: (id) => api.sequencing.deleteDraft(id),
  approveSequencing: (id) => api.sequencing.approve(id),
  publishSequencing: (id, body) => api.sequencing.publish(id, body),
  regenerateSequencing: (id) => api.sequencing.regenerate(id),
  regenerateSequencingQuestion: (activityId, questionId) => api.sequencing.regenerateQuestion(activityId, questionId),
  regenerateSequencingImage: (activityId, questionId, itemId) => api.sequencing.regenerateImage(activityId, questionId, itemId),
  // teacher WhatsApp notifications
  notifications: {
    createAnnouncement: (body) => request('/teacher/notifications/announcements', { method: 'POST', body }),
    scheduleReminder: (body) => request('/teacher/notifications/reminders', { method: 'POST', body }),
    history: (page = 1, pageSize = 20) => request(`/teacher/notifications/history?page=${page}&page_size=${pageSize}`),
    analytics: () => request('/teacher/notifications/analytics'),
  },
  // student WhatsApp preferences
  whatsappPreferences: () => request('/students/me/whatsapp-preferences'),
  updateWhatsappPreferences: (body) => request('/students/me/whatsapp-preferences', { method: 'PUT', body }),
  // student
  activities: () => request('/student/activities'),
  progress: () => request('/student/progress'),
  studentDashboard: () => request('/student/dashboard'),
  studentClassrooms: () => request('/student/classrooms'),
  joinClassroom: (code) => request('/student/classrooms/join', { method: 'POST', body: { code } }),
  myActivities: () => request('/student/my-activities'),
  classroomActivities: (classroomId) => request(`/student/classrooms/${classroomId}/activities`),
  assignActivity: (classroomId, body) => request(`/teacher/classrooms/${classroomId}/activities`, { method: 'POST', body }),
  unassignActivity: (classroomId, activityId) => request(`/teacher/classrooms/${classroomId}/activities/${activityId}`, { method: 'DELETE' }),
  classroomAssignedActivities: (classroomId) => request(`/teacher/classrooms/${classroomId}/activities`),
  deleteClassroom: (id) => request(`/teacher/classrooms/${id}`, { method: 'DELETE' }),
  startAttempt: (b) => request('/student/attempts', { method: 'POST', body: b }),
  submit: (attempt, item_id, answer, submission_id) => request(`/student/attempts/${attempt}/responses`, { method: 'POST', body: { item_id, answer, ...(submission_id ? { submission_id } : {}) } }),
  checkMatch: (attempt, item_id, left_id, right_id) => request(`/student/attempts/${attempt}/matches`, { method: 'POST', body: { item_id, left_id, right_id } }),
  hint: (attempt, item_id) => request(`/student/attempts/${attempt}/hints`, { method: 'POST', body: { item_id } }),
  complete: (attempt) => request(`/student/attempts/${attempt}/complete`, { method: 'POST' }),
  recordQuestionTime: (attempt, item_id, seconds) => request(`/student/attempts/${attempt}/question-time`, { method: 'POST', body: { item_id, seconds } }),
  topicActivity: (topicId) => request(`/student/topics/${topicId}/activity`),
  studentStats: () => request('/student/stats'),
  studentBadges: () => request('/student/badges'),
  stickers: () => request('/student/stickers'),
  awardSticker: (student_id, sticker_key) => request('/teacher/stickers/award', { method: 'POST', body: { student_id, sticker_key } }),
  studentAssignments: () => request('/student/assignments'),
  assignmentsByClassroom: () => request('/student/assignments/by-classroom'),
  launchGame: (activityId, gameType) => request('/games/launch', { method: 'POST', body: { activity_id: activityId, game_type: gameType } }),
  getActivity: (activityId) => request(`/student/activities/${activityId}`),
};

export const superAdmin = {
  setup: (email, password, name) => request('/super-admin/setup', { method: 'POST', body: { email, password, name } }),
  login: (email, password) => request('/super-admin/login', { method: 'POST', body: { email, password } }),
  checkSetupStatus: () => request('/super-admin/health'),
  getStats: () => request('/super-admin/stats'),
  listTeachers: (search, includeInactive) => { const params = new URLSearchParams(); if (search) params.append('search', search); if (includeInactive) params.append('include_inactive', includeInactive); return request(`/super-admin/teachers${params.toString() ? '?' + params : ''}`); },
  suspendTeacher: (teacherId) => request(`/super-admin/teachers/${teacherId}/suspend`, { method: 'PUT', body: {} }),
  reactivateTeacher: (teacherId) => request(`/super-admin/teachers/${teacherId}/reactivate`, { method: 'PUT', body: {} }),
  inviteTeacher: (email, name) => request('/super-admin/invitations', { method: 'POST', body: { email, name } }),
  listInvitations: (includeExpired) => { const params = new URLSearchParams(); if (includeExpired) params.append('include_expired', includeExpired); return request(`/super-admin/invitations${params.toString() ? '?' + params : ''}`); },
  revokeInvitation: (invitationId) => request(`/super-admin/invitations/${invitationId}`, { method: 'DELETE' }),
  getAuditLogs: (action, targetType, limit) => { const params = new URLSearchParams(); if (action) params.append('action', action); if (targetType) params.append('target_type', targetType); if (limit) params.append('limit', limit); return request(`/super-admin/audit-logs${params.toString() ? '?' + params : ''}`); },
  verifyInvitation: (token) =>
    apiFetch('/super-admin/invitations/verify/' + encodeURIComponent(token))
      .then(res => res.json()),
  acceptInvitation: (token, password) =>
    apiFetch('/super-admin/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }).then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map(e => e.msg).join(' ')
          : (data.detail || 'Something went wrong.');
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return data;
    }),
  resendInvitation: (invitationId) =>
    request(`/super-admin/invitations/${invitationId}/resend`, { method: 'POST' }),
};

export const MODE_LABEL = { recall: 'Recall', play: 'Play', apply: 'Apply' };
export const GAME_LABEL = { quiz: 'Quiz', matching: 'Matching', sequencing: 'Sequencing' };

/* ── Super Admin analytics, directories, reports (all data comes from the server; nothing is computed here) ── */
const adminQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return;
    q.append(key, Array.isArray(value) ? value.join(',') : value);
  });
  const text = q.toString();
  return text ? `?${text}` : '';
};
const A = '/super-admin';
export const adminApi = {
  dashboard: (p) => request(`${A}/analytics/dashboard${adminQuery(p)}`),
  platform: (p) => request(`${A}/analytics/platform${adminQuery(p)}`),
  games: (p) => request(`${A}/analytics/games${adminQuery(p)}`),
  teacherPerformance: (p) => request(`${A}/analytics/teachers${adminQuery(p)}`),
  compare: (p) => request(`${A}/analytics/compare${adminQuery(p)}`),
  filters: () => request(`${A}/analytics/filters`),
  teachers: (p) => request(`${A}/directory/teachers${adminQuery(p)}`),
  teacher: (id, p) => request(`${A}/directory/teachers/${id}${adminQuery(p)}`),
  students: (p) => request(`${A}/directory/students${adminQuery(p)}`),
  student: (id, p) => request(`${A}/directory/students/${id}${adminQuery(p)}`),
  classrooms: (p) => request(`${A}/directory/classrooms${adminQuery(p)}`),
  classroom: (id, p) => request(`${A}/directory/classrooms/${id}${adminQuery(p)}`),
  activities: (p) => request(`${A}/directory/activities${adminQuery(p)}`),
  reports: () => request(`${A}/reports`),
  reportPreview: (name, p) => request(`${A}/reports/${name}${adminQuery({ ...p, preview: true })}`),
  auditEvents: (p) => request(`${A}/audit/events${adminQuery(p)}`),
  inviteTeacher: (body) => request(`${A}/invitations`, { method: 'POST', body }),
  suspendTeacher: (id) => request(`${A}/teachers/${id}/suspend`, { method: 'PUT', body: {} }),
  reactivateTeacher: (id) => request(`${A}/teachers/${id}/reactivate`, { method: 'PUT', body: {} }),
  invitations: (includeExpired = true) => request(`${A}/invitations${adminQuery({ include_expired: includeExpired })}`),
  resendInvitation: (id) => request(`${A}/invitations/${id}/resend`, { method: 'POST' }),
  revokeInvitation: (id) => request(`${A}/invitations/${id}`, { method: 'DELETE' }),
  changePassword: (current_password, new_password) => request('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  // WhatsApp admin
  whatsappStatus: () => request('/admin/whatsapp/status'),
  whatsappAnalytics: () => request('/admin/whatsapp/analytics'),
  whatsappLogs: (page = 1, pageSize = 20) => request(`/admin/whatsapp/logs?page=${page}&page_size=${pageSize}`),
  whatsappTemplates: () => request('/admin/whatsapp/templates'),
  updateWhatsappTemplate: (type, body) => request(`/admin/whatsapp/templates/${encodeURIComponent(type)}`, { method: 'PUT', body }),
  /** Downloads a CSV/XLSX report; the file comes straight from the server with the current filters applied. */
  async downloadReport(name, params, format) {
    const res = await apiFetch(`${A}/reports/${name}${adminQuery({ ...params, format })}`, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {} }, LONG_TIMEOUT_MS);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = new Error(validationMessage(data.detail) || 'The report could not be created.');
      error.status = res.status;
      throw error;
    }
    const disposition = res.headers.get('Content-Disposition') || '';
    const filename = (disposition.match(/filename="?([^";]+)"?/) || [])[1] || `${name}.${format}`;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  },
};
