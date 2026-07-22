import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import BrandLogo from '../components/BrandLogo';
import AnimatedBackground from '../components/AnimatedBackground';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/seleccionar-empresa');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <AnimatedBackground foco="derecha" />

      <div className="animate-entrada w-full max-w-md rounded-3xl border border-white/25 bg-white/[0.17] backdrop-blur-[38px] backdrop-saturate-150 shadow-2xl shadow-black/40 p-8 sm:p-10">
        <div className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-gold-400 mb-3.5">
          Sistema de Contabilidad — Administración y Finanzas
        </div>
        <BrandLogo size="md" light />

        <h1 className="font-display text-2xl font-semibold text-white mt-8 mb-6">Inicia Sesión</h1>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/25 bg-white/[0.10] px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-white/[0.10] px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs"
                tabIndex={-1}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-brand-900 font-semibold py-3 rounded-xl transition disabled:opacity-60 shadow-lg shadow-gold-900/20 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400"
          >
            {loading ? 'Ingresando...' : 'Acceder al Sistema'}
          </button>
        </form>

        <p className="text-xs text-white/40 text-center mt-6">
          ¿Olvidaste tu contraseña? Contacta a tu administrador.
        </p>
      </div>
    </div>
  );
}
