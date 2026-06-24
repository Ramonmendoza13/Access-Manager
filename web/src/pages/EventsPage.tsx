import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, activateEvent, createEvent, toggleSeasonPass } from '../api/events';
import { getTicketTypesByEvent, createTicketType } from '../api/tickets';
import type { Event, TicketType } from '../types';

// ─── Ticket Type Row Input ────────────────────────────────────────────────────
interface TicketTypeInput {
  name: string;
  price: string;
  quota: string;
}

// ─── Sub-component: Event Ticket Type Badges ─────────────────────────────────
function EventTicketTypesBadges({ eventId }: { eventId: number }) {
  const { data: ticketTypes = [], isLoading, isError } = useQuery<TicketType[]>({
    queryKey: ['ticketTypes', eventId],
    queryFn: () => getTicketTypesByEvent(eventId),
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-1">
        {[1, 2].map((i) => (
          <span key={i} className="inline-block h-5 w-16 rounded bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <span className="text-xs text-rose-400/70">Error</span>;
  }

  if (ticketTypes.length === 0) {
    return <span className="text-xs text-slate-600 italic">Sin tipos</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ticketTypes.map((tt) => (
        <span
          key={tt.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-900/30 border border-violet-700/30 text-violet-300"
        >
          <span>{tt.name}</span>
          <span className="text-violet-400 font-bold">{Number(tt.price).toFixed(0)}€</span>
        </span>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { data: events = [], isLoading, error, refetch } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  const activateMutation = useMutation({
    mutationFn: activateEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
      showToast(`Evento "${data.name}" activado correctamente`, 'success');
    },
    onError: (err: unknown) => {
      const errMsg = (err as any)?.response?.data?.error || (err as Error).message || 'Error al activar el evento';
      showToast(errMsg, 'error');
    },
  });

  const seasonPassMutation = useMutation({
    mutationFn: ({ eventId, enabled }: { eventId: number; enabled: boolean }) =>
      toggleSeasonPass(eventId, enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
      showToast(
        `Abonos ${data.seasonPassEnabled ? 'habilitados' : 'deshabilitados'} para "${data.name}"`,
        'success'
      );
    },
    onError: (err: unknown) => {
      const errMsg = (err as any)?.response?.data?.error || (err as Error).message || 'Error al cambiar estado de abonos';
      showToast(errMsg, 'error');
    },
  });

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  const [ticketTypeRows, setTicketTypeRows] = useState<TicketTypeInput[]>([
    { name: '', price: '', quota: '' },
  ]);

  const resetForm = () => {
    setName('');
    setDate('');
    setVenue('');
    setCapacity('');
    setTicketTypeRows([{ name: '', price: '', quota: '' }]);
  };

  const closeForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const addRow = () => setTicketTypeRows((prev) => [...prev, { name: '', price: '', quota: '' }]);

  const removeRow = (index: number) =>
    setTicketTypeRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, field: keyof TicketTypeInput, value: string) =>
    setTicketTypeRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !date || !venue.trim() || capacity === '') {
      showToast('Por favor, completa todos los campos del evento', 'error');
      return;
    }
    const capVal = Number(capacity);
    if (isNaN(capVal) || capVal <= 0) {
      showToast('El aforo debe ser un número positivo', 'error');
      return;
    }
    if (new Date(date) <= new Date()) {
      showToast('La fecha del evento debe ser en el futuro', 'error');
      return;
    }

    for (let i = 0; i < ticketTypeRows.length; i++) {
      const row = ticketTypeRows[i];
      if (!row.name.trim() || row.price === '' || row.quota === '') {
        showToast(`Completa todos los campos del tipo de entrada ${i + 1}`, 'error');
        return;
      }
      const priceVal = parseFloat(row.price);
      const quotaVal = parseInt(row.quota, 10);
      if (isNaN(priceVal) || priceVal < 0) {
        showToast(`El precio del tipo "${row.name || i + 1}" debe ser un número válido (≥ 0)`, 'error');
        return;
      }
      if (isNaN(quotaVal) || quotaVal <= 0) {
        showToast(`La cuota del tipo "${row.name || i + 1}" debe ser un entero positivo`, 'error');
        return;
      }
    }

    setIsCreating(true);
    try {
      const newEvent = await createEvent({
        name: name.trim(),
        date: date + ':00',
        venue: venue.trim(),
        capacity: capVal,
      });

      for (const row of ticketTypeRows) {
        try {
          await createTicketType(newEvent.id, {
            name: row.name.trim(),
            price: parseFloat(row.price),
            isSeasonPass: false,
            quota: parseInt(row.quota, 10),
          });
        } catch (ttErr: unknown) {
          const ttErrMsg = (ttErr as any)?.response?.data?.error || (ttErr as Error).message || 'Error desconocido';
          showToast(`Error al crear el tipo "${row.name}": ${ttErrMsg}`, 'error');
          queryClient.invalidateQueries({ queryKey: ['events'] });
          setIsCreating(false);
          return;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['events'] });
      showToast(`Evento "${newEvent.name}" creado con ${ticketTypeRows.length} tipo(s) de entrada`, 'success');
      closeForm();
    } catch (err: unknown) {
      const errMsg = (err as any)?.response?.data?.error || (err as Error).message || 'Error al crear el evento';
      showToast(errMsg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 relative">

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Events</h1>
          <p className="text-slate-400 text-sm mt-1">Gestión de espectáculos y habilitación de accesos</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-600/20"
          >
            + Nuevo Evento
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateSubmit} className="glass p-6 rounded-2xl border border-slate-800 flex flex-col gap-6 shadow-xl">
          <h3 className="text-lg font-bold text-white">Nuevo Evento</h3>

          {/* PARTE A */}
          <div>
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">A — Datos del evento</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Nombre del Evento *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Concierto Rock Festival" className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Fecha y Hora *</label>
                <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Lugar / Venue *</label>
                <input type="text" required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ej: Estadio Nacional" className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Aforo Máximo *</label>
                <input type="number" required min="1" value={capacity} onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Ej: 5000" className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all" />
              </div>
            </div>
          </div>

          {/* PARTE B */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">B — Tipos de entrada</p>
              <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-400 border border-violet-600/30 bg-violet-600/10 hover:bg-violet-600/20 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Añadir tipo
              </button>
            </div>
            <div className="grid grid-cols-[1fr_120px_100px_36px] gap-2 mb-1.5 px-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Nombre del tipo</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Precio €</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Cuota</span>
              <span />
            </div>
            <div className="flex flex-col gap-2">
              {ticketTypeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_120px_100px_36px] gap-2 items-center">
                  <input type="text" value={row.name} onChange={(e) => updateRow(index, 'name', e.target.value)} placeholder="Ej: VIP, General..." className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
                  <input type="number" value={row.price} min="0" step="0.01" onChange={(e) => updateRow(index, 'price', e.target.value)} placeholder="0.00" className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
                  <input type="number" value={row.quota} min="1" step="1" onChange={(e) => updateRow(index, 'quota', e.target.value)} placeholder="100" className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
                  <button type="button" onClick={() => removeRow(index)} disabled={ticketTypeRows.length <= 1} title="Eliminar fila" className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2 pl-1">
              {ticketTypeRows.length} tipo{ticketTypeRows.length !== 1 ? 's' : ''} de entrada definido{ticketTypeRows.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
            <button type="button" onClick={closeForm} disabled={isCreating} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isCreating} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-600/10 disabled:opacity-50">
              {isCreating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear evento'
              )}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-6 glass rounded-2xl border border-rose-500/20 text-rose-400">
          <p className="font-semibold">Error al cargar la lista de eventos</p>
          <p className="text-sm mt-1">{(error as any)?.response?.data?.error || (error as Error).message || 'Error de conexión'}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 transition-all">Reintentar</button>
        </div>
      ) : events.length === 0 ? (
        <div className="glass p-8 rounded-2xl border border-slate-800 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No hay eventos para mostrar</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Crea tu primer evento haciendo clic en "Nuevo Evento" arriba a la derecha.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Aforo</th>
                  <th className="px-6 py-4">Tipos</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Abonos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white truncate max-w-[160px]">{event.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(event.date).toLocaleDateString('es-ES')}</td>
                    <td className="px-6 py-4 truncate max-w-[130px]">{event.venue}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.capacity.toLocaleString('es-ES')}</td>
                    <td className="px-6 py-4 max-w-[220px]">
                      <EventTicketTypesBadges eventId={event.id} />
                    </td>
                    <td className="px-6 py-4">
                      {event.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">ACTIVO</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-500">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {event.active ? (
                        <label className={`relative inline-flex items-center cursor-pointer ${seasonPassMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`} title="Activar para que los abonos sean válidos en este evento">
                          <input type="checkbox" checked={event.seasonPassEnabled} disabled={seasonPassMutation.isPending} onChange={() => seasonPassMutation.mutate({ eventId: event.id, enabled: !event.seasonPassEnabled })} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
                        </label>
                      ) : (
                        <span className="text-slate-600" title="Solo disponible en eventos activos">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!event.active ? (
                        <button onClick={() => activateMutation.mutate(event.id)} disabled={activateMutation.isPending} className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 disabled:opacity-50">
                          {activateMutation.isPending && activateMutation.variables === event.id ? 'Activando...' : 'Activar'}
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold text-xs flex items-center justify-end gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                          Activo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
