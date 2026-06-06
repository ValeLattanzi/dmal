export interface SubjectRecord {
  score: number
  attempts: number
  approvalDate: number
  approved: boolean
  professorId: number
}

export interface Grade {
  subjectId: number
  subjectName: string
  score: number
  approved: boolean
  date: string
  professorId: number
  status: 'PENDING' | 'CONFIRMED'
}

export interface Composition {
  id: number | string
  title: string
  ipfsHash: string
  author: string
  timestamp: string
  isRegular: boolean
}

export interface Transaction {
  id: string | number
  type: 'Carga de Nota' | 'Registro IP' | 'Revocación SBT'
  detail: string
  status: 'PENDING_ON_CHAIN' | 'CONFIRMED'
  txHash: string
  block: number | string
}

export type UserRole = 'professor' | 'student' | 'validator' | 'admin'

export interface Toast {
  message: string
  type: 'success' | 'error' | 'confirmed' | 'info'
}

export interface AppState {
  currentRole: UserRole
  walletAddress: string
  isConnected: boolean
  isSbtRevoked: boolean
  blockHeight: number
  diplomaTokenId: number
}

export interface ContractAddresses {
  academy: string
  diploma: string
  composition: string
}
