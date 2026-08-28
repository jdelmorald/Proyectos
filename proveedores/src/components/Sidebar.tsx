"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type SidebarProps = {
  name: string;
  isAdmin: boolean;
};

export function Sidebar({ name, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Panel" },
    { href: "/suppliers", label: "Proveedores" },
    { href: "/suppliers/new", label: "Nuevo proveedor" },
    ...(isAdmin ? [{ href: "/admin/usuarios", label: "Usuarios" }] : []),
  ];

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-ink text-white/90">
        <div className="px-6 pt-8 pb-6">
          <p className="font-display text-2xl tracking-tight text-white">Proveedores</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/40 mt-1">
            Sistema de proveedores
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-accent/80 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              <p className="text-[11px] text-white/40">{isAdmin ? "Administrador" : "Colaborador"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-sm text-white/60 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden bg-ink text-white/90 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="font-display text-xl text-white">
            Proveedores
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-white/60 hover:text-white"
          >
            Salir
          </button>
        </div>
        <nav className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                  active ? "bg-white/15 text-white" : "text-white/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
