import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'
import type { UserRole } from '../types'

const ROLES: {
  value: UserRole
  label: string
  subtitle: string
  icon: keyof typeof Icons
  active: string
  inactive: string
}[] = [
  {
    value: 'professor',
    label: 'Portal Docente',
    subtitle: 'Cargar y firmar notas on-chain',
    icon: 'BookOpen',
    active: 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20',
    inactive: 'border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300',
  },
  {
    value: 'student',
    label: 'Portal Alumno',
    subtitle: 'Registrar composiciones propias',
    icon: 'Music',
    active: 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20',
    inactive: 'border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300',
  },
  {
    value: 'validator',
    label: 'Validador',
    subtitle: 'Auditar historial y diplomas SBT',
    icon: 'Shield',
    active: 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20',
    inactive: 'border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300',
  },
  {
    value: 'admin',
    label: 'Administración',
    subtitle: 'Recuperar SBT y configurar currícula',
    icon: 'Key',
    active: 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/20',
    inactive: 'border-slate-800 text-slate-400 hover:border-amber-500/50 hover:text-amber-300',
  },
]

export const RoleTabs = () => {
  const { currentRole, setCurrentRole } = useAppStore()

  return (
    <div className="border-b border-slate-800 bg-slate-950/40 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map((role) => {
          const Icon = Icons[role.icon]
          const isActive = currentRole === role.value
          return (
            <button
              key={role.value}
              onClick={() => setCurrentRole(role.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                isActive ? role.active : `bg-slate-900/60 ${role.inactive}`
              }`}
            >
              <div className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                <Icon />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight truncate">{role.label}</div>
                <div className={`text-[11px] leading-tight truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {role.subtitle}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
