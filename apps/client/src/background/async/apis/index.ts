import { axiosClient } from '../index'

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

export async function listUserProgress(token: string): Promise<UserProgressItem[]> {
  return apiRequest<UserProgressItem[]>('get', '/progress', token)
}

export async function recordItemAttempt(
  token: string,
  itemId: string,
  correct: boolean,
): Promise<UserProgressItem> {
  return apiRequest<UserProgressItem>('post', `/progress/${itemId}/attempt`, token, { correct })
}
