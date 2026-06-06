import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { blockchainService } from '../services/blockchain'
import { Icons } from './Icons'

export const Header = () => {
  const [isConnecting, setIsConnecting] = useState(false)
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
        {/* EVM Status widget */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Node:</span>
            <span className="text-emerald-400 font-bold">Sepolia</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <div>
            <span className="text-slate-400">Block:</span>
            <span className="text-slate-200 font-bold ml-1">#{blockHeight}</span>
          </div>
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
    </header>
  )
}
