import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

export const StudentPortal = () => {
  const [compTitle, setCompTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { walletAddress, grades, addComposition, addTransaction, addLog } =
    useAppStore()

  const isRegular = grades.some((g) => g.approved && g.status === 'CONFIRMED')

  const generateIPFSHash = () => {
    return 'Qm' + Array.from({ length: 44 }, () =>
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('')
  }

  const handleRegisterComposition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compTitle || isProcessing) return

    setIsProcessing(true)
    const txHash = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    const shortTx = txHash.substring(0, 10) + '...' + txHash.substring(36)
    const ipfsHash = generateIPFSHash()

    try {
      addLog(`REST - POST /api/v1/ip/compositions - Received file metadata.`)
      addLog(
        `CompositionRegistry - Executing cross-contract query to ConservatoryAcademy.sol...`
      )

      addTransaction({
        id: Date.now(),
        type: 'Registro IP',
        detail: `IPFS: ${compTitle}`,
        status: 'PENDING_ON_CHAIN',
        txHash: shortTx,
        block: 'Pendiente...',
      })

      setTimeout(() => {
        addComposition({
          id: Math.random(),
          title: compTitle,
          ipfsHash: ipfsHash,
          author: walletAddress,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          isRegular: isRegular,
        })

        addLog(
          `Event Listener - Captured 'CompositionRegistered' on EVM. Mapping populated: author => CID`
        )
        setCompTitle('')
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error('Error registering composition:', error)
      alert('Error al registrar composición')
      setIsProcessing(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-850 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Icons.Music />
          <h3 className="font-bold text-lg">Prueba de Existencia Intelectual (IP)</h3>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-mono">
          Interface: IPFS Registry
        </span>
      </div>

      <form onSubmit={handleRegisterComposition} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Título de la Obra / Partitura
          </label>
          <input
            type="text"
            value={compTitle}
            onChange={(e) => setCompTitle(e.target.value)}
            placeholder="Ej: Fantasía para Cello y Piano en Mi Menor"
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Carga de Partitura o Grabación de Audio
          </label>
          <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-5 text-center">
            <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-cyan-500/20">
              <Icons.Music />
            </div>
            <span className="text-xs text-slate-400 font-semibold block">archivo_partitura_final.pdf</span>
            <span className="text-[10px] text-slate-600 font-mono mt-1 block">
              Generado hash SHA-256 local para IPFS de forma inmutable
            </span>
          </div>
        </div>

        <div className="p-4 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Icons.CheckCircle />
            <span>Consulta Cross-Contract Verificada</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Tu estado es{' '}
            <strong>{isRegular ? '✓ REGULAR' : '✗ NO REGULAR'}</strong>. El contrato verificó tu
            historial académico.
            {isRegular ? (
              <> Se omitirá el cobro de tarifa externa de <strong>0.05 ETH</strong>.</>
            ) : (
              <> Se aplicará tarifa de <strong>0.05 ETH</strong>.</>
            )}
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-cyan-600/10 flex justify-center items-center gap-2 text-sm"
        >
          {isProcessing ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              Firmando & Registrando...
            </>
          ) : (
            'Registrar Propiedad Intelectual de la Obra'
          )}
        </button>
      </form>
    </div>
  )
}
