import type { Metadata, Viewport } from "next";
import Script from "next/script";
import NouraClient from "./noura-client";
import "./globals.css";
import "./motion.css";
import "./insights-launcher.css";
import "./navigation.css";

export const metadata: Metadata = {
  title: "NOURA",
  description: "Nutrition, habits and performance inside Telegram",
  manifest: "/manifest.webmanifest",
  applicationName: "NOURA",
  appleWebApp: { capable: true, title: "NOURA", statusBarStyle: "black-translucent" },
  icons: { icon: "/noura-icon.svg", apple: "/noura-icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080a0c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
        <NouraClient />
        <nav className="noura-launchers" aria-label="Accesos rápidos NOURA">
          <a className="insights-launcher plan-launcher" href="/plan"><span>Plan</span></a>
          <a className="insights-launcher coach-launcher" href="/coach"><span>Coach</span></a>
          <a className="insights-launcher" href="/insights"><span>Insights</span></a>
          <a className="insights-launcher profile-launcher" href="/profile"><span>Perfil</span></a>
        </nav>
      </body>
    </html>
  );
}
