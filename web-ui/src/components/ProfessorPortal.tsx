import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { blockchainService } from '../services/blockchain'
import { Icons } from './Icons'
import { etherscanLinks, truncateHash } from '../utils/etherscan'

const SUBJECTS = {
  '1': 'Composición Musical I',
  '2': 'Contrapunto Avanzado',
  '3': 'Audioperceptiva V',
}

export const ProfessorPortal = () => {
  const [selectedSubject, setSelectedSubject] = useState('1')
  const [scoreInput, setScoreInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    walletAddress,
    addGrade,
    updateGradeStatus,
    addTransaction,
    updateTransactionStatus,
    addLog,
    showToast,
  } = useAppStore()

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoreInput || isProcessing) return

    if (!walletAddress || walletAddress.startsWith('0xValentino')) {
      showToast('Conecta una wallet primero', 'error')
      return
    }

    const scoreVal = parseInt(scoreInput)
    if (scoreVal < 0 || scoreVal > 100) {
      showToast('La nota debe estar entre 0 y 100', 'error')
      return
    }

    setIsProcessing(true)
    const txHash = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    const shortTx = txHash.substring(0, 10) + '...' + txHash.substring(36)
    const tempTxId = Date.now()
    const subjectId = parseInt(selectedSubject)

    addLog(`REST - POST /api/v1/academic/grades - Received request for student ${walletAddress.substring(0, 12)}...`)
    addLog(`BlockchainService - Initiating EVM Transaction for submitGrade(...) with credentials KMS_DOCENTE_14`)

    addTransaction({
      id: tempTxId,
      type: 'Carga de Nota',
      detail: `${SUBJECTS[selectedSubject as keyof typeof SUBJECTS]}: ${scoreVal}`,
      status: 'PENDING_ON_CHAIN',
      txHash: shortTx,
      block: 'Pendiente...',
    })

    addGrade({
      subjectId,
      subjectName: SUBJECTS[selectedSubject as keyof typeof SUBJECTS],
      score: scoreVal,
      approved: scoreVal >= 60,
      date: new Date().toISOString().split('T')[0],
      professorId: 14,
      status: 'PENDING',
    })

    showToast('Spring Boot: Transacción 202 Aceptada. Esperando confirmación EVM...', 'success')

    try {
      const receipt = await blockchainService.submitGrade(walletAddress, subjectId, scoreVal, 14)
      const confirmedBlock = receipt.blockNumber

      updateTransactionStatus(tempTxId, 'CONFIRMED')
      updateGradeStatus(subjectId, 'CONFIRMED')
      addLog(`Event Listener - Caught event 'GradeSubmitted' in block #${confirmedBlock}.`)
      addLog(`PostgreSQL - Student record for ${walletAddress.substring(0, 10)}... updated status from PENDING to CONFIRMED.`)
      addLog(`📋 TX: ${truncateHash(receipt.hash)} | Block: #${confirmedBlock}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)
      showToast(`✔️ Nota de ${scoreVal} registrada on-chain para ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`, 'confirmed')
      setScoreInput('')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error: ${reason}`, 'error')
      addLog(`[ERROR] submitGrade: ${reason}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Icons.BookOpen />
          <h3 className="font-bold text-lg">Carga de Notas Analíticas</h3>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono">
          Gas Limit: 3,000,000
        </span>
      </div>

      <form onSubmit={handleGradeSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Wallet del Alumno a Evaluar
          </label>
          {walletAddress && !walletAddress.startsWith('0xValentino') ? (
            <div className="w-full bg-indigo-950/30 border border-indigo-500/40 rounded-xl px-4 py-3 text-sm text-indigo-300 font-mono flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>{walletAddress}</span>
            </div>
          ) : (
            <div className="w-full bg-slate-950 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-mono">
              ⚠️ Conecta una wallet primero
            </div>
          )}
          <span className="text-[10px] text-slate-500 mt-1.5 block">
            Se utilizará la wallet actualmente conectada. Esta dirección permanece registrada en blockchain de forma inmutable.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Asignatura / Cátedra
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              {Object.entries(SUBJECTS).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Calificación del Examen (0 - 100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="Ej: 95"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              required
            />
          </div>
        </div>

        {/* Gas Packing Optimization Visual */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            Gas Packing Optimizado (9 Bytes Struct — 1 Slot de EVM)
          </span>
          <div className="grid grid-cols-5 gap-1 text-center font-bold text-[10px] text-slate-400">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
              score<br />
              <span className="text-indigo-400 text-[9px] font-normal">uint8 (1b)</span>
            </div>
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
              attempts<br />
              <span className="text-indigo-400 text-[9px] font-normal">uint8 (1b)</span>
            </div>
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded col-span-2">
              approvalDate<br />
              <span className="text-indigo-400 text-[9px] font-normal">uint32 (4b)</span>
            </div>
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
              profId<br />
              <span className="text-indigo-400 text-[9px] font-normal">uint16 (2b)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex justify-center items-center gap-2 text-sm"
        >
          {isProcessing ? (
            <>
              <span className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
              Firmando Nota & Minando en Blockchain...
            </>
          ) : (
            'Firmar y Cargar Acta Académica'
          )}
        </button>
      </form>
    </div>
  )
}
