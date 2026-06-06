import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

export const Header = () => {
  const { currentRole, setCurrentRole, blockHeight } = useAppStore()

  return (
    <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
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
