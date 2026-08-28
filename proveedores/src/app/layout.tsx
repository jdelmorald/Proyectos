import type { Metadata, Viewport } from "next";
import { Syne, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Sumivensa | Sistema de Proveedores",
  description:
    "Sistema de Sumivensa para registrar, clasificar y calificar proveedores levantados en visitas de campo, con fotos del local y sus productos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Proveedores",
  },
};

export const viewport: Viewport = {
  themeColor: "#d6293a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${syne.variable} ${plexSans.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
