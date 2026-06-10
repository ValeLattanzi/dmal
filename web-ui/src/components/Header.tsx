import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { blockchainService } from '../services/blockchain'
import { Icons } from './Icons'
import { AuditDashboard } from './AuditDashboard'

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io'
const CONTRACT_ADDRESSES = {
  academy: '0xa93939fb4698de788B51ec5f6620E0aD318b8A62',
  diploma: '0x4E0A77e01F85c24d87c3605e1dFD09EaF62d1B00',
  composition: '0x484FCeA1e42D9997b8E98c5007214c160BFD90D2',
}

export const Header = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const {
    currentRole,
    setCurrentRole,
    blockHeight,
    isConnected,
    walletAddress,
    setWalletAddress,
    setIsConnected,
    setGrades,
    setCompositions,
    setDiplomaTokenId,
    showToast,
    addLog,
  } = useAppStore()

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      const { address } = await blockchainService.initialize()
      setWalletAddress(address)
      setIsConnected(true)
      addLog(`[INFO] MetaMask - Wallet conectada: ${address}`)
      showToast(`Wallet: ${address.slice(0, 6)}...${address.slice(-4)} conectada`, 'success')

      const data = await blockchainService.fetchStudentData(address)
      if (data.grades.length > 0) {
        setGrades(data.grades)
        addLog(
          `[INFO] Chain - ${data.grades.length} registro(s) académico(s) cargado(s) desde la EVM`
        )
      }
      if (data.compositions.length > 0) {
        setCompositions(data.compositions)
        addLog(`[INFO] Chain - ${data.compositions.length} composición(es) cargada(s) desde la EVM`)
      }
      if (data.diplomaTokenId > 0) {
        setDiplomaTokenId(data.diplomaTokenId)
        addLog(
          `[INFO] Chain - Diploma SBT #${data.diplomaTokenId} detectado en esta wallet`
        )
        showToast(`SBT Diploma #${data.diplomaTokenId} detectado on-chain`, 'confirmed')
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Error conectando MetaMask', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <header className="border-b border-slate-800 glass sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white shadow-lg shadow-indigo-500/10">
          <Icons.Shield />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              DMAL PLATFORM
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
              PROD v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Decentralized Music Academy Ledger &middot; Web3 UI</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
        {/* Blockchain Explorer Panel */}
        <div className="relative group">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all text-xs font-mono text-slate-400 hover:text-emerald-400"
            title="Explorador de blockchain"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sepolia</span>
            <span className="text-emerald-400 font-bold">#{blockHeight}</span>
            <svg className={`w-3 h-3 transition-transform ${showExplorer ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Dropdown Explorer */}
          {showExplorer && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-950 border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-4 space-y-3">
              <div className="text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800">
                📊 Blockchain Explorer - Sepolia
              </div>

              {/* Current Block Link */}
              <a
                href={`${SEPOLIA_EXPLORER}/block/${blockHeight}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-slate-900 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 rounded-lg transition-all text-left"
              >
                <div className="text-xs font-mono text-emerald-400 font-bold">Bloque Actual: #{blockHeight}</div>
                <div className="text-[10px] text-slate-400 mt-1">↗ Ver en Etherscan</div>
              </a>

              {/* Contracts */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Contratos Inteligentes:</div>
              <div className="space-y-2">
                {Object.entries(CONTRACT_ADDRESSES).map(([name, addr]) => (
                  <a
                    key={name}
                    href={`${SEPOLIA_EXPLORER}/address/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 rounded text-[10px] font-mono text-slate-300 hover:text-blue-400 transition-all truncate"
                    title={addr}
                  >
                    <div className="font-semibold capitalize mb-0.5">{name === 'academy' ? '🏫 Academy' : name === 'diploma' ? '🎓 Diploma' : '🎵 Composition'}</div>
                    <div className="truncate text-slate-500">{addr}</div>
                  </a>
                ))}
              </div>

              {/* Quick Links */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Enlaces Rápidos:</div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={walletAddress && !walletAddress.startsWith('0xValentino') ? `${SEPOLIA_EXPLORER}/address/${walletAddress}` : SEPOLIA_EXPLORER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-900 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded text-[10px] text-center font-mono transition-all"
                >
                  {walletAddress && !walletAddress.startsWith('0xValentino') ? '👤 Mi Wallet' : '🔍 Explorador'}
                </a>
                <a
                  href={`${SEPOLIA_EXPLORER}/token/${CONTRACT_ADDRESSES.diploma}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-900 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 rounded text-[10px] text-center font-mono transition-all"
                >
                  🏆 Diplomas (SBT)
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connect Button or Status */}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/50 px-3 py-2 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={() => {
                setIsConnected(false)
                setWalletAddress('0xValentinoLattanzi77764DDR5LianLiIII')
              }}
              className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-all"
              title="Desconecta la wallet actual. Luego haz clic en Conectar para cambiar de cuenta."
            >
              Cambiar
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all"
          >
            {isConnecting ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Icons.Wallet />
            )}
            {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
          </button>
        )}

        {/* Audit Dashboard Button */}
        <button
          onClick={() => setShowAudit(true)}
          className="hidden md:flex items-center gap-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-emerald-600/80 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 transition-all"
          title="Abrir Dashboard de Auditoría"
        >
          📊 Auditoría
        </button>

        {/* Role Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium px-2 hidden sm:flex items-center gap-1">
            <Icons.User /> Rol:
          </span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as any)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-lg border-none focus:ring-2 focus:ring-indigo-400 cursor-pointer outline-none transition-all w-full sm:w-auto"
          >
            <option value="professor">👨‍🏫 Portal Docente</option>
            <option value="student">🎼 Portal Alumno</option>
            <option value="validator">🔍 Validador</option>
            <option value="admin">⚙️ Administración</option>
          </select>
        </div>
      </div>

      {/* Audit Dashboard Modal */}
      {showAudit && <AuditDashboard onClose={() => setShowAudit(false)} />}
    </header>
  )
}
