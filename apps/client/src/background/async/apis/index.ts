import { axiosClient } from '../index'
import type { ItemProgress, Settings } from '../../../domain/types'

export type AuthUser = {
  id?: string
  sub?: string
  email?: string
  name?: string
  picture?: string
}

export type AuthResponse = {
  token: string
  user?: AuthUser
}

export type UserSettingsApi = {
  random_interval_min_minutes: number
  random_interval_max_minutes: number
  quiet_time_start: string
  quiet_time_end: string
}

export type UserSettingsResponse = {
  user_id: string
  settings: UserSettingsApi
  updated_at: string
}

export type UserProgressItem = {
  user_id: string
  item_id: string
  introduced_at: string | null
  correct_streak: number
  last_seen_at: string | null
  concept_shown: boolean
  completed_at: string | null
}

export type LessonConceptApi = {
  id: string
  title: string
  body: string
  meta?: string
}

export type LessonVocabApi = {
  id: string
  romaji: string
  en: string
  meta?: string
}

export type LessonApi = {
  id: string
  title: string
  position: number
  concepts: LessonConceptApi[]
  vocab: LessonVocabApi[]
}

function authHeaders(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

async function apiRequest<T>(
  method: 'get' | 'post' | 'put',
  url: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const config = token ? authHeaders(token) : undefined

  const response =
    method === 'get'
      ? await axiosClient.get<T>(url, config)
      : method === 'post'
        ? await axiosClient.post<T>(url, body, config)
        : await axiosClient.put<T>(url, body, config)

  return response.data
}

export async function loginWithGoogle(accessToken: string): Promise<AuthResponse> {
  const response = await axiosClient.post<AuthResponse>('/login', {
    access_token: accessToken,
  })

  return response.data
}

export async function getUserSettings(token: string): Promise<UserSettingsResponse> {
  return apiRequest<UserSettingsResponse>('get', '/settings', token)
}

export async function updateUserSettings(
  token: string,
  settings: Partial<UserSettingsApi>,
): Promise<UserSettingsResponse> {
  return apiRequest<UserSettingsResponse>('put', '/settings', token, settings)
}

// The backend only models a single quiet-time range and has no `paused` concept yet,
// so those fields fall back to whatever the client already has locally.
export function apiSettingsToClientSettings(existing: Settings, api: UserSettingsApi): Settings {
  return {
    ...existing,
    minIntervalMin: api.random_interval_min_minutes,
    maxIntervalMin: api.random_interval_max_minutes,
    quietHours:
      api.quiet_time_start && api.quiet_time_end
        ? [{ start: api.quiet_time_start, end: api.quiet_time_end }]
        : existing.quietHours,
  }
}

export function clientSettingsToApiSettings(settings: Settings): Partial<UserSettingsApi> {
  const [firstQuietHour] = settings.quietHours
  return {
    random_interval_min_minutes: settings.minIntervalMin,
    random_interval_max_minutes: settings.maxIntervalMin,
    ...(firstQuietHour
      ? { quiet_time_start: firstQuietHour.start, quiet_time_end: firstQuietHour.end }
      : {}),
  }
}

export async function listUserProgress(token: string): Promise<UserProgressItem[]> {
  return apiRequest<UserProgressItem[]>('get', '/progress', token)
}

// The API keys each item by `${lessonId}:${kind}:${itemKey}`, matching the client's progressKey format.
export function apiProgressToClientProgress(
  items: UserProgressItem[],
): Record<string, ItemProgress> {
  const result: Record<string, ItemProgress> = {}
  for (const item of items) {
    result[item.item_id] = {
      introducedAt: item.introduced_at ? Date.parse(item.introduced_at) : null,
      correctStreak: item.correct_streak,
      lastSeenAt: item.last_seen_at ? Date.parse(item.last_seen_at) : null,
      conceptShown: item.concept_shown,
    }
  }
  return result
}

export async function recordItemAttempt(
  token: string,
  itemId: string,
  correct: boolean,
): Promise<UserProgressItem> {
  return apiRequest<UserProgressItem>('post', `/progress/${itemId}/attempt`, token, { correct })
}

export async function listLessons(token: string): Promise<LessonApi[]> {
  return apiRequest<LessonApi[]>('get', '/lessons', token)
}

export async function getLesson(token: string, id: string): Promise<LessonApi> {
  return apiRequest<LessonApi>('get', `/lessons/${id}`, token)
}

export async function getNextLesson(token: string): Promise<LessonApi> {
  return apiRequest<LessonApi>('get', '/lessons/next', token)
}
