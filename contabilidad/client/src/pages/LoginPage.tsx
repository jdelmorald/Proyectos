import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import BrandLogo from '../components/BrandLogo';
import FinancialIllustration from '../components/FinancialIllustration';

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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #fdf6ea 0%, #fbf9f4 45%, #f4f6fb 100%)' }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Columna del formulario */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <BrandLogo size="md" />

          <h1 className="text-2xl font-bold text-brand-900 mt-8 mb-6">Inicia Sesión</h1>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:bg-accent-50/40 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:bg-accent-50/40 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 shadow-lg shadow-accent-600/20"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            >
              {loading ? 'Ingresando...' : 'Acceder al Sistema'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            ¿Olvidaste tu contraseña? Contacta a tu administrador.
          </p>
        </div>

        {/* Columna de la ilustración */}
        <div
          className="hidden md:flex items-center justify-center p-10 relative"
          style={{ background: 'linear-gradient(160deg, #fef3e2 0%, #eaf7f6 55%, #eef1fb 100%)' }}
        >
          <FinancialIllustration />
        </div>
      </div>
    </div>
  );
}
