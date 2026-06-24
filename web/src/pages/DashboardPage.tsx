import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getActiveEvent, getEventStats } from '../api/events';
import type { Event, EventStats } from '../types';
import StatsBanner from '../components/features/access/StatsBanner';

export default function DashboardPage() {
  // 1. Fetch active event with staleTime 30000ms
  const {
    data: activeEvent,
    isLoading: isLoadingEvent,
    error: eventError,
    refetch: refetchActiveEvent,
  } = useQuery<Event>({
    queryKey: ['activeEvent'],
    queryFn: getActiveEvent,
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      // Do not retry on 404 since it means there's no active event in the system
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const isNoActiveEvent = (eventError as any)?.response?.status === 404;

  // 2. Fetch stats for the active event (enabled only when we have an event ID)
  const {
    data: stats,
    refetch: refetchStats,
  } = useQuery<EventStats>({
    queryKey: ['eventStats', activeEvent?.id],
    queryFn: () => getEventStats(activeEvent!.id),
    enabled: !!activeEvent?.id,
  });

  // 3. Auto-refresh stats every 10000ms (10s) with cleanup
  useEffect(() => {
    if (!activeEvent?.id) return;

    const intervalId = setInterval(() => {
      refetchStats();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeEvent?.id, refetchStats]);

  // Loading state: Spinner
  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
      </div>
    );
  }

  // Graceful no active event state
  if (isNoActiveEvent || !activeEvent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-slate-800 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-300 text-base leading-relaxed">
            No hay evento activo. Ve a <Link to="/events" className="text-violet-400 hover:text-violet-300 font-bold underline transition-colors">Eventos</Link> para activar uno.
          </p>
        </div>
      </div>
    );
  }

  // Hard error state (e.g. backend down or auth expired)
  if (eventError) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 glass rounded-2xl border border-rose-500/20 text-rose-400 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-bold text-lg">Error al conectar con el servidor</h2>
        </div>
        <p className="text-sm text-slate-400">
          {(eventError as any)?.response?.data?.error || (eventError as Error).message || 'Error de red o conexión rechazada.'}
        </p>
        <button
          onClick={() => refetchActiveEvent()}
          className="mt-4 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 transition-all duration-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Event Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Estadísticas en tiempo real del evento en curso</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{activeEvent.name}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              ACTIVO
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-6 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(activeEvent.date).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{activeEvent.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <StatsBanner stats={stats} loading={!stats} />

    </div>
  );
}
