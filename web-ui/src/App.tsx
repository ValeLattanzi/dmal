import { useEffect } from "react";
import "./App.css";
import { AdminPortal } from "./components/AdminPortal";
import { Header } from "./components/Header";
import { LedgerView } from "./components/LedgerView";
import { LogsConsole } from "./components/LogsConsole";
import { ProfessorPortal } from "./components/ProfessorPortal";
import { StudentPortal } from "./components/StudentPortal";
import { ValidatorPortal } from "./components/ValidatorPortal";
import { useAppStore } from "./store/appStore";

const CONTEXT_DESCRIPTIONS = {
  professor: {
    title: "Firma Criptográfica de Notas Académicas",
    desc: "Como docente, tenés la firma delegada en tu clave privada. Cada nota se empaqueta en una estructura optimizada de 9 bytes (Storage Packing) para ahorrar gas. El backend responde inmediatamente (Web2) y sincroniza con el evento EVM (Web3).",
  },
  student: {
    title: "Depósito Inmutable de Propiedad Intelectual",
    desc: "Como alumno regular del conservatorio, podés registrar tus composiciones (hashes de IPFS). El contrato CompositionRegistry.sol ejecuta una consulta cross-contract al núcleo académico para verificar tu regularidad y eximirte del fee institucional.",
  },
  validator: {
    title: "Verificador Internacional de Credenciales",
    desc: "Sin intermediarios, demorados trámites de legalización ni burocracia. Cualquier universidad del mundo puede auditar el analítico académico inalterable y las obras intelectuales verificando los Soulbound Tokens (SBT).",
  },
  admin: {
    title: "Consola de Contingencia Administrativa",
    desc: "Módulo de recuperación de emergencia de tokens SBT. Permite solucionar la vulnerabilidad de pérdida de clave privada mediante un esquema de quemado y reemisión institucional, garantizando la continuidad del historial.",
  },
};

function Toast() {
  const { toast } = useAppStore();
  if (!toast) return null;

  const colorMap = {
    success: "bg-indigo-950/90 border-indigo-500/50 text-indigo-300",
    confirmed: "bg-emerald-950/90 border-emerald-500/50 text-emerald-300",
    error: "bg-red-950/90 border-red-500/50 text-red-300",
    info: "bg-slate-900/90 border-slate-700 text-slate-300",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div
        className={`px-6 py-4 rounded-xl border shadow-2xl flex items-center gap-3 text-sm font-semibold ${colorMap[toast.type]}`}
      >
        <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

function App() {
  const { currentRole, setBlockHeight, blockHeight, addLog } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(blockHeight + 1);
      addLog(
        `[INFO] EVM Node - New block mined: #${blockHeight + 1} (Gas limit verified, transactions packing)`
      );
    }, 12000);
    return () => clearInterval(interval);
  }, [blockHeight, setBlockHeight, addLog]);

  const renderPortal = () => {
    switch (currentRole) {
      case "professor": return <ProfessorPortal />;
      case "student":   return <StudentPortal />;
      case "validator": return <ValidatorPortal />;
      case "admin":     return <AdminPortal />;
      default:          return null;
    }
  };

  const contextInfo = CONTEXT_DESCRIPTIONS[currentRole];

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100">
      <Toast />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Operational Context */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1 block">
              Contexto Operacional
            </span>
            <h2 className="text-xl font-extrabold text-slate-100 mb-2">
              {contextInfo.title}
            </h2>
            <p className="text-sm text-slate-400">{contextInfo.desc}</p>
          </div>

          {renderPortal()}
          <LogsConsole />
        </div>

        {/* Right Column: Ledger */}
        <LedgerView />
      </main>
    </div>
  );
}

export default App;
