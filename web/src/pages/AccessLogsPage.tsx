import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getActiveEvent, getEventStats } from '../api/events';
import { getLogs } from '../api/access';
import StatsBanner from '../components/features/access/StatsBanner';
import type { Event, EventStats, AccessLog, SpringPage } from '../types';

export default function AccessLogsPage() {
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
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const isNoActiveEvent = (eventError as any)?.response?.status === 404;

  // 2. Fetch stats for the active event (enabled only when we have an event ID)
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery<EventStats>({
    queryKey: ['eventStats', activeEvent?.id],
    queryFn: () => getEventStats(activeEvent!.id),
    enabled: !!activeEvent?.id,
  });

  // 3. Manual state for paginated logs
  const [logsData, setLogsData] = useState<SpringPage<AccessLog> | null>(null);
  const [page, setPage] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const lastIdRef = useRef<number | null>(null);

  // 4. Fetch logs whenever page or event ID changes
  useEffect(() => {
    if (!activeEvent?.id) return;

    let isMounted = true;
    setLoadingLogs(true);

    getLogs(activeEvent.id, page, 20)
      .then((data) => {
        if (isMounted) {
          setLogsData(data);
          setLastUpdated(new Date().toLocaleTimeString('es-ES'));
          if (page === 0 && data.content.length > 0) {
            lastIdRef.current = data.content[0].id;
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching logs:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingLogs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeEvent?.id, page]);

  // 5. Auto-refresh logs every 5 seconds
  useEffect(() => {
    if (!activeEvent?.id) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await getLogs(activeEvent.id, 0, 20);
        if (data.content.length > 0) {
          const firstLogId = data.content[0].id;

          if (firstLogId !== lastIdRef.current) {
            lastIdRef.current = firstLogId;

            // If we are on page 0, update with the newly fetched first page data.
            // If on another page, refetch the current page to refresh the items.
            if (page === 0) {
              setLogsData(data);
            } else {
              const currentPageData = await getLogs(activeEvent.id, page, 20);
              setLogsData(currentPageData);
            }

            setLastUpdated(new Date().toLocaleTimeString('es-ES'));
            refetchStats();
          }
        }
      } catch (err) {
        console.error('Error auto-refreshing logs:', err);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeEvent?.id, page, refetchStats]);

  // Loading state: Spinner
  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
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

  const formatLogTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const tIndex = dateStr.indexOf('T');
        if (tIndex !== -1) {
          return dateStr.substring(tIndex + 1, tIndex + 9);
        }
        return dateStr;
      }
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const hasLogs = logsData && logsData.content.length > 0;
  const showPagination = logsData && logsData.totalPages > 1;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Logs de Acceso</h1>
          <p className="text-slate-400 text-sm mt-1">
            Validación de entradas y registro de escaneos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge pulsante EN VIVO */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            EN VIVO
          </span>

          {/* Contador */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {stats !== undefined
              ? `${stats.scanned.toLocaleString('es-ES')} accesos registrados`
              : '— accesos registrados'}
          </span>

          {/* Última actualización */}
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-medium">
              Última actualización: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* ACTIVE EVENT INFO */}
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
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(activeEvent.date).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{activeEvent.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BANNER */}
      <StatsBanner stats={stats} loading={isLoadingStats} />

      {/* TABLE */}
      {loadingLogs && !logsData ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin border-4 border-violet-500 rounded-full h-8 w-8 border-t-transparent" />
        </div>
      ) : !hasLogs ? (
        <div className="glass p-8 rounded-2xl border border-slate-800 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No hay registros de acceso</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
            Los escaneos de entradas aparecerán aquí en tiempo real a medida que ingresen los asistentes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl relative">
            {loadingLogs && (
              <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="animate-spin border-2 border-violet-500 rounded-full h-6 w-6 border-t-transparent" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-300">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Hora</th>
                    <th className="px-6 py-4">Nombre titular</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Dispositivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {logsData!.content.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {formatLogTime(log.scannedAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white truncate max-w-[180px]">
                        {log.holderName}
                      </td>
                      <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]">
                        {log.holderEmail}
                      </td>
                      <td className="px-6 py-4">
                        {log.isSeasonPass ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider">
                            ABONO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 uppercase tracking-wider">
                            ENTRADA
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 truncate max-w-[150px]">
                        {log.deviceId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {showPagination && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-4 px-2">
              <span className="text-xs text-slate-500">
                Página {logsData!.number + 1} de {logsData!.totalPages} ({logsData!.totalElements} registros)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={logsData!.first || loadingLogs}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all disabled:opacity-40 disabled:hover:bg-slate-800 animate-transition"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logsData!.last || loadingLogs}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all disabled:opacity-40 disabled:hover:bg-slate-800 animate-transition"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
