import { ethers, Contract } from 'ethers'
import type { ContractAddresses } from '../types'

// Contract ABIs (these will be copied from artifacts after build)
const ACADEMY_ABI = [
  'function submitGrade(address student, uint256 subjectId, uint8 score, uint16 professorId) external',
  'function enrollStudent(address student, uint256 careerId) external',
  'function hasCompletedAllSubjects(address student) external view returns (bool)',
  'function migrateStudentWallet(address compromisedWallet, address newWallet) external',
  'function academicRecords(address student) external view returns (uint8, uint8, uint32, bool, uint16)',
]

const DIPLOMA_ABI = [
  'function mintDiploma(address student) external',
  'function revokeDiploma(address student) external',
  'function isDiplomaActive(address student) external view returns (bool)',
]

const COMPOSITION_ABI = [
  'function registerComposition(string memory title, string memory ipfsHash) external',
  'function compositions(uint256 id) external view returns (string, string, address, uint256)',
  'event CompositionRegistered(address indexed author, string indexed ipfsHash, uint256 timestamp)',
]

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private contracts: {
    academy?: Contract
    diploma?: Contract
    composition?: Contract
  } = {}

  private addresses: ContractAddresses = {
    academy: '0xa93939fb4698de788B51ec5f6620E0aD318b8A62',
    diploma: '0x4E0A77e01F85c24d87c3605e1dFD09EaF62d1B00',
    composition: '0x484FCeA1e42D9997b8E98c5007214c160BFD90D2',
  }

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        this.provider = new ethers.BrowserProvider((window as any).ethereum)
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        this.signer = await this.provider.getSigner()

        this.contracts.academy = new Contract(
          this.addresses.academy,
          ACADEMY_ABI,
          this.signer
        )
        this.contracts.diploma = new Contract(
          this.addresses.diploma,
          DIPLOMA_ABI,
          this.signer
        )
        this.contracts.composition = new Contract(
          this.addresses.composition,
          COMPOSITION_ABI,
          this.signer
        )

        return {
          address: accounts[0],
          provider: this.provider,
        }
      } catch (error) {
        console.error('Failed to initialize blockchain connection:', error)
        throw error
      }
    }
    throw new Error('Ethereum provider not found. Please install MetaMask.')
  }

  getProvider() {
    return this.provider
  }

  getSigner() {
    return this.signer
  }

  getContracts() {
    return this.contracts
  }

  async submitGrade(
    studentAddress: string,
    subjectId: number,
    score: number,
    professorId: number
  ) {
    if (!this.contracts.academy) {
      throw new Error('Academy contract not initialized')
    }

    try {
      const tx = await this.contracts.academy.submitGrade(
        studentAddress,
        subjectId,
        score,
        professorId
      )
      return await tx.wait()
    } catch (error) {
      console.error('Error submitting grade:', error)
      throw error
    }
  }

  async registerComposition(title: string, ipfsHash: string) {
    if (!this.contracts.composition) {
      throw new Error('Composition contract not initialized')
    }

    try {
      const tx = await this.contracts.composition.registerComposition(title, ipfsHash)
      return await tx.wait()
    } catch (error) {
      console.error('Error registering composition:', error)
      throw error
    }
  }

  async hasCompletedAllSubjects(studentAddress: string) {
    if (!this.contracts.academy) {
      throw new Error('Academy contract not initialized')
    }

    try {
      return await this.contracts.academy.hasCompletedAllSubjects(studentAddress)
    } catch (error) {
      console.error('Error checking subject completion:', error)
      throw error
    }
  }

  async migrateStudentWallet(compromisedWallet: string, newWallet: string) {
    if (!this.contracts.academy) {
      throw new Error('Academy contract not initialized')
    }

    try {
      const tx = await this.contracts.academy.migrateStudentWallet(
        compromisedWallet,
        newWallet
      )
      return await tx.wait()
    } catch (error) {
      console.error('Error migrating wallet:', error)
      throw error
    }
  }

  getContractAddresses() {
    return this.addresses
  }
}

export const blockchainService = new BlockchainService()
