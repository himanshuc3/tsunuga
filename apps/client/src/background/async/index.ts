import axios, { type AxiosInstance } from 'axios'

const defaultBaseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export function createAxiosClient(baseURL = defaultBaseURL): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

export const axiosClient = createAxiosClient()
