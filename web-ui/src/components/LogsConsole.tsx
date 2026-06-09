import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

const renderLogWithLinks = (log: string) => {
  // Detect URLs starting with https://
  const urlRegex = /(https:\/\/[^\s]+)/g
  const parts = log.split(urlRegex)

  return parts.map((part, idx) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline transition-colors inline-flex items-center gap-0.5"
        >
          {part.length > 50 ? `${part.substring(0, 47)}...` : part}
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )
    }
    return <span key={idx}>{part}</span>
  })
}

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
        {logs.map((log, idx) => {
          let colorClass = 'text-slate-400'
          if (log.includes('REST')) colorClass = 'text-indigo-300'
          else if (log.includes('Captured') || log.includes('Event')) colorClass = 'text-emerald-300'
          else if (log.includes('ADMIN') || log.includes('REVOCACIÓN')) colorClass = 'text-rose-400'
          else if (log.includes('📋 TX') || log.includes('🔗')) colorClass = 'text-cyan-300 font-semibold'

          return (
            <div key={idx} className={colorClass}>
              {renderLogWithLinks(log)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
