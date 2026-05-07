import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import "./fonts.css";

export const metadata: Metadata = {
  title: "SmartOps - Soluciones Inteligentes para tu Negocio",
  description: "Plataforma de gestión empresarial...",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" }, // Favicon clásico
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#5bbad5", // Color de la pestaña en Safari
      },
    ],
  },
  manifest: "/site.webmanifest", // Archivo manifest para PWA
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head />
      <body suppressHydrationWarning className="antialiased font-montserrat">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}