import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

export const LedgerView = () => {
  const { transactions, clearHistory, walletAddress } = useAppStore()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <Icons.HardDrive /> Ledger Descentralizado
        </h3>
        <button
          onClick={clearHistory}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Limpiar Transacciones
        </button>
      </div>

      <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
        {transactions.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-6 text-center text-xs text-slate-500">
            No hay transacciones registradas en este bloque de simulación local.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                tx.status === 'CONFIRMED'
                  ? 'bg-slate-900/90 border-slate-850 hover:border-slate-800'
                  : 'bg-indigo-950/20 border-indigo-500/40 animate-pulse'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    tx.type === 'Carga de Nota'
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : tx.type === 'Registro IP'
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {tx.type}
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  {tx.status === 'CONFIRMED' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px]">
                      <Icons.CheckCircle /> Bloque #{tx.block}
                    </span>
                  ) : (
                    <span className="text-indigo-400 flex items-center gap-1 font-semibold text-[10px] animate-pulse">
                      <Icons.Clock /> Procesando...
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-200 mb-1">{tx.detail}</p>
              <p className="text-[10px] text-slate-500 font-mono mb-2">
                Wallet: {walletAddress.substring(0, 16)}...
              </p>

              <div className="pt-2 border-t border-slate-850/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>EVM Hash:</span>
                <span className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-[10px]">
                  {tx.txHash}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
