import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Icons } from './Icons'

export const AdminPortal = () => {
  const [reissuedWallet, setReissuedWallet] = useState('')
  const { walletAddress, setWalletAddress, setSbtRevoked, isSbtRevoked, addLog } =
    useAppStore()

  const handleAdminReissue = (e: React.FormEvent) => {
    e.preventDefault()

    if (!reissuedWallet.startsWith('0x') || reissuedWallet.length < 15) {
      alert('Por favor introduce una dirección hexadecimal válida')
      return
    }

    addLog(`ADMIN ACTION - Emergency SBT revocation triggered for old wallet: ${walletAddress.substring(0, 10)}...`)
    addLog(`KMS Signer - Dispatching burn() for SBT #9921 on token contract...`)

    setSbtRevoked(true)
    setWalletAddress(reissuedWallet)

    addLog(
      `KMS Signer - Dispatching mint() of reissued SBT to: ${reissuedWallet.substring(0, 10)}...`
    )
    alert('🚨 SBT Revocado y Reemitido. Historial migrado a nueva wallet.')
    setReissuedWallet('')
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-850 shadow-xl space-y-6">
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
  )
}
