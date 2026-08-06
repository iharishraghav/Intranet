import { create } from 'zustand'

type SignInStore = {
  error: string | null
  failWith: (message: string) => void
}

export const useSignInStore = create<SignInStore>()((set) => ({
  error: null,
  failWith: (error) => set({ error }),
}))
