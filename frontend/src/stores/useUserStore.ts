import { create } from 'zustand'
import { isAxiosError } from 'axios'
import axios from '../lib/axios'
import { toast } from 'react-hot-toast'
import type { User } from '../types'

interface UserProps {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface UserState {
  user: User | null
  loading: boolean
  checkingAuth: boolean
  signup: (data: UserProps) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<User | void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }: UserProps) => {
    set({ loading: true })

    if (password !== confirmPassword) {
      set({ loading: false })
      toast.error('Passwords do not match')
      return
    }

    try {
      const res = await axios.post('/auth/signup', { name, email, password })
      set({ user: res.data, loading: false })
    } catch (error) {
      set({ loading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'An error occurred'
      toast.error(message || 'An error occurred')
    }
  },
  login: async (email: string, password: string) => {
    set({ loading: true })

    try {
      const res = await axios.post('/auth/login', { email, password })

      set({ user: res.data, loading: false })
    } catch (error) {
      set({ loading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'An error occurred'
      toast.error(message || 'An error occurred')
    }
  },

  logout: async () => {
    try {
      await axios.post('/auth/logout')
      set({ user: null })
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'An error occurred during logout'
      toast.error(message || 'An error occurred during logout')
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true })
    try {
      const response = await axios.get('/auth/profile')
      set({ user: response.data, checkingAuth: false })
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'Auth check failed'
      console.log(message)
      set({ checkingAuth: false, user: null })
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return

    set({ checkingAuth: true })
    try {
      const response = await axios.post('/auth/refresh-token')
      set({ checkingAuth: false })
      return response.data
    } catch (error) {
      set({ user: null, checkingAuth: false })
      throw error
    }
  },
}))

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise: Promise<User | void> | null = null

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise
          return axios(originalRequest)
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken()
        await refreshPromise
        refreshPromise = null

        return axios(originalRequest)
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
