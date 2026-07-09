import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  upsertProfile,
  uploadAbonoBackground,
  deleteAbonoBackground,
} from '../api/profile';
import { getTemplates, createTemplate, deleteTemplate } from '../api/ticketTemplates';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  accent = 'violet',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: 'violet' | 'indigo' | 'emerald';
}) {
  const accentClasses = {
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentClasses[accent]} border flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all duration-200';

// ─── Toast component ─────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  const base =
    'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border animate-fade-in-up';
  const variants = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    error: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  };
  return (
    <div className={`${base} ${variants[type]}`}>
      {type === 'success' ? <CheckIcon /> : null}
      {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const qc = useQueryClient();

  // ── Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Profile query
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // ── Profile form state
  const [teamName, setTeamName] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');
  const [systemType, setSystemType] = useState<'FOOTBALL' | 'SWIMMING_POOL'>('FOOTBALL');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');

  useEffect(() => {
    if (profile) {
      setTeamName(profile.teamName);
      setVenue(profile.venue);
      setCapacity(String(profile.capacity));
      setSystemType(profile.systemType ?? 'FOOTBALL');
      setSeasonStartDate(profile.seasonStartDate ?? '');
      setSeasonEndDate(profile.seasonEndDate ?? '');
    }
  }, [profile]);

  // Season date validation
  const seasonDatesInvalid =
    systemType === 'SWIMMING_POOL' &&
    seasonStartDate &&
    seasonEndDate &&
    seasonEndDate < seasonStartDate;

  const upsertMutation = useMutation({
    mutationFn: () =>
      upsertProfile({
        teamName,
        venue,
        capacity: Number(capacity),
        systemType,
        seasonStartDate: systemType === 'SWIMMING_POOL' ? seasonStartDate || null : null,
        seasonEndDate: systemType === 'SWIMMING_POOL' ? seasonEndDate || null : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      showToast('Perfil guardado correctamente');
    },
    onError: () => showToast('Error al guardar el perfil', 'error'),
  });

  // ── Background image
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreviewLocal, setBgPreviewLocal] = useState<string | null>(null);
  const [bgPreviewRemote, setBgPreviewRemote] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);

  // Load remote preview from the Cloudinary URL in the profile
  useEffect(() => {
    if (profile?.abonoBackgroundUrl) {
      setBgPreviewRemote(profile.abonoBackgroundUrl);
    } else {
      setBgPreviewRemote(null);
    }
  }, [profile?.abonoBackgroundUrl]);

  const uploadBgMutation = useMutation({
    mutationFn: async () => {
      if (!bgFile) return;
      setBgLoading(true);
      return uploadAbonoBackground(bgFile);
    },
    onSuccess: (data) => {
      setBgFile(null);
      setBgPreviewLocal(null);
      qc.invalidateQueries({ queryKey: ['profile'] });
      if (data?.abonoBackgroundUrl) {
        setBgPreviewRemote(data.abonoBackgroundUrl);
      }
      setBgLoading(false);
      showToast('Imagen de fondo actualizada');
    },
    onError: () => {
      setBgLoading(false);
      showToast('Error al subir la imagen', 'error');
    },
  });

  const deleteBgMutation = useMutation({
    mutationFn: deleteAbonoBackground,
    onSuccess: () => {
      setBgPreviewRemote(null);
      qc.invalidateQueries({ queryKey: ['profile'] });
      showToast('Imagen de fondo eliminada');
    },
    onError: () => showToast('Error al eliminar imagen', 'error'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFile(file);
    setBgPreviewLocal(URL.createObjectURL(file));
  };

  // ── Ticket type templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['ticketTemplates'],
    queryFn: getTemplates,
  });

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createTemplate(newName, Number(newPrice)),
    onSuccess: () => {
      setNewName('');
      setNewPrice('');
      qc.invalidateQueries({ queryKey: ['ticketTemplates'] });
      showToast('Tipo de entrada añadido');
    },
    onError: () => showToast('Error al añadir el tipo', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticketTemplates'] });
      showToast('Tipo eliminado');
    },
    onError: () => showToast('Error al eliminar el tipo', 'error'),
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`¿Eliminar "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const previewSrc = bgPreviewLocal ?? bgPreviewRemote;

  // ── Season banner helpers
  const today = new Date().toISOString().split('T')[0];
  const isInSeason =
    profile?.systemType === 'SWIMMING_POOL' &&
    profile?.seasonStartDate &&
    profile?.seasonEndDate &&
    today >= profile.seasonStartDate &&
    today <= profile.seasonEndDate;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 text-violet-400">
              <ShieldIcon />
            </span>
            Perfil del club
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            Configura los datos del club, la imagen de abonados y los tipos de entrada predeterminados.
          </p>
        </div>
      </div>

      {/* ── BANNER: Modo piscina ──────────────────────────────────────────── */}
      {profile?.systemType === 'SWIMMING_POOL' && (
        <div
          className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${
            isInSeason
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          <span className="text-2xl">🏊</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Modo Piscina activo — Temporada:{' '}
              <span className="font-bold">
                {profile.seasonStartDate} al {profile.seasonEndDate}
              </span>
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${
              isInSeason
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            {isInSeason ? '✓ En temporada' : '✗ Fuera de temporada'}
          </span>
        </div>
      )}

      {/* ── SECCIÓN 1: Datos del club ─────────────────────────────────────── */}
      <SectionCard
        icon={<ShieldIcon />}
        title="Datos del club"
        subtitle="Información general que se usará al crear eventos"
        accent="violet"
      >
        {profileLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Cargando perfil…</span>
          </div>
        ) : (
          <>
            {!profile && (
              <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configura el perfil de tu club para agilizar la creación de eventos.
              </div>
            )}

            {/* ── Selector de sistema ─────────────────────────────────────── */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Tipo de sistema
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card FOOTBALL */}
                <button
                  type="button"
                  onClick={() => setSystemType('FOOTBALL')}
                  className={`flex items-start gap-3 px-4 py-4 rounded-xl border text-left transition-all duration-200 ${
                    systemType === 'FOOTBALL'
                      ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-2xl mt-0.5">⚽</span>
                  <div>
                    <p className={`text-sm font-semibold ${
                      systemType === 'FOOTBALL' ? 'text-blue-300' : 'text-slate-200'
                    }`}>
                      Club de Fútbol
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Eventos independientes, abonos válidos por partido
                    </p>
                  </div>
                  {systemType === 'FOOTBALL' && (
                    <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckIcon />
                    </span>
                  )}
                </button>

                {/* Card SWIMMING_POOL */}
                <button
                  type="button"
                  onClick={() => setSystemType('SWIMMING_POOL')}
                  className={`flex items-start gap-3 px-4 py-4 rounded-xl border text-left transition-all duration-200 ${
                    systemType === 'SWIMMING_POOL'
                      ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-2xl mt-0.5">🏊</span>
                  <div>
                    <p className={`text-sm font-semibold ${
                      systemType === 'SWIMMING_POOL' ? 'text-blue-300' : 'text-slate-200'
                    }`}>
                      Piscina / Temporada
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Temporada con fechas fijas, entradas diarias
                    </p>
                  </div>
                  {systemType === 'SWIMMING_POOL' && (
                    <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              </div>

              {/* Season dates — visible only for SWIMMING_POOL */}
              {systemType === 'SWIMMING_POOL' && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Inicio de temporada">
                      <input
                        type="date"
                        className={inputCls}
                        value={seasonStartDate}
                        onChange={(e) => setSeasonStartDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Fin de temporada">
                      <input
                        type="date"
                        className={inputCls}
                        value={seasonEndDate}
                        onChange={(e) => setSeasonEndDate(e.target.value)}
                      />
                    </Field>
                  </div>

                  {seasonDatesInvalid && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      La fecha de fin no puede ser anterior a la de inicio
                    </p>
                  )}

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Los abonos solo serán válidos entre estas fechas.
                    Las entradas solo se podrán vender para días dentro de este rango.
                  </p>
                </div>
              )}
            </div>

            {/* ── Campos nombre / aforo / venue ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={systemType === 'SWIMMING_POOL' ? 'Nombre de la temporada' : 'Nombre del equipo'}>
                <input
                  className={inputCls}
                  placeholder={systemType === 'SWIMMING_POOL' ? 'Ej. Temporada Piscina 2026' : 'Ej. Real Betis Balompié'}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </Field>

              <Field label="Aforo máximo">
                <input
                  className={inputCls}
                  type="number"
                  placeholder="60 000"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>

              <Field label={systemType === 'SWIMMING_POOL' ? 'Nombre del recinto' : 'Estadio / Venue'}>
                <input
                  className={`${inputCls} sm:col-span-2`}
                  placeholder={systemType === 'SWIMMING_POOL' ? 'Ej. Piscina Municipal de Sevilla' : 'Ej. Estadio Benito Villamarín'}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => upsertMutation.mutate()}
                disabled={
                  upsertMutation.isPending ||
                  !teamName ||
                  !venue ||
                  !capacity ||
                  (systemType === 'SWIMMING_POOL' && (!seasonStartDate || !seasonEndDate)) ||
                  !!seasonDatesInvalid
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20"
              >
                {upsertMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckIcon />
                )}
                Guardar perfil
              </button>
            </div>
          </>
        )}
      </SectionCard>

      {/* ── SECCIÓN 2: Imagen de fondo abonados ──────────────────────────── */}
      <SectionCard
        icon={<ImageIcon />}
        title="Imagen de fondo para abonados"
        subtitle="Se usará de fondo en TODOS los carnets de abonado"
        accent="indigo"
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="shrink-0">
            {previewSrc ? (
              <div className="relative group w-52 h-32 rounded-xl overflow-hidden border border-slate-700/60 shadow-lg">
                <img
                  src={previewSrc}
                  alt="Fondo abonados"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white/80 font-medium">Vista previa</span>
                </div>
                {bgPreviewLocal && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/90 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    Pendiente
                  </div>
                )}
              </div>
            ) : (
              <div className="w-52 h-32 rounded-xl border-2 border-dashed border-slate-700/60 flex flex-col items-center justify-center gap-2 text-slate-600">
                <ImageIcon />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex flex-col gap-4 flex-1">
            <p className="text-sm text-slate-400 leading-relaxed">
              Esta imagen se usará de fondo en{' '}
              <span className="text-indigo-400 font-semibold">TODOS los carnets de abonado</span>.
              Recomendamos una imagen apaisada de al menos 1200×800 px.
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-sm font-medium rounded-xl transition-all duration-200"
              >
                <ImageIcon />
                Seleccionar imagen
              </button>

              {bgFile && (
                <button
                  onClick={() => uploadBgMutation.mutate()}
                  disabled={uploadBgMutation.isPending || bgLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
                >
                  {uploadBgMutation.isPending || bgLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UploadIcon />
                  )}
                  Subir imagen
                </button>
              )}
            </div>

            {bgFile && (
              <p className="text-xs text-slate-500">
                Archivo seleccionado:{' '}
                <span className="text-slate-300 font-medium">{bgFile.name}</span>
                {' '}({(bgFile.size / 1024).toFixed(0)} KB)
              </p>
            )}

            {bgPreviewRemote && !bgFile && (
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que quieres eliminar la imagen de fondo?')) {
                    deleteBgMutation.mutate();
                  }
                }}
                disabled={deleteBgMutation.isPending}
                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 text-xs font-semibold transition-all w-fit disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleteBgMutation.isPending ? 'Eliminando...' : 'Eliminar imagen actual'}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── SECCIÓN 3: Tipos de entrada predeterminados ───────────────────── */}
      <SectionCard
        icon={<TagIcon />}
        title="Tipos de entrada predeterminados"
        subtitle="Se cargarán automáticamente al crear un nuevo evento"
        accent="emerald"
      >
        {/* Info note */}
        <p className="mb-5 text-sm text-slate-400 leading-relaxed">
          Estos tipos se cargarán automáticamente al crear un nuevo evento.
          Puedes añadir o eliminar plantillas en cualquier momento sin afectar los eventos existentes.
        </p>

        {/* Template chips */}
        {templatesLoading ? (
          <div className="flex items-center gap-3 py-3">
            <div className="w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Cargando plantillas…</span>
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-slate-600 py-3">No hay tipos predeterminados todavía.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {templates.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-300 font-medium transition-all duration-200 hover:border-emerald-500/40"
              >
                <span>
                  {t.name}
                  <span className="mx-1 text-emerald-500/60">—</span>
                  {Number(t.price).toFixed(2)} €
                </span>
                <button
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deleteMutation.isPending}
                  className="ml-0.5 p-0.5 rounded-full text-emerald-500/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 disabled:opacity-50"
                  title={`Eliminar ${t.name}`}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <div className="border-t border-slate-800/60 pt-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Añadir nuevo tipo predeterminado
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className={`${inputCls} flex-1`}
              placeholder="Nombre (Ej. Visitante)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="relative">
              <input
                className={`${inputCls} pr-8 w-full sm:w-36`}
                type="number"
                placeholder="Precio"
                min={0}
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                €
              </span>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newName || !newPrice}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Añadir tipo predeterminado
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
