import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveEvent, toggleSeasonPass } from '../api/events';
import {
  getAbonados,
  createAbonado,
  getAbonadoQrBlob,
  deactivateAbonado,
} from '../api/abonados';
import { getAbonoTypes, createAbonoType, deactivateAbonoType } from '../api/abonoTypes';
import type { AbonadoEntry, AbonoType } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── QR Modal (for the list) ──────────────────────────────────────────────────
function QrModal({
  abonadoId,
  holderName,
  onClose,
}: {
  abonadoId: number;
  holderName: string;
  onClose: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    let url: string | null = null;
    getAbonadoQrBlob(abonadoId).then((blob) => {
      url = URL.createObjectURL(blob);
      setQrUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [abonadoId]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-2xl p-0 border-0 bg-transparent backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-4 w-80 shadow-2xl">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-white font-bold text-base">QR — {holderName}</h3>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {qrUrl ? (
          <div className="p-3 bg-white rounded-xl shadow-lg">
            <img src={qrUrl} alt={`QR de ${holderName}`} className="w-52 h-52 object-contain" />
          </div>
        ) : (
          <div className="w-60 h-60 flex items-center justify-center">
            <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
          </div>
        )}
        <button
          onClick={() => dialogRef.current?.close()}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
        >
          Cerrar
        </button>
      </div>
    </dialog>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-violet-400">{icon}</span>
          <span className="text-white font-bold text-base">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AbonadosPage() {
  const queryClient = useQueryClient();

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Modals & Forms
  const [qrModal, setQrModal] = useState<{ abonadoId: number; holderName: string } | null>(null);
  
  // Abono Type form
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');

  // Create abonado form
  const [abName, setAbName] = useState('');
  const [abEmail, setAbEmail] = useState('');
  const [abTypeId, setAbTypeId] = useState<string>('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Newly registered abonado for the success card
  const [newAbonado, setNewAbonado] = useState<AbonadoEntry | null>(null);
  const [newAbonadoQrUrl, setNewAbonadoQrUrl] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: activeEvent, isLoading: loadingEvent } = useQuery({
    queryKey: ['activeEvent'],
    queryFn: getActiveEvent,
    staleTime: 30000,
    retry: (count, err: unknown) => (err as { response?: { status?: number } })?.response?.status === 404 ? false : count < 1,
  });

  const { data: abonoTypes = [], isLoading: loadingTypes } = useQuery<AbonoType[]>({
    queryKey: ['abonoTypes'],
    queryFn: getAbonoTypes,
  });

  const {
    data: abonados = [],
    isLoading: loadingAbonados,
  } = useQuery<AbonadoEntry[]>({
    queryKey: ['abonados'],
    queryFn: getAbonados,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const togglePassMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => toggleSeasonPass(id, enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
      showToast(
        data.seasonPassEnabled ? 'Abonos activados para el evento activo' : 'Abonos desactivados',
        'success'
      );
    },
    onError: () => showToast('Error al cambiar el estado', 'error'),
  });

  const createTypeMutation = useMutation({
    mutationFn: ({ name, price }: { name: string; price: number }) => createAbonoType(name, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abonoTypes'] });
      showToast('Tipo de abono creado', 'success');
      setNewTypeName('');
      setNewTypePrice('');
    },
    onError: (err: unknown) => {
      showToast((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear tipo', 'error');
    },
  });

  const deactivateTypeMutation = useMutation({
    mutationFn: deactivateAbonoType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abonoTypes'] });
      showToast('Tipo de abono desactivado', 'success');
    },
    onError: () => showToast('Error al desactivar tipo', 'error'),
  });

  const registerMutation = useMutation({
    mutationFn: createAbonado,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['abonados'] });
      setNewAbonado(data);
      showToast(`Abonado nº${data.numero} registrado`, 'success');
      
      // Preload QR for the canvas
      const blob = await getAbonadoQrBlob(data.id);
      const url = URL.createObjectURL(blob);
      setNewAbonadoQrUrl(url);
    },
    onError: (err: unknown) => {
      showToast((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al registrar abonado', 'error');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAbonado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abonados'] });
      showToast(`Abonado anulado correctamente`, 'success');
    },
    onError: () => showToast('Error al anular abonado', 'error'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypePrice) {
      showToast('Nombre y precio requeridos', 'error');
      return;
    }
    createTypeMutation.mutate({ name: newTypeName, price: Number(newTypePrice) });
  };

  const handleDeactivateType = (id: number, name: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar el tipo de abono "${name}"?`)) {
      deactivateTypeMutation.mutate(id);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abName.trim() || !abEmail.trim() || !abTypeId) {
      showToast('Rellena todos los campos', 'error'); return;
    }
    registerMutation.mutate({
      holderName: abName.trim(),
      holderEmail: abEmail.trim(),
      abonoTypeId: Number(abTypeId)
    });
  };

  const handleDeactivate = (ab: AbonadoEntry) => {
    if (!window.confirm(`¿Anular el abonado nº${ab.numero} (${ab.holderName})?`)) return;
    deactivateMutation.mutate(ab.id);
  };

  const resetForm = () => {
    setNewAbonado(null);
    if (newAbonadoQrUrl) URL.revokeObjectURL(newAbonadoQrUrl);
    setNewAbonadoQrUrl(null);
    setAbName('');
    setAbEmail('');
    setAbTypeId('');
  };

  const downloadCarnet = () => {
    if (!newAbonado || !newAbonadoQrUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    // 1. Fondo oscuro
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde interno sutil
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 2. Header
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(10, 10, canvas.width - 20, 120);

    ctx.fillStyle = '#8b5cf6'; // violet-500
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ABONADO Nº${newAbonado.numero}`, canvas.width / 2, 70);

    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('PASE DE TEMPORADA', canvas.width / 2, 105);

    // 3. Info del usuario
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(newAbonado.holderName, canvas.width / 2, 190);
    
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.font = '22px Inter, sans-serif';
    ctx.fillText(`Tipo: ${newAbonado.abonoTypeName} (${newAbonado.abonoTypePrice}€)`, canvas.width / 2, 230);
    
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText(newAbonado.holderEmail, canvas.width / 2, 270);

    // 4. Dibujar QR
    const img = new Image();
    img.src = newAbonadoQrUrl;
    img.onload = () => {
      // Dibujar caja blanca para que el QR (con fondo transparente/negro) se vea bien
      const qrSize = 350;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 320;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 15);
      ctx.fill();

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // 5. Footer
      ctx.fillStyle = '#475569'; // slate-600
      ctx.font = '16px monospace';
      ctx.fillText(`ID: ${newAbonado.qrCode.slice(0, 8).toUpperCase()}`, canvas.width / 2, 710);

      ctx.fillStyle = '#334155'; // slate-700
      ctx.fillRect(10, canvas.height - 70, canvas.width - 20, 60);

      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText('Access Manager', canvas.width / 2, canvas.height - 35);

      // Export
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `carnet-abonado-${newAbonado.numero}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
    };
  };

  // Filtered abonados
  const filteredAbonados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return abonados;
    return abonados.filter(
      (a) => a.holderName.toLowerCase().includes(q) || a.holderEmail.toLowerCase().includes(q)
    );
  }, [abonados, searchQuery]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <QrModal
          abonadoId={qrModal.abonadoId}
          holderName={qrModal.holderName}
          onClose={() => setQrModal(null)}
        />
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white">Abonados</h1>
            <span className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-semibold text-sm">
              {abonados.length} abonados
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Gestión global de titulares de abonos</p>
        </div>

        {/* Badge & Toggle (only if there's an active event) */}
        {!loadingEvent && activeEvent && (
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evento activo</span>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${activeEvent.seasonPassEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeEvent.seasonPassEnabled ? 'Abonos activos' : 'Abonos desactivados'}
                <span className={`w-2 h-2 rounded-full ${activeEvent.seasonPassEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700 mx-2" />
            <button
              onClick={() => togglePassMutation.mutate({ id: activeEvent.id, enabled: !activeEvent.seasonPassEnabled })}
              disabled={togglePassMutation.isPending}
              className="text-xs font-bold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all disabled:opacity-50"
            >
              Toggle
            </button>
          </div>
        )}
      </div>

      {/* ── SECCIÓN: Tipos de abono ───────────────────────────────────────── */}
      <CollapsibleSection
        title="Tipos de abono"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {loadingTypes ? (
              <div className="animate-pulse flex gap-2">
                <div className="h-8 w-24 bg-slate-800 rounded-full" />
                <div className="h-8 w-32 bg-slate-800 rounded-full" />
              </div>
            ) : abonoTypes.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay tipos de abono creados.</p>
            ) : (
              abonoTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm"
                >
                  <span className="text-slate-200 font-semibold">{type.name}</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-emerald-400 font-bold">{type.price}€</span>
                  <button
                    onClick={() => handleDeactivateType(type.id, type.name)}
                    className="ml-1 text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
                    title="Desactivar tipo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleCreateType} className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del tipo</label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ej: General, Infantil..."
                className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-32">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precio €</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newTypePrice}
                onChange={(e) => setNewTypePrice(e.target.value)}
                placeholder="0.00"
                className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={createTypeMutation.isPending}
              className="px-4 py-2 h-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Añadir tipo
            </button>
          </form>
        </div>
      </CollapsibleSection>

      {/* ── SECCIÓN: Registrar nuevo abonado ─────────────────────────────────── */}
      <CollapsibleSection
        title="Registrar nuevo abonado"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        }
        defaultOpen={true}
      >
        {newAbonado ? (
          <div className="glass p-6 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row items-center gap-6 animate-fade-in bg-slate-900/40">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Abonado nº{newAbonado.numero} registrado con éxito
              </div>
              <p className="text-slate-300">
                <span className="font-semibold text-white">{newAbonado.holderName}</span> ({newAbonado.holderEmail})
              </p>
              <p className="text-sm text-slate-400">
                Tipo: <span className="text-emerald-400">{newAbonado.abonoTypeName} ({newAbonado.abonoTypePrice}€)</span>
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={downloadCarnet}
                  disabled={!newAbonadoQrUrl}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar carnet
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
                >
                  Registrar otro
                </button>
              </div>
            </div>
            <div className="shrink-0 p-3 bg-white rounded-xl shadow-lg">
              {newAbonadoQrUrl ? (
                <img src={newAbonadoQrUrl} alt="QR" className="w-32 h-32 object-contain" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center">
                  <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        ) : abonoTypes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-rose-400 font-semibold mb-2">No hay tipos de abono disponibles.</p>
            <p className="text-slate-400 text-sm">Crea primero un tipo de abono en la sección de arriba.</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de abono *</label>
              <select
                value={abTypeId}
                onChange={(e) => setAbTypeId(e.target.value)}
                className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all appearance-none"
                required
              >
                <option value="" disabled>Selecciona un tipo...</option>
                {abonoTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.price}€</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre completo *</label>
              <input
                type="text"
                value={abName}
                onChange={(e) => setAbName(e.target.value)}
                placeholder="Ej: Laura Martínez"
                className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email *</label>
              <input
                type="email"
                value={abEmail}
                onChange={(e) => setAbEmail(e.target.value)}
                placeholder="Ej: laura@ejemplo.com"
                className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500 italic">El número de abonado se asignará automáticamente.</span>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Registrando...' : 'Registrar abonado'}
              </button>
            </div>
          </form>
        )}
      </CollapsibleSection>

      {/* ── SECCIÓN: Lista de abonados ───────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-white font-bold text-base">Directorio de Abonados</h2>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>

        {loadingAbonados ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
          </div>
        ) : filteredAbonados.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No se encontraron abonados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-4 w-20">Nº</th>
                  <th className="px-5 py-4">Nombre</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Fecha alta</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAbonados.map((ab) => (
                  <tr key={ab.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold font-mono">
                        {ab.numero}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white truncate max-w-[180px]">
                      {ab.holderName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 truncate max-w-[200px]">
                      {ab.holderEmail}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{ab.abonoTypeName}</span>
                        <span className="text-xs text-emerald-400 font-bold">{ab.abonoTypePrice}€</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {fmtDate(ab.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {ab.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Anulado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setQrModal({ abonadoId: ab.id, holderName: ab.holderName })}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all tooltip-trigger"
                          title="Ver QR"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>
                        {ab.active && (
                          <button
                            onClick={() => handleDeactivate(ab)}
                            disabled={deactivateMutation.isPending}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all disabled:opacity-50"
                            title="Anular Abonado"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
