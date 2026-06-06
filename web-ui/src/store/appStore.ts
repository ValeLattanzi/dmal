import { create } from 'zustand'
import type { AppState, UserRole, Grade, Composition, Transaction } from '../types'

interface Store extends AppState {
  setCurrentRole: (role: UserRole) => void
  setWalletAddress: (address: string) => void
  setIsConnected: (connected: boolean) => void
  setBlockHeight: (height: number) => void
  setSbtRevoked: (revoked: boolean) => void

  // Academic Records
  grades: Grade[]
  addGrade: (grade: Grade) => void
  updateGradeStatus: (subjectId: number, status: 'PENDING' | 'CONFIRMED') => void

  // Compositions
  compositions: Composition[]
  addComposition: (composition: Composition) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (tx: Transaction) => void
  updateTransactionStatus: (txId: string | number, status: string) => void

  // Logs
  logs: string[]
  addLog: (log: string) => void
  clearHistory: () => void
}

export const useAppStore = create<Store>((set) => ({
  // App state
  currentRole: 'student',
  walletAddress: '0xValentinoLattanzi77764DDR5LianLiIII',
  isConnected: false,
  isSbtRevoked: false,
  blockHeight: 18492020,

  setCurrentRole: (role) => set({ currentRole: role }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setBlockHeight: (height) => set({ blockHeight: height }),
  setSbtRevoked: (revoked) => set({ isSbtRevoked: revoked }),

  // Grades
  grades: [
    {
      subjectId: 101,
      subjectName: 'Composición Musical I',
      score: 92,
      approved: true,
      date: '2026-05-10',
      professorId: 14,
      status: 'CONFIRMED',
    },
  ],
  addGrade: (grade) =>
    set((state) => ({
      grades: [grade, ...state.grades],
    })),
  updateGradeStatus: (subjectId, status) =>
    set((state) => ({
      grades: state.grades.map((g) =>
        g.subjectId === subjectId ? { ...g, status } : g
      ),
    })),

  // Compositions
  compositions: [
    {
      id: 1,
      title: 'Sonata para Piano en Sol Menor',
      ipfsHash: 'QmXoypizjW3WknFixtndV3VCVUWB7F16mdA9nz28bce85S',
      author: '0xValentinoLattanzi77764DDR5LianLiIII',
      timestamp: '2026-05-15 14:32',
      isRegular: true,
    },
  ],
  addComposition: (composition) =>
    set((state) => ({
      compositions: [composition, ...state.compositions],
    })),

  // Transactions
  transactions: [
    {
      id: 1,
      type: 'Carga de Nota',
      detail: 'Composición Musical I: 92',
      status: 'CONFIRMED',
      txHash: '0x3ac912fa...e93d',
      block: 18492019,
    },
    {
      id: 2,
      type: 'Registro IP',
      detail: 'Sonata para Piano en Sol Menor (IPFS)',
      status: 'CONFIRMED',
      txHash: '0x5b8a11bc...48fa',
      block: 18492020,
    },
  ],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),
  updateTransactionStatus: (txId, status) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === txId ? { ...t, status: status as any } : t
      ),
    })),

  // Logs
  logs: [
    '[INFO] 2026-05-31 14:40:12 - Application - Starting DMAL Spring Boot Engine on localhost:8080...',
    '[INFO] 2026-05-31 14:40:15 - BlockchainService - Web3j connection established with local EVM (Hardhat Node).',
    '[INFO] 2026-05-31 14:40:15 - BlockchainService - Contract ConservatoryAcademy loaded at address: 0x8fC820...4Fa1',
  ],
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
    })),
  clearHistory: () =>
    set({
      grades: [],
      compositions: [],
      transactions: [],
      logs: [],
      isSbtRevoked: false,
      walletAddress: '0xValentinoLattanzi77764DDR5LianLiIII',
    }),
}))
