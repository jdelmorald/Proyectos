import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Revisor | Plataforma de revisión y aprobación",
  description:
    "Plataforma interna para cargar, revisar, objetar y aprobar presupuestos, proyectos y reportes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${fraunces.variable} ${plexSans.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
