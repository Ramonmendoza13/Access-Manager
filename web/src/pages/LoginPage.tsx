import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginUser } from '../api/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    loginUser(username.trim(), password)
      .then((data) => {
        login(data.token, {
          id: data.email,
          username: data.email,
          email: data.email,
          role: data.role.toLowerCase(),
          name: data.email.split('@')[0],
        });
        setIsLoading(false);
        navigate('/dashboard');
      })
      .catch((err: any) => {
        setIsLoading(false);
        setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
      });
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Ambient background light spheres */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card container */}
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl p-8 relative z-10 border border-slate-800">
        
        {/* Branding header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-extrabold text-xl">AM</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Access Manager
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Ingresa al panel de control de acceso
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Demo Tip */}
        <div className="mt-8 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-500">
            Tip: Escribe <code className="text-violet-400 bg-violet-500/5 px-1 py-0.5 rounded">admin</code> para perfil de Administrador, o cualquier otro usuario para Operador.
          </p>
        </div>

      </div>
    </div>
  );
}
