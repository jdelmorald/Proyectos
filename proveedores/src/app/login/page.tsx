"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { AnimatedBackground } from "@/components/AnimatedBackground";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/suppliers";

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
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <AnimatedBackground />

      <div className="glass-panel panel-in relative z-[2] w-full max-w-[462px] rounded-[26px] px-8 sm:px-10 pt-11 pb-10">
        <div className="flex items-center gap-[1.1rem] mb-[1.9rem]">
          <BrandMark size="md" />
        </div>

        <h1
          className="font-display font-extrabold text-2xl mb-[.35rem]"
          style={{ color: "var(--color-ink)", letterSpacing: "-.015em" }}
        >
          Acceso al sistema
        </h1>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          Proveedores levantados en campo, con fotos, contacto y calificación.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-[1.15rem]">
            <label
              htmlFor="email"
              className="block text-[.64rem] font-bold uppercase mb-2"
              style={{ color: "var(--color-ink-soft)", letterSpacing: ".12em" }}
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@sumivensa.com"
              className="field-input w-full rounded-[13px] py-[.9rem] px-4 text-base sm:text-sm"
            />
          </div>

          <div className="mb-[1.15rem]">
            <label
              htmlFor="password"
              className="block text-[.64rem] font-bold uppercase mb-2"
              style={{ color: "var(--color-ink-soft)", letterSpacing: ".12em" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input w-full rounded-[13px] py-[.9rem] px-4 text-base sm:text-sm"
            />
          </div>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2 mb-4"
              style={{
                color: "var(--color-accent-deep)",
                background: "var(--color-accent-soft)",
                border: "1px solid var(--color-accent-soft)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-[.95rem] rounded-[13px] mt-1 transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "var(--color-accent)", boxShadow: "0 14px 28px -10px rgba(214,41,58,0.55)" }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center text-[.74rem] mt-[1.4rem]" style={{ color: "var(--color-ink-soft)" }}>
          ¿Olvidaste tu contraseña? Contacta a quien administra el sistema.
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
