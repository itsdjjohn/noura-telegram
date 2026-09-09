import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./motion.css";

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
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
