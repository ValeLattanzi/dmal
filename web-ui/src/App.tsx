import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { Header } from './components/Header'
import { ProfessorPortal } from './components/ProfessorPortal'
import { StudentPortal } from './components/StudentPortal'
import { ValidatorPortal } from './components/ValidatorPortal'
import { AdminPortal } from './components/AdminPortal'
import { LogsConsole } from './components/LogsConsole'
import { LedgerView } from './components/LedgerView'

function App() {
  const { currentRole, setBlockHeight, blockHeight, addLog } = useAppStore()

  // Simulate block mining
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(blockHeight + 1)
      addLog(
        `[INFO] EVM Node - New block mined: #${blockHeight + 1} (Gas limit verified, transactions packing)`
      )
    }, 12000)
    return () => clearInterval(interval)
  }, [blockHeight, setBlockHeight, addLog])

  const renderPortal = () => {
    switch (currentRole) {
      case 'professor':
        return <ProfessorPortal />
      case 'student':
        return <StudentPortal />
      case 'validator':
        return <ValidatorPortal />
      case 'admin':
        return <AdminPortal />
      default:
        return null
    }
  }

  const renderContextInfo = () => {
    const descriptions = {
      professor: {
        title: 'Firma Criptográfica de Notas Académicas',
        desc: 'Como docente, tenés la firma delegada en tu clave privada. Cada nota se empaqueta en una estructura optimizada de 9 bytes (Storage Packing) para ahorrar gas. El backend responde inmediatamente (Web2) y sincroniza con el evento EVM (Web3).',
      },
      student: {
        title: 'Depósito Inmutable de Propiedad Intelectual',
        desc: 'Como alumno regular del conservatorio, podés registrar tus composiciones (hashes de IPFS). El contrato CompositionRegistry.sol ejecuta una consulta cross-contract al núcleo académico para verificar tu regularidad y eximirte del fee institucional.',
      },
      validator: {
        title: 'Verificador Internacional de Credenciales',
        desc: 'Sin intermediarios, demorados trámites de legalización ni burocracia. Cualquier universidad del mundo puede auditar el analítico académico inalterable y las obras intelectuales verificando los Soulbound Tokens (SBT).',
      },
      admin: {
        title: 'Consola de Contingencia Administrativa',
        desc: 'Módulo de recuperación de emergencia de tokens SBT. Permite solucionar la vulnerabilidad de pérdida de clave privada mediante un esquema de quemado y reemisión institucional, garantizando la continuidad del historial.',
      },
    }

    const info = descriptions[currentRole as keyof typeof descriptions]
    return info
  }

  const contextInfo = renderContextInfo()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Context Info */}
          <div className="glass rounded-2xl p-6 border border-slate-850 relative overflow-hidden">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1 block">
              Contexto Operacional
            </span>
            <h2 className="text-xl font-extrabold text-slate-100 mb-2">{contextInfo?.title}</h2>
            <p className="text-sm text-slate-400">{contextInfo?.desc}</p>
          </div>

          {/* Main Portal */}
          {renderPortal()}

          {/* Logs Console */}
          <LogsConsole />
        </div>

        {/* Right Column: Ledger */}
        <LedgerView />
      </main>
    </div>
  )
}

export default App
