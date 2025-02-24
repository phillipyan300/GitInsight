import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "GitInsights",
  description: "Ask questions about any GitHub repository using text or voice.",
  icons: {
    icon: '/GitInsightsLogo.png', 
    shortcut: '/GitInsightsLogo.png',
    apple: '/GitInsightsLogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
