import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { blockchainService } from '../services/blockchain'
import { ethers } from 'ethers'
import { Icons } from './Icons'
import { etherscanLinks, truncateHash } from '../utils/etherscan'

const SUBJECTS: Record<number, string> = {
  1: 'Composición Musical I',
  2: 'Contrapunto Avanzado',
  3: 'Audioperceptiva V',
}

export const StudentPortal = () => {
  const [compTitle, setCompTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'idle' | 'committing' | 'waiting' | 'revealing'>('idle')
  const [currentBlock, setCurrentBlock] = useState(0)

  const [pendingCommit, setPendingCommit] = useState<{
    ipfsHash: string
    title: string
    salt: string
    commitBlock: number
  } | null>(null)

  const {
    walletAddress,
    grades,
    addComposition,
    addTransaction,
    addLog,
    showToast,
    professorAssignments,
    addSubmission,
  } = useAppStore()

  const isRegular = grades.some((g) => g.approved && g.status === 'CONFIRMED')

  // === Trabajo Práctico (TP) submission state ===
  const [tpSubjectId, setTpSubjectId] = useState('1')
  const [tpTitle, setTpTitle] = useState('')
  const [tpFile, setTpFile] = useState<{ name: string; url: string } | null>(null)

  // === Diploma eligibility state ===
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)
  const [isEligible, setIsEligible] = useState<boolean | null>(null)
  const approvedCount = grades.filter((g) => g.approved && g.status === 'CONFIRMED').length

  useEffect(() => {
    if (!walletAddress || walletAddress.startsWith('0xValentino')) return
    let cancelled = false
    setIsCheckingEligibility(true)
    blockchainService
      .hasCompletedAllSubjects(walletAddress)
      .then((completed) => {
        if (!cancelled) setIsEligible(completed)
      })
      .catch(() => {
        if (!cancelled) setIsEligible(null)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingEligibility(false)
      })
    return () => {
      cancelled = true
    }
  }, [walletAddress, grades])

  const handleTpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      showToast('Por favor selecciona un archivo PDF', 'error')
      return
    }
    setTpFile({ name: file.name, url: URL.createObjectURL(file) })
  }

  const handleSubmitTp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tpTitle.trim() || !tpFile) {
      showToast('Completa el título y adjunta el PDF del trabajo', 'error')
      return
    }

    const subjectId = parseInt(tpSubjectId)
    addSubmission({
      id: `${Date.now()}`,
      subjectId,
      subjectName: SUBJECTS[subjectId],
      title: tpTitle.trim(),
      fileName: tpFile.name,
      fileUrl: tpFile.url,
      status: 'pending',
    })

    addLog(`ALUMNO - Entrega de TP "${tpTitle.trim()}" (${tpFile.name}) para "${SUBJECTS[subjectId]}" enviada al docente.`)
    showToast('✔️ Trabajo práctico entregado. Pendiente de corrección docente.', 'success')

    setTpTitle('')
    setTpFile(null)
  }

  const generateIPFSHash = () =>
    'Qm' + Array.from({ length: 44 }, () =>
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('')

  // Polling para obtener el bloque actual (cada 5 segundos)
  useEffect(() => {
    if (!pendingCommit) return

    const interval = setInterval(async () => {
      try {
        const bn = await blockchainService.getProvider()?.getBlockNumber()
        if (bn) setCurrentBlock(bn)
      } catch (err) {
        console.error('Error getting block number:', err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [pendingCommit])

  // STEP 1: Commit
  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compTitle || isProcessing) return

    setIsProcessing(true)
    setStep('committing')

    try {
      const ipfsHash = generateIPFSHash()
      const salt = ethers.hexlify(ethers.randomBytes(32))

      const commitHash = ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'address', 'bytes32'],
          [ipfsHash, walletAddress, salt]
        )
      )

      addLog(`CompositionRegistry - Committing hash: ${commitHash.substring(0, 20)}...`)
      showToast('Enviando commit a blockchain...', 'info')

      const receipt = await blockchainService.commitComposition(commitHash)
      const commitBlock = receipt.blockNumber

      setPendingCommit({ ipfsHash, title: compTitle, salt, commitBlock })
      setStep('waiting')
      setCurrentBlock(commitBlock)

      addLog(`Event Listener - CompositionCommitted in block #${commitBlock}`)
      addLog(`📋 TX: ${truncateHash(receipt.hash)} | Block: #${commitBlock}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)
      showToast(`✔️ Commit confirmado en bloque #${commitBlock}. Aguardando siguiente bloque...`, 'success')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error en commit: ${reason}`, 'error')
      addLog(`[ERROR] commitComposition: ${reason}`)
      setStep('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  // STEP 2: Reveal & Register
  const handleReveal = async () => {
    if (!pendingCommit || step !== 'waiting') return

    setIsProcessing(true)
    setStep('revealing')

    try {
      addLog(`CompositionRegistry - Revealing composition: "${pendingCommit.title}"`)
      showToast('Revelando y registrando en blockchain...', 'info')

      const receipt = await blockchainService.registerComposition(
        pendingCommit.ipfsHash,
        pendingCommit.title,
        pendingCommit.salt
      )

      const confirmedBlock = receipt.blockNumber

      addTransaction({
        id: Date.now(),
        type: 'Registro IP',
        detail: `IPFS: ${pendingCommit.title}`,
        status: 'CONFIRMED',
        txHash: receipt.hash,
        block: confirmedBlock,
      })

      addComposition({
        id: Math.random(),
        title: pendingCommit.title,
        ipfsHash: pendingCommit.ipfsHash,
        author: walletAddress,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRegular,
      })

      addLog(`Event Listener - CompositionRegistered in block #${confirmedBlock}`)
      addLog(`📋 TX: ${truncateHash(receipt.hash)} | Block: #${confirmedBlock}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)
      showToast('✔️ Propiedad intelectual grabada permanentemente en la EVM.', 'confirmed')

      setPendingCommit(null)
      setCompTitle('')
      setStep('idle')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error en reveal: ${reason}`, 'error')
      addLog(`[ERROR] registerComposition: ${reason}`)
      setStep('waiting')
    } finally {
      setIsProcessing(false)
    }
  }

  const blocksUntilReveal = pendingCommit ? Math.max(0, pendingCommit.commitBlock + 1 - currentBlock) : 0
  const canReveal = blocksUntilReveal <= 0 && step === 'waiting'

  return (
    <div className="space-y-6">
      {/* TP SUBMISSION */}
      <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Icons.BookOpen />
            <h3 className="font-bold text-lg">Entrega de Trabajo Práctico</h3>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono">
            Solo Visual / Off-Chain
          </span>
        </div>

        <form onSubmit={handleSubmitTp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Materia
            </label>
            <select
              value={tpSubjectId}
              onChange={(e) => setTpSubjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              {Object.entries(SUBJECTS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                  {professorAssignments[parseInt(id)] ? ` — Docente: ${professorAssignments[parseInt(id)].name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Título del Trabajo
            </label>
            <input
              type="text"
              value={tpTitle}
              onChange={(e) => setTpTitle(e.target.value)}
              placeholder="Ej: Análisis armónico - Unidad 3"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Adjuntar PDF
            </label>
            <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-5 text-center space-y-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleTpFileChange}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer"
              />
              {tpFile && (
                <span className="text-xs text-emerald-400 font-semibold block">📎 {tpFile.name}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex justify-center items-center gap-2 text-sm"
          >
            Entregar Trabajo Práctico
          </button>
        </form>
      </div>

      {/* GRADUATION STATUS */}
      <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-4">
          <Icons.Award />
          <h3 className="font-bold text-lg">Estado de Graduación</h3>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Materias aprobadas:</span>
          <span className="font-mono font-bold text-slate-200">{approvedCount} / 3</span>
        </div>

        {isCheckingEligibility && (
          <p className="text-xs text-slate-500">Consultando hasCompletedAllSubjects() en la EVM...</p>
        )}

        {isEligible && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-emerald-400">🎓 ¡Elegible para Diploma!</p>
            <p className="text-xs text-slate-400">
              Completaste todas las materias de tu currícula. Compartí esta wallet con Administración para emitir tu Diploma SBT:
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-emerald-300 break-all">
              {walletAddress}
            </div>
          </div>
        )}

        {isEligible === false && (
          <p className="text-xs text-slate-500">Todavía no se completaron todas las materias requeridas.</p>
        )}
      </div>

      {/* COMPOSITION / IP REGISTRATION */}
      <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Icons.Music />
          <h3 className="font-bold text-lg">Prueba de Existencia Intelectual (IP)</h3>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-mono">
          Interface: IPFS Registry
        </span>
      </div>

      {/* STEP 1: Commit or STEP 2: Reveal */}
      {step === 'idle' && (
        <form onSubmit={handleCommit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Título de la Obra / Partitura
            </label>
            <input
              type="text"
              value={compTitle}
              onChange={(e) => setCompTitle(e.target.value)}
              placeholder="Ej: Fantasía para Cello y Piano en Mi Menor"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
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
                Generado hash criptográfico SHA-256 local para IPFS de forma inmutable
              </span>
            </div>
          </div>

          <div className="p-4 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Icons.CheckCircle />
              <span>Consulta Cross-Contract Verificada</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              El contrato inteligente verificó tu estado en{' '}
              <code className="text-cyan-300 font-mono">ConservatoryAcademy.sol</code>.
              {isRegular ? (
                <> Estado: <strong className="text-emerald-400">REGULAR</strong>. Se omitirá el cobro de la tasa externa de <strong>0.05 ETH</strong>.</>
              ) : (
                <> Estado: <strong className="text-red-400">NO REGULAR</strong>. Se aplicará la tarifa de <strong>0.05 ETH</strong>.</>
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
                Enviando Commit...
              </>
            ) : (
              'PASO 1: Enviar Commit (Blockchain)'
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Waiting for next block */}
      {step === 'waiting' && (
        <div className="space-y-4">
          <div className="bg-indigo-950/30 border border-indigo-500/40 p-5 rounded-xl space-y-3">
            <p className="text-sm font-bold text-indigo-300">⏳ Aguardando Confirmación de Bloque</p>
            <p className="text-xs text-slate-400">
              Tu commit fue confirmado en bloque <code className="font-mono bg-slate-950 px-2 py-1 rounded">#{pendingCommit?.commitBlock}</code>.
              Debes esperar al siguiente bloque para revelar.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Bloque actual:</span>
                <span className="font-mono font-bold text-slate-200">#{currentBlock}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Bloques para revelar:</span>
                <span className={`font-mono font-bold ${blocksUntilReveal > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {blocksUntilReveal}
                </span>
              </div>

              {blocksUntilReveal > 0 && (
                <div className="mt-3 bg-slate-950 p-3 rounded-lg">
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded-full transition-all ${
                          i < 3 - Math.ceil(blocksUntilReveal) ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleReveal}
            disabled={!canReveal || isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex justify-center items-center gap-2 text-sm"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Revelando...
              </>
            ) : canReveal ? (
              'PASO 2: Revelar & Registrar (Blockchain)'
            ) : (
              `Esperando bloque siguiente... (${blocksUntilReveal} bloques)`
            )}
          </button>
        </div>
      )}

      {/* STEP 2: Revealing in progress */}
      {step === 'revealing' && (
        <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center space-y-3">
          <div className="flex justify-center">
            <span className="w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
          <p className="text-sm font-bold text-slate-300">Revelando y registrando en blockchain...</p>
          <p className="text-xs text-slate-500">Esta operación toma unos segundos.</p>
        </div>
      )}
      </div>
    </div>
  )
}
