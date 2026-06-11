import { useState } from 'react'
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

export const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'professors' | 'enroll' | 'diploma' | 'recovery'>('curriculum')
  const [isLoading, setIsLoading] = useState(false)
  const [eligibility, setEligibility] = useState<boolean | null>(null)
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)

  // Professors tab state
  const [profForms, setProfForms] = useState<Record<number, { id: string; name: string }>>({})

  // Curriculum tab state
  const [careerId, setCareerId] = useState('')
  const [subjectIds, setSubjectIds] = useState('')

  // Enroll tab state
  const [enrollAddress, setEnrollAddress] = useState('')
  const [enrollCareerId, setEnrollCareerId] = useState('')

  // Diploma tab state
  const [diplomaAddress, setDiplomaAddress] = useState('')

  // Recovery tab state
  const [reissuedWallet, setReissuedWallet] = useState('')

  const {
    walletAddress,
    setWalletAddress,
    setSbtRevoked,
    isSbtRevoked,
    addLog,
    showToast,
    professorAssignments,
    assignProfessor,
  } = useAppStore()

  // === CURRICULUM TAB ===
  const handleDefineCurriculum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!careerId.trim() || !subjectIds.trim()) {
      showToast('Por favor completa Carrera ID y Materias', 'error')
      return
    }

    setIsLoading(true)
    try {
      const cid = parseInt(careerId)
      const ids = subjectIds
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n))

      if (cid <= 0 || ids.length === 0) {
        showToast('Carrera ID debe ser > 0, Materias debe ser array válido', 'error')
        return
      }

      addLog(`ADMIN - Calling defineCurriculum(${cid}, [${ids.join(', ')}])`)
      showToast('Definiendo currícula en blockchain...', 'info')

      const receipt = await blockchainService.defineCurriculum(cid, ids)

      showToast(
        `✔️ Currícula definida en bloque #${receipt.blockNumber}`,
        'confirmed'
      )
      addLog(`ADMIN - Currícula #${cid} definida en blockchain. Evento CurriculumDefined emitido.`)
      addLog(`📋 TX: ${receipt.hash} | Block: #${receipt.blockNumber}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)

      setCareerId('')
      setSubjectIds('')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error: ${reason}`, 'error')
      addLog(`[ERROR] defineCurriculum: ${reason}`)
    } finally {
      setIsLoading(false)
    }
  }

  // === ENROLL TAB ===
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollAddress.trim() || !enrollCareerId.trim()) {
      showToast('Por favor completa Dirección Alumno y Carrera ID', 'error')
      return
    }

    if (!enrollAddress.startsWith('0x') || enrollAddress.length < 15) {
      showToast('Dirección hexadecimal inválida', 'error')
      return
    }

    setIsLoading(true)
    try {
      const cid = parseInt(enrollCareerId)
      if (cid <= 0) {
        showToast('Carrera ID debe ser > 0', 'error')
        return
      }

      addLog(`ADMIN - Calling enrollStudent(${enrollAddress}, ${cid})`)
      showToast('Inscribiendo alumno en blockchain...', 'info')

      const receipt = await blockchainService.enrollStudent(enrollAddress, cid)

      showToast(`✔️ Alumno inscrito en bloque #${receipt.blockNumber}`, 'confirmed')
      addLog(`ADMIN - Alumno ${enrollAddress.substring(0, 10)}... inscrito en carrera #${cid}. Evento CareerAssigned emitido.`)
      addLog(`📋 TX: ${truncateHash(receipt.hash)} | Block: #${receipt.blockNumber}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)

      setEnrollAddress('')
      setEnrollCareerId('')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error: ${reason}`, 'error')
      addLog(`[ERROR] enrollStudent: ${reason}`)
    } finally {
      setIsLoading(false)
    }
  }

  // === PROFESSORS TAB ===
  const handleAssignProfessor = (subjectId: number, e: React.FormEvent) => {
    e.preventDefault()
    const form = profForms[subjectId]
    if (!form?.id?.trim() || !form?.name?.trim()) {
      showToast('Completa ID y nombre del docente', 'error')
      return
    }

    const profId = parseInt(form.id)
    if (isNaN(profId) || profId <= 0) {
      showToast('El ID del docente debe ser un número > 0', 'error')
      return
    }

    assignProfessor(subjectId, profId, form.name.trim())
    addLog(`ADMIN - Docente "${form.name.trim()}" (ID ${profId}) asignado a "${SUBJECTS[subjectId]}"`)
    showToast(`✔️ Docente asignado a ${SUBJECTS[subjectId]}`, 'success')
  }

  // === DIPLOMA TAB ===
  const handleCheckEligibility = async () => {
    if (!diplomaAddress.startsWith('0x') || diplomaAddress.length < 15) {
      showToast('Por favor ingresa la dirección del graduado', 'error')
      return
    }

    setIsCheckingEligibility(true)
    setEligibility(null)
    try {
      const completed = await blockchainService.hasCompletedAllSubjects(diplomaAddress)
      setEligibility(completed)
      addLog(`ADMIN - hasCompletedAllSubjects(${diplomaAddress.substring(0, 10)}...) -> ${completed}`)
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error: ${reason}`, 'error')
      addLog(`[ERROR] hasCompletedAllSubjects: ${reason}`)
    } finally {
      setIsCheckingEligibility(false)
    }
  }

  const handleMintDiploma = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diplomaAddress.trim()) {
      showToast('Por favor ingresa la dirección del graduado', 'error')
      return
    }

    if (!diplomaAddress.startsWith('0x') || diplomaAddress.length < 15) {
      showToast('Dirección hexadecimal inválida', 'error')
      return
    }

    setIsLoading(true)
    try {
      const legajoHash = ethers.keccak256(
        ethers.solidityPacked(['address', 'uint256'], [diplomaAddress, Math.floor(Date.now() / 1000)])
      )

      addLog(`ADMIN - Calling mintDiploma(${diplomaAddress}, ${legajoHash})`)
      showToast('Emitiendo Diploma SBT...', 'info')

      const receipt = await blockchainService.mintDiploma(diplomaAddress, legajoHash)

      showToast(
        `✔️ Diploma SBT emitido en bloque #${receipt.blockNumber}`,
        'confirmed'
      )
      addLog(`ADMIN - Diploma SBT emitido a ${diplomaAddress.substring(0, 10)}... Evento DiplomaIssued emitido.`)
      addLog(`📋 TX: ${truncateHash(receipt.hash)} | Block: #${receipt.blockNumber}`)
      addLog(`🔗 Verificar: ${etherscanLinks.tx(receipt.hash)}`)

      setDiplomaAddress('')
    } catch (err: any) {
      const reason = err?.reason ?? err?.shortMessage ?? err?.message ?? 'Error desconocido'
      showToast(`Error: ${reason}`, 'error')
      addLog(`[ERROR] mintDiploma: ${reason}`)
    } finally {
      setIsLoading(false)
    }
  }

  // === RECOVERY TAB ===
  const handleAdminReissue = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reissuedWallet.startsWith('0x') || reissuedWallet.length < 15) {
      showToast('Por favor introduce una dirección hexadecimal de wallet válida.', 'error')
      return
    }

    addLog(`ADMIN ACTION - Emergency SBT revocation triggered for old wallet: ${walletAddress.substring(0, 10)}...`)
    addLog(`KMS Signer - Dispatching burn() for SBT #9921 on token contract...`)

    setSbtRevoked(true)
    setWalletAddress(reissuedWallet)

    addLog(
      `KMS Signer - Dispatching mint() of reissued SBT to: ${reissuedWallet.substring(0, 10)}...`
    )
    showToast('🚨 SBT Revocado. Historial de analíticos migrado de forma segura a la nueva wallet.', 'error')
    setReissuedWallet('')
  }

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-800 overflow-x-auto pb-4">
        {(['curriculum', 'professors', 'enroll', 'diploma', 'recovery'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 font-semibold text-sm rounded-lg transition-all border ${
              activeTab === tab
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab === 'curriculum' && '📚 1. Currícula'}
            {tab === 'professors' && '🧑‍🏫 2. Docentes'}
            {tab === 'enroll' && '📝 3. Inscribir'}
            {tab === 'diploma' && '🎓 Diploma'}
            {tab === 'recovery' && '🔐 Recuperación'}
          </button>
        ))}
      </div>

      {/* CURRICULUM TAB */}
      {activeTab === 'curriculum' && (
        <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
            <Icons.BookOpen />
            <h3 className="font-bold text-lg">Definir Carrera y Currícula</h3>
          </div>

          <p className="text-xs text-slate-400">
            Define una carrera con su lista de materias obligatorias. Ej: Carrera 1, Materias: 1,2,3
          </p>

          <form onSubmit={handleDefineCurriculum} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ID de Carrera
                </label>
                <input
                  type="number"
                  value={careerId}
                  onChange={(e) => setCareerId(e.target.value)}
                  placeholder="Ej: 1"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  IDs de Materias (separadas por coma)
                </label>
                <input
                  type="text"
                  value={subjectIds}
                  onChange={(e) => setSubjectIds(e.target.value)}
                  placeholder="Ej: 1,2,3"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-rose-600/15 flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando...
                </>
              ) : (
                'Definir Currícula en Blockchain'
              )}
            </button>
          </form>
        </div>
      )}

      {/* PROFESSORS TAB */}
      {activeTab === 'professors' && (
        <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
            <Icons.User />
            <h3 className="font-bold text-lg">Asignar Docentes a Materias</h3>
          </div>

          <p className="text-xs text-slate-400">
            Paso 2: asigná un docente responsable a cada materia de la currícula. Esta asignación es
            visual/organizativa (no se registra on-chain) y se usa para guiar la corrección de notas.
          </p>

          <div className="space-y-4">
            {Object.entries(SUBJECTS).map(([id, name]) => {
              const subjectId = parseInt(id)
              const current = professorAssignments[subjectId]
              const form = profForms[subjectId] ?? { id: '', name: '' }
              return (
                <form
                  key={id}
                  onSubmit={(e) => handleAssignProfessor(subjectId, e)}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">{name}</span>
                    {current && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full font-mono">
                        Actual: {current.name} (ID {current.id})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
                    <input
                      type="number"
                      value={form.id}
                      onChange={(e) =>
                        setProfForms((prev) => ({ ...prev, [subjectId]: { ...form, id: e.target.value } }))
                      }
                      placeholder="ID docente"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                    />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setProfForms((prev) => ({ ...prev, [subjectId]: { ...form, name: e.target.value } }))
                      }
                      placeholder="Nombre del docente"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all"
                    >
                      Asignar
                    </button>
                  </div>
                </form>
              )
            })}
          </div>
        </div>
      )}

      {/* ENROLL TAB */}
      {activeTab === 'enroll' && (
        <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-3">
            <Icons.User />
            <h3 className="font-bold text-lg">Inscribir Estudiante</h3>
          </div>

          <p className="text-xs text-slate-400">
            Matricula un alumno en una carrera. El alumno debe tener una wallet de Ethereum válida.
          </p>

          <form onSubmit={handleEnrollStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Dirección Wallet del Alumno
              </label>
              <input
                type="text"
                value={enrollAddress}
                onChange={(e) => setEnrollAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ID de Carrera
              </label>
              <input
                type="number"
                value={enrollCareerId}
                onChange={(e) => setEnrollCareerId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/15 flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando...
                </>
              ) : (
                'Inscribir en ConservatoryAcademy'
              )}
            </button>
          </form>
        </div>
      )}

      {/* DIPLOMA TAB */}
      {activeTab === 'diploma' && (
        <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
            <Icons.Award />
            <h3 className="font-bold text-lg">Emitir Diploma SBT (Soulbound Token)</h3>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl text-xs space-y-2 text-emerald-300">
            <p className="font-bold">🎓 Flujo de Emisión de Diploma:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li><strong>Validación:</strong> Verifica que el alumno completó todas las materias de su currícula</li>
              <li><strong>Generación:</strong> Genera un hash criptográfico único (legajo) basado en dirección + timestamp</li>
              <li><strong>Acuñación:</strong> Emite un NFT no transferible (SBT) a la wallet del graduado</li>
              <li><strong>Permanencia:</strong> El diploma queda grabado permanentemente en blockchain de Sepolia</li>
              <li><strong>Recuperación:</strong> Si la wallet se compone, el diploma puede reemitirse en otra wallet manteniendo el historial</li>
            </ol>
          </div>

          <form onSubmit={handleMintDiploma} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Dirección del Graduado
              </label>
              <input
                type="text"
                value={diplomaAddress}
                onChange={(e) => {
                  setDiplomaAddress(e.target.value)
                  setEligibility(null)
                }}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                El hash del legajo se genera automáticamente usando la dirección + timestamp.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCheckEligibility}
              disabled={isCheckingEligibility}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:text-slate-500 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
            >
              {isCheckingEligibility ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                  Verificando...
                </>
              ) : (
                'Verificar Elegibilidad (hasCompletedAllSubjects)'
              )}
            </button>

            {eligibility !== null && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold border ${
                  eligibility
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-950/30 border-red-500/40 text-red-400'
                }`}
              >
                {eligibility
                  ? '✅ El alumno completó todas las materias de su currícula. Puede emitirse el diploma.'
                  : '❌ El alumno todavía no completó todas las materias requeridas.'}
              </div>
            )}

            {diplomaAddress.startsWith('0x') && diplomaAddress.length >= 15 && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-400">Hash del Legajo (Prueba):</p>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-emerald-300 break-all">
                  {ethers.keccak256(
                    ethers.solidityPacked(['address', 'uint256'], [diplomaAddress, Math.floor(Date.now() / 1000)])
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Este hash se incluirá en el SBT como prueba criptográfica del legajo académico del graduado.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/15 flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando...
                </>
              ) : (
                'Emitir Diploma SBT'
              )}
            </button>
          </form>
        </div>
      )}

      {/* RECOVERY TAB */}
      {activeTab === 'recovery' && (
        <div className="glass rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Icons.Key />
              <h3 className="font-bold text-lg">Módulo de Recuperación y Contingencia</h3>
            </div>
            <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-mono">
              Multisig Admin Panel
            </span>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl text-xs space-y-2 text-rose-300">
            <p className="font-bold">🚨 SOLUCIÓN A LA VULNERABILIDAD SBT:</p>
            <p className="leading-relaxed">
              Si el estudiante pierde su wallet de egresado o se ve comprometida, este panel permite
              revocar el SBT anterior y reasumir la identidad en una wallet limpia sin perder su
              historial académico permanente.
            </p>
          </div>

          <form onSubmit={handleAdminReissue} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Dirección de la Nueva Wallet del Graduado
              </label>
              <input
                type="text"
                value={reissuedWallet}
                onChange={(e) => setReissuedWallet(e.target.value)}
                placeholder="Ej: 0xNuevaClaveLattanzi8888DDR5LianLiIII"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-rose-600/15 flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
            >
              Proceder con Revocación y Reemisión de Emergencia
            </button>
          </form>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
            <span className="text-slate-400 font-semibold block">Historial de Cambios de Dirección:</span>
            <div className="font-mono text-[10px] space-y-1 text-slate-500">
              <p>&bull; 2026-05-22 09:00 - Registrada wallet de ingreso: <span className="text-indigo-400">0xValentino...77</span></p>
              {isSbtRevoked && (
                <p className="text-rose-400 animate-pulse">
                  &bull; 2026-06-05 - REVOCACIÓN EJECUTADA. Nueva dirección asignada:{' '}
                  <span className="text-emerald-400">{walletAddress.substring(0, 20)}...</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
