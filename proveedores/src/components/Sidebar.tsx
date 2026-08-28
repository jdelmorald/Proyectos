"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Truck, PlusCircle, UserCog, LogOut } from "lucide-react";

type SidebarProps = {
  name: string;
  isAdmin: boolean;
};

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/suppliers": Truck,
  "/suppliers/new": PlusCircle,
  "/admin/usuarios": UserCog,
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

  function linkStyle(active: boolean): React.CSSProperties {
    return active
      ? {
          background: "var(--color-accent)",
          color: "#fff",
          fontWeight: 600,
          boxShadow: "0 8px 18px -8px rgba(214,41,58,0.5)",
        }
      : { color: "var(--color-ink-soft)" };
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print hidden md:flex glass-panel thin-scrollbar w-[264px] shrink-0 md:sticky md:top-[18px] rounded-[24px] px-[1.1rem] py-[1.3rem] flex-col gap-[1.6rem] overflow-y-auto max-h-[calc(100vh-36px)] z-[2]">
        <div
          className="flex items-center gap-[.6rem] pb-[1.1rem]"
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          <div
            className="h-[54px] w-[54px] rounded-[14px] bg-white flex items-center justify-center shrink-0 p-[7px]"
            style={{ boxShadow: "0 8px 18px -7px rgba(43,35,32,0.38)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sumivensa" className="h-full w-full object-contain" />
          </div>
          <div className="leading-none">
            <div
              className="font-display font-extrabold text-[.86rem]"
              style={{ color: "var(--color-ink)", letterSpacing: "-.005em" }}
            >
              SUMIVENSA
            </div>
            <div
              className="text-[.5rem] font-semibold uppercase mt-1"
              style={{ color: "var(--color-accent)", letterSpacing: ".11em" }}
            >
              Sistema de Proveedores
            </div>
          </div>
        </div>

        <nav className="flex-1">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = NAV_ICONS[link.href] ?? Truck;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={linkStyle(active)}
                className="flex items-center gap-[.65rem] rounded-[11px] px-[.7rem] py-[.55rem] text-[.84rem] font-medium mb-[2px] transition-colors hover:bg-[rgba(214,41,58,0.07)]"
              >
                <Icon size={16} /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-[1rem]" style={{ borderTop: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-[.6rem] mb-[.8rem]">
            <span
              className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0"
              style={{ background: "var(--color-accent)" }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-[.82rem] font-medium truncate" style={{ color: "var(--color-ink)" }}>
                {name}
              </p>
              <p className="text-[.68rem]" style={{ color: "var(--color-ink-soft)" }}>
                {isAdmin ? "Administrador" : "Colaborador"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-1.5 text-[.8rem] rounded-[11px] px-3 py-[.55rem] transition-colors hover:bg-[rgba(214,41,58,0.07)]"
            style={{ color: "var(--color-ink-soft)", border: "1px solid var(--color-line)" }}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print md:hidden glass-panel sticky top-2 mx-2 mt-2 rounded-[20px] z-[2]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sumivensa" className="h-8 w-8 object-contain" />
            <span
              className="font-display font-extrabold text-sm"
              style={{ color: "var(--color-ink)" }}
            >
              SUMIVENSA
            </span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs font-medium"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Salir
          </button>
        </div>
        <nav className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={
                  active
                    ? { background: "var(--color-accent)", color: "#fff" }
                    : { color: "var(--color-ink-soft)", border: "1px solid var(--color-line)" }
                }
                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium"
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
