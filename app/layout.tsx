import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./motion.css";
import "./insights-launcher.css";
import "./navigation.css";

export const metadata: Metadata = {
  title: "NOURA",
  description: "Nutrition, habits and performance inside Telegram",
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
        {children}
        <div className="noura-launchers">
          <a className="insights-launcher plan-launcher" href="/plan">Plan</a>
          <a className="insights-launcher" href="/insights">Insights</a>
        </div>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
