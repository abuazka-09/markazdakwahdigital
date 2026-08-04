import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "MARKAZ DAKWAH DIGITAL",
  description: "Realtime Smart Education Dashboard",
  applicationName: "MARKAZ DAKWAH DIGITAL",
  appleWebApp: {
    capable: true,
    title: "Markaz"
  }
};

export const viewport: Viewport = {
  themeColor: "#1f6f5b",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
