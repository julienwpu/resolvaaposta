import { create } from "zustand"

interface AppState {
  // Carteira
  address: string | null
  setAddress: (address: string | null) => void

  // Filtros de mercado
  searchQuery: string
  setSearchQuery: (query: string) => void

  // UI
  isOrderModalOpen: boolean
  setOrderModalOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Carteira
  address: null,
  setAddress: (address) => set({ address }),

  // Filtros
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // UI
  isOrderModalOpen: false,
  setOrderModalOpen: (isOrderModalOpen) => set({ isOrderModalOpen }),
}))
