import { useConnectivity } from '@/hooks/useConnectivity';

export default function ConnectivityBanner() {
  const { online, pendingCount, syncing } = useConnectivity();
  if (online && !pendingCount && !syncing) return null;
  return (
    <div className={`fixed top-0 inset-x-0 z-[10000] px-4 py-2 text-center text-xs font-bold shadow-lg ${online ? 'bg-amber-400 text-amber-950' : 'bg-red-600 text-white'}`} role="status" aria-live="polite">
      {!online ? `Sin internet${pendingCount ? ` · ${pendingCount} pedido(s) por sincronizar` : ''}` : syncing ? 'Sincronizando pedidos pendientes…' : `${pendingCount} pedido(s) pendiente(s) de sincronizacion`}
    </div>
  );
}
