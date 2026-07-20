"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { AppRole } from "@/lib/roles";
import { isAdminRole, ROLE_LABELS } from "@/lib/roles";

type NavProps = {
  name: string;
  role: AppRole;
};

export function Nav({ name, role }: NavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Panel" },
    ...(role === "COLABORADOR"
      ? [{ href: "/submissions/new", label: "Nuevo documento" }]
      : []),
    ...(isAdminRole(role)
      ? [
          { href: "/admin/usuarios", label: "Usuarios" },
          { href: "/admin/empresas", label: "Empresas" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Revisor
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm ${
                  pathname === link.href
                    ? "text-slate-900 font-medium"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{name}</p>
            <p className="text-xs text-slate-400 leading-tight">{ROLE_LABELS[role]}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md px-3 py-1.5"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
