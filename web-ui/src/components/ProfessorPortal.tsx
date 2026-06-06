import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

const SUBJECTS = {
  '101': 'Composición Musical I',
  '102': 'Contrapunto Avanzado',
  '103': 'Audioperceptiva V',
}

export const ProfessorPortal = () => {
  const [selectedSubject, setSelectedSubject] = useState('102')
  const [scoreInput, setScoreInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { walletAddress, addGrade, addTransaction, blockHeight, addLog } = useAppStore()

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoreInput || isProcessing) return

    const scoreVal = parseInt(scoreInput)
    if (scoreVal < 0 || scoreVal > 100) {
      alert('La nota debe estar entre 0 y 100')
      return
    }

    setIsProcessing(true)
    const txHash = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    const shortTx = txHash.substring(0, 10) + '...' + txHash.substring(36)

    try {
      addLog(
        `REST - POST /api/v1/academic/grades - Received request for student ${walletAddress.substring(0, 12)}...`
      )
      addLog(`BlockchainService - Initiating EVM Transaction for submitGrade(...)`)

      // Add pending transaction
      addTransaction({
        id: Date.now(),
        type: 'Carga de Nota',
        detail: `${SUBJECTS[selectedSubject as keyof typeof SUBJECTS]}: ${scoreVal}`,
        status: 'PENDING_ON_CHAIN',
        txHash: shortTx,
        block: 'Pendiente...',
      })

      // Add pending grade
      addGrade({
        subjectId: parseInt(selectedSubject),
        subjectName: SUBJECTS[selectedSubject as keyof typeof SUBJECTS],
        score: scoreVal,
        approved: scoreVal >= 60,
        date: new Date().toISOString().split('T')[0],
        professorId: 14,
        status: 'PENDING',
      })

      // Simulate blockchain confirmation
      setTimeout(() => {
        const currentBlock = blockHeight + 1
        addLog(
          `Event Listener - Caught event 'GradeSubmitted' in block #${currentBlock}. Database synced.`
        )
        setScoreInput('')
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting grade:', error)
      alert('Error al enviar la nota')
      setIsProcessing(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-850 shadow-xl space-y-6">
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
            Dirección Wallet de Destino (Alumno)
          </label>
          <input
            type="text"
            readOnly
            value={walletAddress}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-indigo-300 font-mono focus:outline-none cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Asignatura / Cátedra
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              {Object.entries(SUBJECTS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
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
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              required
            />
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
              Firmando Nota & Minando...
            </>
          ) : (
            'Firmar y Cargar Acta Académica'
          )}
        </button>
      </form>
    </div>
  )
}
