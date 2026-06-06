import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

export const ValidatorPortal = () => {
  const { walletAddress, grades, blockHeight } = useAppStore()

  const approvedCount = grades.filter((g) => g.approved && g.status === 'CONFIRMED').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Diploma SBT Visual */}
      <div className="hologram-card rounded-3xl p-6 border flex flex-col justify-between relative min-h-[380px] text-slate-100 bg-slate-950/40 border-slate-850">
        <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-4 py-1.5 rounded-bl-xl border-l border-b border-emerald-500/30 tracking-widest font-mono">
          SOULBOUND #9921
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
              {walletAddress.substring(0, 16)}...
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Materias Aprobadas:</span>{' '}
            <span className="text-slate-300">
              {approvedCount} / {grades.length}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Estado:</span>{' '}
            <span className="text-emerald-400 font-bold flex items-center gap-1">✔ SBT ACTIVO</span>
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
            {grades.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-6">No hay registros académicos</div>
            ) : (
              grades.map((g, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{g.subjectName}</p>
                    <p className="text-[10px] text-slate-500">
                      Profesor ID: #{g.professorId} &middot; {g.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                        g.approved
                          ? 'text-emerald-400 bg-emerald-500/5'
                          : 'text-red-400 bg-red-500/5'
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
  )
}
