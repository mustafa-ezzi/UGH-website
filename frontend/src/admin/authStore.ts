import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ManageUser = {
  id: number
  username: string
  email: string
  is_superuser: boolean
  first_name: string
  last_name: string
}

type AuthState = {
  token: string | null
  user: ManageUser | null
  setSession: (token: string, user: ManageUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    { name: 'ugh-manage-auth' },
  ),
)
