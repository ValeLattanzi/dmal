import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { blockchainService } from '../services/blockchain'
import { Icons } from './Icons'

interface OnChainStudentData {
  isActive: boolean
  grades: Array<{
    subjectId: number
    subjectName: string
    score: number
    approved: boolean
    date: string
    professorId: number
    status: string
  }>
  compositions: any[]
  diplomaTokenId: number
}

export const ValidatorPortal = () => {
  const [queryAddress, setQueryAddress] = useState('')
  const [queryData, setQueryData] = useState<OnChainStudentData | null>(null)
  const [isQuerying, setIsQuerying] = useState(false)

  const { walletAddress, grades, blockHeight, diplomaTokenId, showToast } = useAppStore()

  // Usa datos consultados si existen, sino datos del wallet conectado
  const displayData = queryData || {
    isActive: grades.some((g) => g.approved && g.status === 'CONFIRMED'),
    grades,
    compositions: [],
    diplomaTokenId,
  }

  const displayAddress = queryAddress || walletAddress
  const hasWalletConnected = walletAddress && !walletAddress.startsWith('0xValentino')
  const approvedCount = displayData.grades.filter((g) => g.approved && g.status === 'CONFIRMED').length

  const handleQueryWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryAddress.trim()) {
      showToast('Por favor ingresa una dirección wallet', 'error')
      return
    }

    if (!queryAddress.startsWith('0x') || queryAddress.length < 15) {
      showToast('Dirección hexadecimal inválida', 'error')
      return
    }

    setIsQuerying(true)
    try {
      const data = await blockchainService.fetchStudentData(queryAddress)
      setQueryData(data)
      if (data.grades.length === 0 && data.diplomaTokenId === 0) {
        showToast('Wallet consultada. No hay datos académicos registrados en blockchain.', 'info')
      } else {
        showToast(`Datos cargados: ${data.grades.length} materia(s), Diploma: ${data.diplomaTokenId > 0 ? 'SÍ' : 'NO'}`, 'success')
      }
    } catch (err: any) {
      showToast('Error consultando wallet', 'error')
    } finally {
      setIsQuerying(false)
    }
  }

  const handleClearQuery = () => {
    setQueryAddress('')
    setQueryData(null)
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda de Wallet o mostrar conectada */}
      <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-3">
          <Icons.Shield />
          <h3 className="font-bold text-lg">
            {hasWalletConnected ? 'Mi Diploma On-Chain' : 'Consultar Wallet On-Chain'}
          </h3>
        </div>

        {hasWalletConnected ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-emerald-950/30 border border-emerald-500/40 rounded-xl px-4 py-3 text-sm text-emerald-300 font-mono">
              {walletAddress}
            </div>
            <form onSubmit={handleQueryWallet} className="flex gap-2">
              <input
                type="text"
                value={queryAddress}
                onChange={(e) => setQueryAddress(e.target.value)}
                placeholder="Consultar otra wallet..."
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono w-64"
              />
              <button
                type="submit"
                disabled={isQuerying || !queryAddress.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm flex items-center gap-2 whitespace-nowrap"
              >
                {isQuerying ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Consultando...
                  </>
                ) : (
                  'Consultar'
                )}
              </button>
              {queryData && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all text-sm"
                >
                  Limpiar
                </button>
              )}
            </form>
          </div>
        ) : (
          <form onSubmit={handleQueryWallet} className="flex gap-2">
            <input
              type="text"
              value={queryAddress}
              onChange={(e) => setQueryAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isQuerying}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm flex items-center gap-2"
            >
              {isQuerying ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Consultando...
                </>
              ) : (
                'Verificar On-Chain'
              )}
            </button>
            {queryData && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all text-sm"
              >
                Limpiar
              </button>
            )}
          </form>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diploma SBT Visual */}
        <div className="hologram-card rounded-3xl p-6 border flex flex-col justify-between relative min-h-[380px] text-slate-100">
          <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-4 py-1.5 rounded-bl-xl border-l border-b border-emerald-500/30 tracking-widest font-mono">
            {displayData.diplomaTokenId > 0 ? `SOULBOUND #${displayData.diplomaTokenId}` : 'SBT PENDING'}
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Icons.Award />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                DIPLOMA ACADÉMICO
              </h3>
              <p className="text-xs text-slate-400">Conservatorio Superior de Música</p>
            </div>
          </div>

          <div className="space-y-3 my-6 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-850/80">
            <p className="flex justify-between">
              <span className="text-slate-500">Graduado:</span>{' '}
              <span className="text-slate-200 font-bold">Valentino Lattanzi</span>
            </p>
            <p className="flex justify-between items-center">
              <span className="text-slate-500">Wallet:</span>{' '}
              <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30 text-[10px]">
                {displayAddress.substring(0, 16)}...
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Materias Aprobadas:</span>{' '}
              <span className="text-slate-300">
                {approvedCount} / {displayData.grades.length}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Estado:</span>{' '}
              <span className={`font-bold flex items-center gap-1 ${displayData.diplomaTokenId > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {displayData.diplomaTokenId > 0 ? '✔ SBT ACTIVO' : '○ Sin Diploma'}
              </span>
            </p>
          </div>

          <div className="text-[10px] text-slate-400 italic text-center border-t border-slate-850 pt-3">
            "Diploma anclado criptográficamente a la identidad del alumno."
          </div>
        </div>

        {/* Academic Audit Panel */}
        <div className="glass rounded-2xl p-6 border border-slate-850 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
              <Icons.Shield />
              <h3 className="font-bold">Escrutinio Público del Analítico</h3>
            </div>
            <p className="text-xs text-slate-400">
              Audita el historial académico verificado en la blockchain de forma descentralizada.
            </p>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {displayData.grades.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">No hay registros académicos</div>
              ) : (
                displayData.grades.map((g, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{g.subjectName}</p>
                      <p className="text-[10px] text-slate-500">
                        Profesor ID: #{g.professorId} · {g.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                          g.approved ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'
                        }`}
                      >
                        {g.score}
                      </span>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">{g.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-center text-xs text-slate-500 font-mono">
            Bloque: #{blockHeight}
          </div>
        </div>
      </div>
    </div>
  )
}
