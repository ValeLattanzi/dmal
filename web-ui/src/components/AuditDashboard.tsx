import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { blockchainService } from '../services/blockchain'
import { etherscanLinks, truncateHash } from '../utils/etherscan'
import type { Grade, Composition } from '../types'

interface StudentAuditData {
  wallet: string
  career: number
  completedCurriculum: boolean
  hasDiploma: boolean
  tokenId: number
  grades: Grade[]
  compositions: Composition[]
}

export const AuditDashboard = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'careers' | 'students' | 'grades' | 'legajos'>('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Overview tab state
  const [allCompositions, setAllCompositions] = useState<Composition[]>([])
  const [gradeEvents, setGradeEvents] = useState<any[]>([])
  const [compositionEvents, setCompositionEvents] = useState<any[]>([])

  // Students tab state
  const [studentSearch, setStudentSearch] = useState('')
  const [studentData, setStudentData] = useState<StudentAuditData | null>(null)
  const [studentSearched, setStudentSearched] = useState(false)

  // Grades tab state
  const [gradeSearch, setGradeSearch] = useState({ student: '', professor: '' })
  const [gradeResults, setGradeResults] = useState<Grade[]>([])

  // Legajos tab state
  const [legajoSearch, setLegajoSearch] = useState('')
  const [legajoResults, setLegajoResults] = useState<Composition[]>([])

  // Load blockchain data on mount
  useEffect(() => {
    if (activeTab === 'overview') {
      loadBlockchainData()
    }
  }, [activeTab])

  const loadBlockchainData = async () => {
    setIsLoading(true)
    try {
      const [comps, grades, compos] = await Promise.all([
        blockchainService.getAllCompositions(),
        blockchainService.getLatestGradeSubmissions(50),
        blockchainService.getLatestCompositionRegistrations(50),
      ])
      setAllCompositions(comps)
      setGradeEvents(grades)
      setCompositionEvents(compos)
    } catch (error) {
      console.error('Error loading blockchain data:', error)
    }
    setIsLoading(false)
  }

  const handleStudentSearch = async () => {
    if (!studentSearch.trim()) return
    setIsLoading(true)
    setStudentSearched(true)
    try {
      const data = await blockchainService.fetchStudentData(studentSearch)
      const careerId = await blockchainService.getStudentCareer(studentSearch)
      const { hasDiploma, tokenId } = await blockchainService.getDiplomaInfo(studentSearch)
      const completedCurriculum = await blockchainService.hasCompletedAllSubjects(studentSearch)

      setStudentData({
        wallet: studentSearch,
        career: careerId,
        completedCurriculum,
        hasDiploma,
        tokenId,
        grades: data.grades,
        compositions: data.compositions,
      })
    } catch (error) {
      console.error('Error fetching student data:', error)
    }
    setIsLoading(false)
  }

  const handleGradeSearch = async () => {
    if (!gradeSearch.student.trim() || !gradeSearch.professor.trim()) return
    setIsLoading(true)
    try {
      const professorId = parseInt(gradeSearch.professor)
      const grades = await blockchainService.getGradesByProfessor(gradeSearch.student, professorId)
      setGradeResults(grades)
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
    setIsLoading(false)
  }

  const handleLegajoSearch = async () => {
    if (!legajoSearch.trim()) return
    setIsLoading(true)
    try {
      const allComps = await blockchainService.getAllCompositions()
      const filtered = allComps.filter(
        (comp) =>
          comp.author.toLowerCase() === legajoSearch.toLowerCase() ||
          comp.title.toLowerCase().includes(legajoSearch.toLowerCase())
      )
      setLegajoResults(filtered)
    } catch (error) {
      console.error('Error fetching legajos:', error)
    }
    setIsLoading(false)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 p-6 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📊</div>
            <h2 className="text-2xl font-bold text-slate-100">Dashboard de Auditoría On-Chain</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'overview', label: 'Resumen', icon: '📊' },
            { id: 'careers', label: 'Carreras', icon: '🎓' },
            { id: 'students', label: 'Estudiantes', icon: '👥' },
            { id: 'grades', label: 'Notas', icon: '📝' },
            { id: 'legajos', label: 'Legajos', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Notas Registradas
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">{gradeEvents.length}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Composiciones
                  </div>
                  <div className="text-3xl font-bold text-cyan-400">{compositionEvents.length}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Total Legajos
                  </div>
                  <div className="text-3xl font-bold text-blue-400">{allCompositions.length}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Estado
                  </div>
                  <button
                    onClick={loadBlockchainData}
                    disabled={isLoading}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold disabled:text-slate-500"
                  >
                    {isLoading ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-lg font-bold text-slate-200 mb-4">📝 Últimas Notas Registradas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gradeEvents.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay notas registradas aún en blockchain.</p>
                  ) : (
                    gradeEvents.slice(-10).map((event, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs p-3 bg-slate-900 rounded-lg border border-slate-800"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-semibold text-emerald-400">Carga de Nota</span>
                          <span className="text-slate-500">Bloque #{event.blockNumber}</span>
                        </div>
                        <a
                          href={etherscanLinks.tx(event.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 underline"
                        >
                          {truncateHash(event.transactionHash, 6, 4)}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-lg font-bold text-slate-200 mb-4">🎵 Últimas Composiciones Registradas</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {compositionEvents.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay composiciones registradas aún en blockchain.</p>
                  ) : (
                    compositionEvents.slice(-10).map((event, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs p-3 bg-slate-900 rounded-lg border border-slate-800"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-semibold text-cyan-400">Registro IP</span>
                          <span className="text-slate-500">Bloque #{event.blockNumber}</span>
                        </div>
                        <a
                          href={etherscanLinks.tx(event.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline"
                        >
                          {truncateHash(event.transactionHash, 6, 4)}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CAREERS TAB */}
          {activeTab === 'careers' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Carreras Registradas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3].map((careerId) => (
                    <div key={careerId} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <div className="text-sm font-semibold text-emerald-400 mb-2">Carrera #{careerId}</div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>📚 Materias obligatorias:</p>
                        <ul className="ml-4 space-y-1">
                          {careerId === 1 && (
                            <>
                              <li>• Materia #1 - Composición Musical I</li>
                              <li>• Materia #2 - Contrapunto Avanzado</li>
                              <li>• Materia #3 - Audioperceptiva V</li>
                            </>
                          )}
                          {careerId !== 1 && <li>• (Configurar materias con Tab 1)</li>}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="0x... dirección del alumno"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={handleStudentSearch}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:text-slate-500"
                >
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {studentSearched && studentData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Carrera</div>
                      <div className="text-lg font-bold text-emerald-400">#{studentData.career}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Currículo Completo</div>
                      <div className={`text-lg font-bold ${studentData.completedCurriculum ? 'text-emerald-400' : 'text-red-400'}`}>
                        {studentData.completedCurriculum ? '✓ Sí' : '✗ No'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Diploma SBT</div>
                      {studentData.hasDiploma ? (
                        <div className="text-lg font-bold text-emerald-400">
                          Token #{studentData.tokenId}
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-yellow-400">Sin diploma</div>
                      )}
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Notas</div>
                      <div className="text-lg font-bold text-cyan-400">{studentData.grades.length} registros</div>
                    </div>
                  </div>

                  {studentData.grades.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-200 mb-3">Historial Académico</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {studentData.grades.map((grade) => (
                          <div key={grade.subjectId} className="flex justify-between items-center text-xs p-2 bg-slate-900 rounded">
                            <span className="text-slate-300">{grade.subjectName}</span>
                            <span className={`font-semibold ${grade.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                              {grade.score} {grade.approved ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {studentData.compositions.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-200 mb-3">Composiciones Registradas</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {studentData.compositions.map((comp) => (
                          <div key={comp.id} className="text-xs p-2 bg-slate-900 rounded border border-slate-800">
                            <div className="font-semibold text-cyan-400">{comp.title}</div>
                            <div className="text-slate-500 font-mono">{comp.ipfsHash}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* GRADES TAB */}
          {activeTab === 'grades' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={gradeSearch.student}
                  onChange={(e) => setGradeSearch({ ...gradeSearch, student: e.target.value })}
                  placeholder="0x... dirección del alumno"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  value={gradeSearch.professor}
                  onChange={(e) => setGradeSearch({ ...gradeSearch, professor: e.target.value })}
                  placeholder="ID del profesor (ej: 14)"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleGradeSearch}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:text-slate-500"
              >
                {isLoading ? 'Buscando...' : 'Buscar Notas'}
              </button>

              {gradeResults.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Resultados</h4>
                  <div className="space-y-2">
                    {gradeResults.map((grade) => (
                      <div key={grade.subjectId} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{grade.subjectName}</div>
                          <div className="text-slate-500">Profesor #{grade.professorId}</div>
                        </div>
                        <div className={`text-lg font-bold ${grade.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                          {grade.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEGAJOS TAB */}
          {activeTab === 'legajos' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={legajoSearch}
                  onChange={(e) => setLegajoSearch(e.target.value)}
                  placeholder="Buscar por autor (0x...) o título"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleLegajoSearch}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:text-slate-500"
                >
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {legajoResults.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">
                    Legajos Encontrados ({legajoResults.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {legajoResults.map((legajo) => (
                      <div key={legajo.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-cyan-400">{legajo.title}</div>
                            <div className="text-slate-500 font-mono">{legajo.author.substring(0, 12)}...</div>
                          </div>
                          <div className="bg-slate-800 px-2 py-1 rounded text-slate-400">ID #{legajo.id}</div>
                        </div>
                        <div className="text-slate-400">
                          IPFS: <span className="font-mono">{legajo.ipfsHash.substring(0, 20)}...</span>
                        </div>
                        <div className="text-slate-500">{legajo.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
