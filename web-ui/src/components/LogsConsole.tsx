import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export const LogsConsole = () => {
  const { logs } = useAppStore()
  const logConsoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="glass rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex flex-col h-[200px]">
      <div className="bg-slate-900/60 border-b border-slate-900 px-4 py-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
        <span>Servicio Backend: Spring Boot & Web3j Logs</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
      <div
        ref={logConsoleRef}
        className="p-4 font-mono text-[11px] text-slate-300 space-y-1.5 overflow-y-auto flex-1 select-text"
      >
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`${
              log.includes('REST')
                ? 'text-indigo-300'
                : log.includes('Captured') || log.includes('Event')
                  ? 'text-emerald-300'
                  : log.includes('ADMIN') || log.includes('REVOCACIÓN')
                    ? 'text-rose-400'
                    : 'text-slate-400'
            }`}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
