import { ethers, Contract } from 'ethers'
import type { ContractAddresses, Grade, Composition, Transaction } from '../types'

// Subject names mapping for UI display
const SUBJECT_NAMES: Record<number, string> = {
  1: 'Composición Musical I',
  2: 'Contrapunto Avanzado',
  3: 'Audioperceptiva V',
}

interface OnChainStudentData {
  isActive: boolean
  grades: Grade[]
  compositions: Composition[]
  diplomaTokenId: number
}

// Contract ABIs (corrected to match actual contract implementations)
const ACADEMY_ABI = [
  'function defineCurriculum(uint256 _careerId, uint256[] calldata _subjectIds) external',
  'function submitGrade(address _student, uint256 _subjectId, uint8 _score, uint16 _professorId) external',
  'function enrollStudent(address _student, uint256 _careerId) external',
  'function migrateStudentWallet(address _compromisedWallet, address _newWallet) external',
  'function hasCompletedAllSubjects(address _student) external view returns (bool)',
  'function activeStudents(address) external view returns (bool)',
  'function canonicalStudent(address) external view returns (address)',
  'function academicRecords(address, uint256) external view returns (uint8 score, uint8 attempts, uint32 approvalDate, bool approved, uint16 professorId)',
  'event GradeSubmitted(address indexed student, uint256 indexed subjectId, uint8 score, uint16 indexed professorId)',
]

const DIPLOMA_ABI = [
  'function mintDiploma(address _graduate, bytes32 _legajoHash) external',
  'function burnAndReissue(address _compromisedWallet, address _newWallet, uint256 _tokenId) external',
  'function studentDiploma(address) external view returns (uint256)',
  'function nextTokenId() external view returns (uint256)',
]

const COMPOSITION_ABI = [
  'function commitComposition(bytes32 _commitHash) external',
  'function registerComposition(string memory _ipfsHash, string memory _title, bytes32 _salt) external payable',
  'function compositionCount() external view returns (uint256)',
  'function registry(uint256) external view returns (string ipfsHash, string title, address author, uint32 timestamp)',
  'function registrationFee() external view returns (uint256)',
  'event CompositionRegistered(address indexed author, uint256 indexed compositionId, string ipfsHash)',
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

        // Listen for account and chain changes
        ;(window as any).ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            window.location.reload()
          }
        })
        ;(window as any).ethereum.on('chainChanged', () => {
          window.location.reload()
        })

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

  async defineCurriculum(careerId: number, subjectIds: number[]) {
    if (!this.contracts.academy) {
      throw new Error('Academy contract not initialized')
    }
    try {
      const tx = await this.contracts.academy.defineCurriculum(careerId, subjectIds)
      return await tx.wait()
    } catch (error) {
      console.error('Error defining curriculum:', error)
      throw error
    }
  }

  async enrollStudent(studentAddress: string, careerId: number) {
    if (!this.contracts.academy) {
      throw new Error('Academy contract not initialized')
    }
    try {
      const tx = await this.contracts.academy.enrollStudent(studentAddress, careerId)
      return await tx.wait()
    } catch (error) {
      console.error('Error enrolling student:', error)
      throw error
    }
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

  async mintDiploma(graduateAddress: string, legajoHash: string) {
    if (!this.contracts.diploma) {
      throw new Error('Diploma contract not initialized')
    }
    try {
      const tx = await this.contracts.diploma.mintDiploma(graduateAddress, legajoHash)
      return await tx.wait()
    } catch (error) {
      console.error('Error minting diploma:', error)
      throw error
    }
  }

  async commitComposition(commitHash: string) {
    if (!this.contracts.composition) {
      throw new Error('Composition contract not initialized')
    }
    try {
      const tx = await this.contracts.composition.commitComposition(commitHash)
      return await tx.wait()
    } catch (error) {
      console.error('Error committing composition:', error)
      throw error
    }
  }

  async registerComposition(ipfsHash: string, title: string, salt: string) {
    if (!this.contracts.composition) {
      throw new Error('Composition contract not initialized')
    }

    try {
      const registrationFee = await this.contracts.composition.registrationFee()
      const fee = Number(registrationFee) > 0 ? registrationFee : 0n
      const tx = await this.contracts.composition.registerComposition(ipfsHash, title, salt, { value: fee })
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

  async fetchStudentData(walletAddress: string): Promise<OnChainStudentData> {
    try {
      // Create read-only provider for querying
      const readProvider = new ethers.BrowserProvider((window as any).ethereum)
      const academy = new Contract(this.addresses.academy, ACADEMY_ABI, readProvider)
      const composition = new Contract(this.addresses.composition, COMPOSITION_ABI, readProvider)
      const diploma = new Contract(this.addresses.diploma, DIPLOMA_ABI, readProvider)

      // Check if student is active and get canonical address
      const [isActive, canonical] = await Promise.all([
        academy.activeStudents(walletAddress).catch(() => false),
        academy.canonicalStudent(walletAddress).catch(() => ethers.ZeroAddress),
      ])

      const canonAddr = canonical === ethers.ZeroAddress ? walletAddress : canonical

      // Fetch academic records (iterate until no more records)
      const grades: Grade[] = []
      for (let i = 0; i < 10; i++) {
        try {
          const r = await academy.academicRecords(canonAddr, i)
          if (Number(r.attempts) > 0) {
            grades.push({
              subjectId: i,
              subjectName: SUBJECT_NAMES[i] ?? `Materia #${i}`,
              score: Number(r.score),
              approved: r.approved,
              date: Number(r.approvalDate) > 0
                ? new Date(Number(r.approvalDate) * 1000).toISOString().split('T')[0]
                : '-',
              professorId: Number(r.professorId),
              status: 'CONFIRMED' as const,
            })
          }
        } catch {
          break
        }
      }

      // Fetch compositions registered by this wallet
      const count = Number(await composition.compositionCount().catch(() => 0n))
      const compositions: Composition[] = []
      for (let i = 1; i <= count && i <= 100; i++) {
        try {
          const c = await composition.registry(i)
          if (c.author.toLowerCase() === walletAddress.toLowerCase()) {
            compositions.push({
              id: i,
              title: c.title,
              ipfsHash: c.ipfsHash,
              author: c.author,
              timestamp: new Date(Number(c.timestamp) * 1000)
                .toISOString()
                .replace('T', ' ')
                .substring(0, 16),
              isRegular: isActive,
            })
          }
        } catch {
          break
        }
      }

      // Check if student has diploma
      const diplomaTokenId = Number(await diploma.studentDiploma(walletAddress).catch(() => 0n))

      return { isActive, grades, compositions, diplomaTokenId }
    } catch (error) {
      console.error('Error fetching student data:', error)
      return { isActive: false, grades: [], compositions: [], diplomaTokenId: 0 }
    }
  }

  getContractAddresses() {
    return this.addresses
  }

  async getStudentCareer(studentAddress: string) {
    if (!this.contracts.academy) throw new Error('Academy contract not initialized')
    try {
      const careerId = Number(await this.contracts.academy.studentCareer(studentAddress))
      return careerId
    } catch (error) {
      console.error('Error getting student career:', error)
      return 0
    }
  }

  async getGradesByProfessor(studentAddress: string, professorId: number) {
    if (!this.contracts.academy) throw new Error('Academy contract not initialized')
    try {
      const readProvider = new ethers.BrowserProvider((window as any).ethereum)
      const academy = new Contract(this.addresses.academy, ACADEMY_ABI, readProvider)
      const canonical = await academy.canonicalStudent(studentAddress).catch(() => studentAddress)

      const grades: Grade[] = []
      for (let i = 0; i < 10; i++) {
        try {
          const r = await academy.academicRecords(canonical, i)
          if (Number(r.attempts) > 0 && Number(r.professorId) === professorId) {
            grades.push({
              subjectId: i,
              subjectName: SUBJECT_NAMES[i] ?? `Materia #${i}`,
              score: Number(r.score),
              approved: r.approved,
              date: Number(r.approvalDate) > 0
                ? new Date(Number(r.approvalDate) * 1000).toISOString().split('T')[0]
                : '-',
              professorId: Number(r.professorId),
              status: 'CONFIRMED' as const,
            })
          }
        } catch {
          break
        }
      }
      return grades
    } catch (error) {
      console.error('Error getting grades by professor:', error)
      return []
    }
  }

  async getAllCompositions() {
    if (!this.contracts.composition) throw new Error('Composition contract not initialized')
    try {
      const readProvider = new ethers.BrowserProvider((window as any).ethereum)
      const composition = new Contract(this.addresses.composition, COMPOSITION_ABI, readProvider)

      const count = Number(await composition.compositionCount().catch(() => 0n))
      const compositions: Composition[] = []
      for (let i = 1; i <= count && i <= 200; i++) {
        try {
          const c = await composition.registry(i)
          compositions.push({
            id: i,
            title: c.title,
            ipfsHash: c.ipfsHash,
            author: c.author,
            timestamp: new Date(Number(c.timestamp) * 1000)
              .toISOString()
              .replace('T', ' ')
              .substring(0, 16),
            isRegular: true,
          })
        } catch {
          break
        }
      }
      return compositions
    } catch (error) {
      console.error('Error getting all compositions:', error)
      return []
    }
  }

  async getDiplomaInfo(studentAddress: string) {
    if (!this.contracts.diploma) throw new Error('Diploma contract not initialized')
    try {
      const readProvider = new ethers.BrowserProvider((window as any).ethereum)
      const diploma = new Contract(this.addresses.diploma, DIPLOMA_ABI, readProvider)
      const tokenId = Number(await diploma.studentDiploma(studentAddress).catch(() => 0n))
      return { tokenId, hasDiploma: tokenId > 0 }
    } catch (error) {
      console.error('Error getting diploma info:', error)
      return { tokenId: 0, hasDiploma: false }
    }
  }

  async getCanonicalStudent(walletAddress: string) {
    if (!this.contracts.academy) throw new Error('Academy contract not initialized')
    try {
      const canonical = await this.contracts.academy.canonicalStudent(walletAddress)
      return canonical === ethers.ZeroAddress ? walletAddress : canonical
    } catch (error) {
      console.error('Error getting canonical student:', error)
      return walletAddress
    }
  }


  async getLatestGradeSubmissions(limit: number = 20) {
    if (!this.contracts.academy) throw new Error('Academy contract not initialized')
    try {
      return await this.fetchLogsChunked(
        this.addresses.academy,
        [ethers.id('GradeSubmitted(address,uint256,uint8,uint16)')],
        limit
      )
    } catch (error) {
      console.error('Error getting grade submissions:', error)
      return []
    }
  }

  async getLatestCompositionRegistrations(limit: number = 20) {
    if (!this.contracts.composition) throw new Error('Composition contract not initialized')
    try {
      return await this.fetchLogsChunked(
        this.addresses.composition,
        [ethers.id('CompositionRegistered(address,uint256,string)')],
        limit
      )
    } catch (error) {
      console.error('Error getting composition registrations:', error)
      return []
    }
  }

  // Fetch the on-chain transaction history (grades + compositions) for a given wallet,
  // used to preload the Ledger when a user connects their wallet.
  async getWalletTransactionHistory(walletAddress: string, limit: number = 50): Promise<Transaction[]> {
    if (!this.contracts.academy || !this.contracts.composition) {
      throw new Error('Contracts not initialized')
    }

    try {
      const paddedAddr = ethers.zeroPadValue(walletAddress, 32)

      const [gradeLogs, compLogs] = await Promise.all([
        this.fetchLogsChunked(
          this.addresses.academy,
          [ethers.id('GradeSubmitted(address,uint256,uint8,uint16)'), paddedAddr],
          limit
        ),
        this.fetchLogsChunked(
          this.addresses.composition,
          [ethers.id('CompositionRegistered(address,uint256,string)'), paddedAddr],
          limit
        ),
      ])

      const gradeTxs: Transaction[] = gradeLogs.map((log) => {
        const parsed = this.contracts.academy!.interface.parseLog(log)
        const subjectId = Number(parsed?.args.subjectId ?? 0)
        const score = Number(parsed?.args.score ?? 0)
        return {
          id: log.transactionHash,
          type: 'Carga de Nota',
          detail: `${SUBJECT_NAMES[subjectId] ?? `Materia #${subjectId}`}: ${score}`,
          status: 'CONFIRMED',
          txHash: log.transactionHash,
          block: log.blockNumber,
        }
      })

      const compTxs: Transaction[] = compLogs.map((log) => {
        const parsed = this.contracts.composition!.interface.parseLog(log)
        const ipfsHash: string = parsed?.args.ipfsHash ?? ''
        return {
          id: log.transactionHash,
          type: 'Registro IP',
          detail: `IPFS: ${ipfsHash.slice(0, 16)}...`,
          status: 'CONFIRMED',
          txHash: log.transactionHash,
          block: log.blockNumber,
        }
      })

      return [...gradeTxs, ...compTxs].sort((a, b) => Number(b.block) - Number(a.block))
    } catch (error) {
      console.error('Error getting wallet transaction history:', error)
      return []
    }
  }

  private async fetchLogsChunked(address: string, topics: (string | null)[], limit: number) {
    const readProvider = new ethers.BrowserProvider((window as any).ethereum)
    const latestBlock = await readProvider.getBlockNumber()
    const CHUNK = 500
    const MAX_CHUNKS = 20 // ~10000 bloques totales
    const results: ethers.Log[] = []

    for (let i = 0; i < MAX_CHUNKS && results.length < limit; i++) {
      const toBlock = latestBlock - i * CHUNK
      if (toBlock < 0) break
      const fromBlock = Math.max(0, toBlock - CHUNK + 1)

      try {
        const logs = await readProvider.getLogs({ address, topics, fromBlock, toBlock })
        results.unshift(...logs)
      } catch (err) {
        console.warn(`getLogs chunk failed [${fromBlock}-${toBlock}]:`, err)
      }

      if (fromBlock === 0) break
    }
    return results.slice(-limit)
  }
}

export const blockchainService = new BlockchainService()
