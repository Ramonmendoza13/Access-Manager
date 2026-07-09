import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getActiveEvent } from '../api/events';
import { getTicketTypesByEvent, sellTicket, getTicketQrBlob } from '../api/tickets';
import { getProfile } from '../api/profile';
import { getTemplates } from '../api/ticketTemplates';
import type { TicketType, Ticket } from '../types';

// ─── Stepper component ────────────────────────────────────────────────────────
const STEPS = ['Tipo de entrada', 'Datos del comprador', 'Confirmación'];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < current;
        const isActive = stepNum === current;

        return (
          <div key={stepNum} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last) */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-20 md:w-32 h-0.5 mx-3 mb-5 transition-colors duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Formats "2025-07-15" → "Martes 15 de julio" */
function formatDateEs(dateStr: string): string {
  if (!dateStr) return '';
  // Parse as local date to avoid UTC-shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAYS_ES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTHS_ES[date.getMonth()];
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} de ${monthName}`;
}

/** Returns today's date as "yyyy-MM-dd" */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Canvas ticket helpers ─────────────────────────────────────────────────────
const drawRoundedRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
};

const wrapText = (
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = c.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      c.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  c.fillText(line, x, currentY);
};

function generateTicketCanvas(
  ticket: Ticket,
  qrBlobUrl: string,
  eventDate?: string,
  eventVenue?: string,
  bgUrl?: string | null,
  targetDate?: string | null   // SWIMMING_POOL: the valid day
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    // Taller canvas for SWIMMING_POOL to fit the date band
    canvas.height = targetDate ? 860 : 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context'));
      return;
    }

    const H = canvas.height;

    const drawAll = (qrImg: HTMLImageElement) => {
      // 1. Clip context to rounded card
      ctx.save();
      drawRoundedRect(ctx, 2, 2, 596, H - 4, 24);
      ctx.clip();

      // 2. White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, H);
      ctx.restore();

      // 2b. Optional background image
      ctx.save();
      drawRoundedRect(ctx, 2, 2, 596, H - 4, 24);
      ctx.clip();

      const finishDrawing = () => {
        // 3. Dark Header background — taller if SWIMMING_POOL
        const headerH = targetDate ? 200 : 160;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 600, headerH);

        // Header: event / pool name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        wrapText(ctx, ticket.eventName, 300, 50, 520, 34);

        // Header: date/venue line
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px sans-serif';
        const formattedDate = eventDate
          ? new Date(eventDate).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date(ticket.purchasedAt).toLocaleDateString('es-ES');
        const venueStr = eventVenue || 'Recinto';
        ctx.fillText(`${formattedDate}   |   ${venueStr}`, 300, 125);

        // SWIMMING_POOL: "VÁLIDO PARA" banner inside header
        if (targetDate) {
          const bandY = 145;
          const bandH = 42;
          // Cyan band
          ctx.fillStyle = '#0e7490';
          ctx.fillRect(0, bandY, 600, bandH);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 17px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`VÁLIDO PARA: ${formatDateEs(targetDate).toUpperCase()}`, 300, bandY + 27);
        }

        ctx.restore(); // Restore clip context

        // Card border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        drawRoundedRect(ctx, 2, 2, 596, H - 4, 24);
        ctx.stroke();

        // 4. QR Image centered below header
        const qrTop = targetDate ? 220 : 180;
        ctx.drawImage(qrImg, 100, qrTop, 400, 400);

        // 5. Lower Section details
        const detailTop = targetDate ? 650 : 610;
        ctx.textAlign = 'left';

        // Titular
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Titular: ', 100, detailTop);
        ctx.fillStyle = '#1e293b';
        ctx.font = '16px sans-serif';
        ctx.fillText(ticket.holderName, 100 + ctx.measureText('Titular: ').width, detailTop);

        // Email
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Email: ', 100, detailTop + 35);
        ctx.fillStyle = '#1e293b';
        ctx.font = '16px sans-serif';
        ctx.fillText(ticket.holderEmail, 100 + ctx.measureText('Email: ').width, detailTop + 35);

        // Tipo + Badge
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Tipo: ', 100, detailTop + 70);
        ctx.fillStyle = '#1e293b';
        ctx.font = '16px sans-serif';
        ctx.fillText(ticket.ticketTypeName, 100 + ctx.measureText('Tipo: ').width, detailTop + 70);

        const typeLabelWidth = ctx.measureText('Tipo: ').width;
        const typeValWidth = ctx.measureText(ticket.ticketTypeName).width;
        const badgeX = 100 + typeLabelWidth + typeValWidth + 12;
        const badgeY = detailTop + 52;
        const badgeText = ticket.isSeasonPass ? 'ABONO' : 'ENTRADA';
        ctx.font = 'bold 11px sans-serif';
        const badgeTextWidth = ctx.measureText(badgeText).width;
        const badgeWidth = badgeTextWidth + 16;
        const badgeHeight = 22;
        ctx.fillStyle = ticket.isSeasonPass ? '#dbeafe' : '#d1fae5';
        ctx.beginPath();
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 5);
        ctx.fill();
        ctx.fillStyle = ticket.isSeasonPass ? '#1e40af' : '#065f46';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 15);

        // Precio
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Precio: ', 100, detailTop + 105);
        ctx.fillStyle = '#1e293b';
        ctx.font = '16px sans-serif';
        const priceStr =
          ticket.price !== undefined && ticket.price !== null
            ? `${Number(ticket.price).toFixed(2)} €`
            : 'N/A';
        ctx.fillText(priceStr, 100 + ctx.measureText('Precio: ').width, detailTop + 105);

        // ID
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('ID: ', 100, detailTop + 140);
        ctx.fillStyle = '#64748b';
        ctx.font = '16px monospace';
        const idStr = (ticket.qrCode || '').slice(0, 8).toUpperCase();
        ctx.fillText(idStr, 100 + ctx.measureText('ID: ').width, detailTop + 140);

        // 6. Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Access Manager', 300, H - 20);

        resolve(canvas);
      };

      if (bgUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = bgUrl;
        bgImg.onload = () => {
          ctx.globalAlpha = 0.15;
          ctx.drawImage(bgImg, 0, 0, 600, H);
          ctx.globalAlpha = 1.0;
          finishDrawing();
        };
        bgImg.onerror = () => {
          finishDrawing();
        };
      } else {
        finishDrawing();
      }
    };

    const img = new Image();
    img.src = qrBlobUrl;
    img.onload = () => drawAll(img);
    img.onerror = (err) => reject(err);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SellTicketPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [soldTicket, setSoldTicket] = useState<Ticket | null>(null);
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [sellError, setSellError] = useState('');

  // SWIMMING_POOL: selected target date
  const [selectedDate, setSelectedDate] = useState('');
  const [dateError, setDateError] = useState('');

  // QR blob URL state
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);

  // Ticket canvas URL state
  const [ticketCanvasUrl, setTicketCanvasUrl] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  // Profile query — needed to detect SWIMMING_POOL mode
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 60000,
  });

  const isSwimmingPool = profile?.systemType === 'SWIMMING_POOL';

  const { data: activeEvent, isLoading: loadingEvent, error: eventError } = useQuery({
    queryKey: ['activeEvent'],
    queryFn: getActiveEvent,
    staleTime: 30000,
    // In SWIMMING_POOL mode there's no required active event, but we still try silently
    retry: (failureCount, error: unknown) => {
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const isNoActiveEvent = (eventError as any)?.response?.status === 404;

  const {
    data: ticketTypes = [],
    isLoading: loadingTypes,
  } = useQuery({
    queryKey: ['ticketTypes', activeEvent?.id],
    queryFn: () => getTicketTypesByEvent(activeEvent!.id),
    enabled: !!activeEvent?.id && !isSwimmingPool,
  });

  // SWIMMING_POOL: profile ticket-type templates as selectable options
  const { data: poolTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['ticketTemplates'],
    queryFn: getTemplates,
    enabled: isSwimmingPool,
    staleTime: 60000,
  });

  // Unified list for rendering — normalise TicketTypeTemplate into TicketType shape
  const displayedTypes: TicketType[] = isSwimmingPool
    ? poolTemplates.map((t) => ({ id: t.id, name: t.name, price: t.price, isSeasonPass: false, quota: 0 }))
    : ticketTypes;

  const loadingDisplayedTypes = isSwimmingPool ? loadingTemplates : loadingTypes;

  // ── QR fetch when step=3 ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !soldTicket) return;

    let objectUrl: string | null = null;

    getTicketQrBlob(soldTicket.id).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setQrBlobUrl(objectUrl);
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [step, soldTicket]);

  // ── Ticket Canvas generation when qrBlobUrl is ready ─────────────────────
  useEffect(() => {
    if (!qrBlobUrl || !soldTicket) {
      setTicketCanvasUrl(null);
      return;
    }

    let active = true;
    let canvasUrl: string | null = null;
    let bgObjectUrl: string | null = null;

    const run = async () => {
      const bgUrl: string | null = activeEvent?.entradaBackgroundUrl ?? null;

      if (!active) return;

      generateTicketCanvas(
        soldTicket,
        qrBlobUrl,
        activeEvent?.date,
        activeEvent?.venue,
        bgUrl,
        isSwimmingPool ? selectedDate : null
      )
        .then((canvas) => {
          if (!active) return;
          canvas.toBlob((blob) => {
            if (blob && active) {
              canvasUrl = URL.createObjectURL(blob);
              setTicketCanvasUrl(canvasUrl);
            }
          }, 'image/png');
        })
        .catch((err) => {
          console.error('Error generating ticket canvas:', err);
        });
    };

    run();

    return () => {
      active = false;
      if (canvasUrl) URL.revokeObjectURL(canvasUrl);
      if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    };
  }, [qrBlobUrl, soldTicket, activeEvent, isSwimmingPool, selectedDate]);

  // ── Sell mutation ──────────────────────────────────────────────────────────
  const { mutate: mutateSell, isPending: isSelling } = useMutation({
    mutationFn: sellTicket,
    onSuccess: (ticket) => {
      setSoldTicket(ticket);
      setStep(3);
      setSellError('');
    },
    onError: (err: unknown) => {
      const axiosErr = err as any;
      const status = axiosErr?.response?.status;
      const backendMsg: string = axiosErr?.response?.data?.error ?? '';

      if (status === 400 && backendMsg.toLowerCase().includes('quota')) {
        setSellError('No quedan entradas disponibles de este tipo');
      } else if (backendMsg) {
        setSellError(backendMsg);
      } else {
        setSellError('Error inesperado al procesar la venta. Inténtalo de nuevo.');
      }
    },
  });

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setSelectedType(null);
    setSoldTicket(null);
    setHolderName('');
    setHolderEmail('');
    setSellError('');
    setQrBlobUrl(null);
    setTicketCanvasUrl(null);
    setSelectedDate('');
    setDateError('');
  };

  // ── QR download ────────────────────────────────────────────────────────────
  const handleDownloadQr = () => {
    if (!ticketCanvasUrl || !soldTicket) return;
    const link = document.createElement('a');
    link.href = ticketCanvasUrl;
    link.download = `entrada-${soldTicket.holderName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  // ── Date validation (SWIMMING_POOL) ────────────────────────────────────────
  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    if (!value) { setDateError(''); return; }

    const today = todayStr();
    const start = profile?.seasonStartDate ?? '';
    const end = profile?.seasonEndDate ?? '';

    if (value < today) {
      setDateError('No puedes seleccionar una fecha pasada');
    } else if ((start && value < start) || (end && value > end)) {
      setDateError('Fecha fuera de temporada');
    } else {
      setDateError('');
    }
  };

  // ── Step 1 → 2: type card click ────────────────────────────────────────────
  const handleSelectType = (tt: TicketType) => {
    // SWIMMING_POOL: must have a valid date before advancing
    if (isSwimmingPool) {
      if (!selectedDate || dateError) return;
    }
    setSelectedType(tt);
    setStep(2);
  };

  // ── Step 2 submit ──────────────────────────────────────────────────────────
  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setSellError('');
    mutateSell({
      ticketTypeId: selectedType.id,
      holderName: holderName.trim(),
      holderEmail: holderEmail.trim(),
      targetDate: isSwimmingPool ? selectedDate : null,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-3xl font-extrabold text-white">Sell Ticket</h1>
        <p className="text-slate-400 text-sm mt-1">Punto de venta y emisión de entradas en tiempo real</p>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* ── STEP 1: Select ticket type ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">

          {/* Loading profile */}
          {loadingProfile && (
            <div className="flex justify-center py-12">
              <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
            </div>
          )}

          {/* No profile configured */}
          {!loadingProfile && !profile && (
            <div className="glass p-8 rounded-2xl border border-amber-500/20 text-center py-14">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-300 text-base">
                Configura el perfil del club primero.{' '}
                <Link to="/profile" className="text-violet-400 hover:text-violet-300 font-semibold underline">
                  Ir a Perfil
                </Link>
              </p>
            </div>
          )}

          {/* ─── FOOTBALL MODE ─────────────────────────────────────────────── */}
          {!loadingProfile && profile && !isSwimmingPool && (
            <>
              {/* Event loading */}
              {loadingEvent && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
                </div>
              )}

              {/* No active event */}
              {!loadingEvent && (isNoActiveEvent || !activeEvent) && (
                <div className="glass p-8 rounded-2xl border border-slate-800 text-center py-14">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-base">
                    No hay evento activo.{' '}
                    <Link to="/events" className="text-violet-400 hover:text-violet-300 font-semibold underline">
                      Ve a Eventos
                    </Link>{' '}
                    para activar uno antes de vender entradas.
                  </p>
                </div>
              )}

              {/* Ticket types */}
              {activeEvent && (
                <>
                  <div className="flex items-center gap-3 glass px-4 py-3 rounded-xl border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-slate-300 text-sm">
                      Evento activo:{' '}
                      <span className="text-white font-semibold">{activeEvent.name}</span>
                    </span>
                  </div>

                  {loadingTypes && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
                    </div>
                  )}

                  {!loadingTypes && ticketTypes.length === 0 && (
                    <div className="glass p-6 rounded-2xl border border-slate-800 text-center py-10">
                      <p className="text-slate-400 text-sm">
                        Este evento aún no tiene tipos de entrada configurados.
                      </p>
                    </div>
                  )}

                  {!loadingTypes && ticketTypes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ticketTypes.map((tt) => (
                        <button
                          key={tt.id}
                          onClick={() => handleSelectType(tt)}
                          className="text-left glass p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-white font-bold text-lg leading-tight group-hover:text-blue-300 transition-colors">
                              {tt.name}
                            </span>
                            {tt.isSeasonPass ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                ABONO
                              </span>
                            ) : (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                ENTRADA
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-end justify-between">
                            <span className="text-2xl font-extrabold text-white">
                              {Number(tt.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                            {tt.quota !== null && (
                              <span className="text-xs text-slate-500">
                                Cupo: {tt.quota}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ─── SWIMMING_POOL MODE ─────────────────────────────────────────── */}
          {!loadingProfile && profile && isSwimmingPool && (
            <>
              {/* Pool mode badge */}
              <div className="flex items-center gap-3 glass px-4 py-3 rounded-xl border border-cyan-700/40 bg-cyan-900/10">
                <span className="text-lg">🏊</span>
                <span className="text-slate-300 text-sm">
                  Modo Piscina —{' '}
                  <span className="text-cyan-300 font-semibold">
                    Temporada: {profile.seasonStartDate} al {profile.seasonEndDate}
                  </span>
                </span>
              </div>

              {/* ── PASO 1: Date picker ────────────────────────────────────── */}
              <div className="glass p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    ¿Para qué día?
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={profile.seasonStartDate ?? todayStr()}
                    max={profile.seasonEndDate ?? undefined}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                  {/* Human-readable day label */}
                  {selectedDate && !dateError && (
                    <p className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateEs(selectedDate)}
                    </p>
                  )}
                  {/* Date error */}
                  {dateError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {dateError}
                    </p>
                  )}
                </div>

                {/* Hint when no date yet */}
                {!selectedDate && (
                  <p className="text-xs text-slate-500">
                    Selecciona el día para el que quieres vender la entrada antes de elegir el tipo.
                  </p>
                )}
              </div>

              {/* Ticket type cards — shown only when a valid date is selected */}
              {selectedDate && !dateError && (
                <>
                  {loadingDisplayedTypes && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
                    </div>
                  )}

                  {!loadingDisplayedTypes && displayedTypes.length === 0 && (
                    <div className="glass p-6 rounded-2xl border border-slate-800 text-center py-10">
                      <p className="text-slate-400 text-sm">
                        No hay tipos de entrada configurados.{' '}
                        <Link to="/perfil" className="text-violet-400 hover:text-violet-300 font-semibold underline">
                          Añade tipos en Perfil
                        </Link>
                      </p>
                    </div>
                  )}

                  {!loadingDisplayedTypes && displayedTypes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {displayedTypes.map((tt) => (
                        <button
                          key={tt.id}
                          onClick={() => handleSelectType(tt)}
                          className="text-left glass p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-white font-bold text-lg leading-tight group-hover:text-cyan-300 transition-colors">
                              {tt.name}
                            </span>
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                              ENTRADA DIARIA
                            </span>
                          </div>
                          <div className="mt-3">
                            <span className="text-2xl font-extrabold text-white">
                              {Number(tt.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STEP 2: Buyer details ──────────────────────────────────────────── */}
      {step === 2 && selectedType && (
        <form onSubmit={handleSell} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Form 2/3 */}
          <div className="md:col-span-2 glass p-6 rounded-2xl border border-slate-800 space-y-5">
            <h2 className="text-lg font-bold text-white">Datos del comprador</h2>

            {/* Error */}
            {sellError && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <svg className="w-5 h-5 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{sellError}</span>
              </div>
            )}

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Ej: María García López"
                disabled={isSelling}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email *
              </label>
              <input
                type="email"
                required
                value={holderEmail}
                onChange={(e) => setHolderEmail(e.target.value)}
                placeholder="Ej: maria@ejemplo.com"
                disabled={isSelling}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setSellError(''); }}
                disabled={isSelling}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isSelling}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSelling ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Vender Entrada'
                )}
              </button>
            </div>
          </div>

          {/* Right: Summary 1/3 */}
          <div className="md:col-span-1 glass p-5 rounded-2xl border border-slate-800 h-fit space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Resumen</h3>
            <div className="space-y-2">

              {/* SWIMMING_POOL: date is the headline */}
              {isSwimmingPool && selectedDate ? (
                <>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Día</p>
                    <p className="text-white font-bold text-base leading-tight">
                      {formatDateEs(selectedDate)}
                    </p>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex items-start justify-between gap-2">
                    <span className="text-slate-300 text-sm">{selectedType.name}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                      ENTRADA DIARIA
                    </span>
                  </div>
                </>
              ) : (
                /* FOOTBALL: type is the headline */
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white font-semibold text-base leading-tight">{selectedType.name}</span>
                  {selectedType.isSeasonPass ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      ABONO
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ENTRADA
                    </span>
                  )}
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Precio</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">
                  {Number(selectedType.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── STEP 3: Confirmation + QR ──────────────────────────────────────── */}
      {step === 3 && soldTicket && (
        <div className="glass p-8 rounded-2xl border border-green-500/20 text-center space-y-6 shadow-xl">
          {/* Success header */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-green-400">¡Entrada vendida!</h2>
              <p className="text-slate-400 text-sm mt-1">
                La entrada ha sido emitida correctamente para{' '}
                <span className="text-white font-semibold">{soldTicket.holderName}</span>
              </p>
              {/* SWIMMING_POOL: show the valid date */}
              {isSwimmingPool && selectedDate && (
                <p className="text-cyan-400 text-sm font-semibold mt-1">
                  📅 Válida para: {formatDateEs(selectedDate)}
                </p>
              )}
            </div>
          </div>

          {/* Ticket preview */}
          <div className="flex justify-center">
            {ticketCanvasUrl ? (
              <div className="p-1 bg-slate-950 rounded-3xl shadow-2xl inline-block border border-slate-800 overflow-hidden">
                <img
                  src={ticketCanvasUrl}
                  alt={`Entrada de ${soldTicket.holderName}`}
                  style={{ width: '300px', height: isSwimmingPool ? '430px' : '400px' }}
                  className="object-contain rounded-[12px]"
                />
              </div>
            ) : (
              <div
                className="rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center"
                style={{ width: '300px', height: isSwimmingPool ? '430px' : '400px' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin border-4 border-blue-500 rounded-full h-8 w-8 border-t-transparent" />
                  <span className="text-slate-400 text-xs font-medium">Generando entrada...</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={handleDownloadQr}
              disabled={!ticketCanvasUrl}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar QR
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
            >
              Vender otra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
