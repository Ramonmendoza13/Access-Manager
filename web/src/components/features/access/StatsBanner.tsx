import type { AccessStats } from '../../../types';

interface StatsBannerProps {
  stats: AccessStats | undefined;
  loading: boolean;
}

export default function StatsBanner({ stats, loading }: StatsBannerProps) {
  const formatNumber = (val: number | undefined) => {
    if (val === undefined) return '—';
    return val.toLocaleString('es-ES');
  };

  const cards = [
    { label: 'Total Vendidas', value: stats?.totalTickets },
    { label: 'Escaneadas', value: stats?.scanned },
    { label: 'Disponibles', value: stats?.remaining },
    { label: 'Abonos hoy', value: stats?.seasonPassesScannedToday },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[110px]"
        >
          <span className="text-sm text-gray-500 font-medium">{card.label}</span>
          {loading ? (
            <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md mt-2" />
          ) : (
            <span className="text-3xl font-bold text-slate-900 mt-2">
              {formatNumber(card.value)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
