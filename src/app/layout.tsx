import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

import { Providers } from "@/components/Providers";
import { DevnetBanner } from "@/components/DevnetBanner";
import { ShaderBackground } from "@/components/ShaderBackground";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgenC",
  description: "AgenC coordination protocol",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Theme bootstrap (prevents flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased ${_geist.className}`}>
        {/* Background should be outside Providers so it never re-mounts */}
        <ShaderBackground />

        <Providers>
          <DevnetBanner />
          {children}
        </Providers>

        <Analytics />
      </body>
    </html>
  );
}
