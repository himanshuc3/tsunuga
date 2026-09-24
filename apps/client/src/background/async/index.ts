import axios, { type AxiosInstance } from 'axios'

const defaultBaseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

type UnauthorizedHandler = () => Promise<void>

let unauthorizedHandler: UnauthorizedHandler | undefined
let unauthorizedHandling: Promise<void> | undefined

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

export function createAxiosClient(baseURL = defaultBaseURL): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandling ??= unauthorizedHandler().finally(() => {
        unauthorizedHandling = undefined
      })
      await unauthorizedHandling
    }

    return Promise.reject(error)
  })

  return client
}

export const axiosClient = createAxiosClient()
