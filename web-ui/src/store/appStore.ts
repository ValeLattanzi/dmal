import { create } from 'zustand'
import type { AppState, UserRole, Grade, Composition, Transaction, Toast, WorkSubmission, ProfessorAssignment } from '../types'

interface Store extends AppState {
  setCurrentRole: (role: UserRole) => void
  setWalletAddress: (address: string) => void
  setIsConnected: (connected: boolean) => void
  setBlockHeight: (height: number) => void
  setSbtRevoked: (revoked: boolean) => void
  setDiplomaTokenId: (id: number) => void

  // Academic Records
  grades: Grade[]
  addGrade: (grade: Grade) => void
  updateGradeStatus: (subjectId: number, status: 'PENDING' | 'CONFIRMED') => void
  setGrades: (grades: Grade[]) => void

  // Compositions
  compositions: Composition[]
  addComposition: (composition: Composition) => void
  setCompositions: (compositions: Composition[]) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (tx: Transaction) => void
  setTransactions: (transactions: Transaction[]) => void
  updateTransactionStatus: (txId: string | number, status: string) => void
  updateTransactionHash: (txId: string | number, txHash: string) => void

  // Logs
  logs: string[]
  addLog: (log: string) => void
  clearHistory: () => void

  // Toast
  toast: Toast | null
  showToast: (message: string, type: Toast['type']) => void

  // Work submissions (TPs)
  addSubmission: (submission: WorkSubmission) => void
  markSubmissionGraded: (id: string, score: number) => void

  // Professor assignments (visual only, not on-chain)
  assignProfessor: (subjectId: number, id: number, name: string) => void
}

export const useAppStore = create<Store>((set) => ({
  // App state
  currentRole: 'student',
  walletAddress: '0xValentinoLattanzi77764DDR5LianLiIII',
  isConnected: false,
  isSbtRevoked: false,
  blockHeight: 18492020,
  diplomaTokenId: 0,

  setCurrentRole: (role) => set({ currentRole: role }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setBlockHeight: (height) => set({ blockHeight: height }),
  setSbtRevoked: (revoked) => set({ isSbtRevoked: revoked }),
  setDiplomaTokenId: (id) => set({ diplomaTokenId: id }),

  // Grades
  grades: [],
  addGrade: (grade) =>
    set((state) => ({
      grades: [...state.grades, grade],
    })),
  updateGradeStatus: (subjectId, status) =>
    set((state) => ({
      grades: state.grades.map((g) =>
        g.subjectId === subjectId ? { ...g, status } : g
      ),
    })),
  setGrades: (grades) => set({ grades }),

  // Compositions
  compositions: [],
  addComposition: (composition) =>
    set((state) => ({
      compositions: [composition, ...state.compositions],
    })),
  setCompositions: (compositions) => set({ compositions }),

  // Transactions
  transactions: [],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),
  setTransactions: (transactions) => set({ transactions }),
  updateTransactionStatus: (txId, status) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === txId ? { ...t, status: status as Transaction['status'] } : t
      ),
    })),
  updateTransactionHash: (txId, txHash) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === txId ? { ...t, txHash } : t
      ),
    })),

  // Logs (append to maintain chronological order)
  logs: [
    '[INFO] 2026-05-31 14:40:12 - Application - Starting DMAL Spring Boot Engine on localhost:8080...',
    '[INFO] 2026-05-31 14:40:15 - BlockchainService - Web3j connection established with local EVM (Hardhat Node).',
    '[INFO] 2026-05-31 14:40:15 - BlockchainService - Contract ConservatoryAcademy loaded at address: 0x8fC820...4Fa1',
  ],
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),
  clearHistory: () =>
    set({
      grades: [],
      compositions: [],
      transactions: [],
      logs: [],
      isSbtRevoked: false,
      walletAddress: '0xValentinoLattanzi77764DDR5LianLiIII',
      submissions: [],
    }),

  // Toast
  toast: null,
  showToast: (message, type) => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 4000)
  },

  // Work submissions (TPs)
  submissions: [],
  addSubmission: (submission) =>
    set((state) => ({
      submissions: [submission, ...state.submissions],
    })),
  markSubmissionGraded: (id, score) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === id ? { ...s, status: 'graded', score } : s
      ),
    })),

  // Professor assignments (visual only, not on-chain)
  professorAssignments: {
    1: { id: 14, name: 'Prof. Marcos Aguirre' },
    2: { id: 15, name: 'Prof. Lucía Fernández' },
    3: { id: 16, name: 'Prof. Diego Romero' },
  },
  assignProfessor: (subjectId, id, name) =>
    set((state) => ({
      professorAssignments: { ...state.professorAssignments, [subjectId]: { id, name } },
    })),
}))
