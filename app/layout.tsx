import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/app/components/global/Modal/ModalContext";
import MobileWarningModal from "@/app/components/global/MobileWarningModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opiekuś - System zarządzania przedszkolem",
  description: "Aplikacja do zarządzania przedszkolem - komunikacja z rodzicami, dokumenty, obecności",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Opiekuś',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/global/logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ModalProvider>
          <MobileWarningModal />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}

