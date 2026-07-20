"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <div className="hidden md:flex md:flex-col md:justify-between bg-ink text-white p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
          }}
        />
        <p className="font-display text-3xl relative">Revisor</p>
        <div className="relative">
          <p className="font-display text-4xl leading-tight max-w-md">
            Presupuestos, proyectos y reportes — con una sola voz que decide.
          </p>
          <p className="text-white/50 text-sm mt-6 max-w-sm">
            Cada documento queda registrado paso a paso: quién lo envió, quién lo
            revisó y qué se decidió, hasta la aprobación final.
          </p>
        </div>
        <p className="text-white/30 text-xs relative">Plataforma interna del grupo</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-paper">
        <div className="w-full max-w-sm">
          <div className="mb-10 md:hidden text-center">
            <h1 className="font-display text-3xl text-ink">Revisor</h1>
          </div>
          <h2 className="font-display text-2xl text-ink mb-1">Ingresar</h2>
          <p className="text-sm text-ink-soft mb-8">Usa la cuenta que te asignaron.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="tucorreo@empresa.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-xs text-ink-soft/70 mt-8">
            ¿No tienes acceso? Solicítalo al director general.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
