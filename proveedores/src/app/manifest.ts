import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sumivensa | Sistema de Proveedores",
    short_name: "Proveedores",
    description:
      "Registro, clasificación y calificación de proveedores levantados en visitas de campo.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbf7f3",
    theme_color: "#d6293a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
