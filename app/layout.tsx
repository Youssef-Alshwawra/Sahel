import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import Providers from "./providers";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-english",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Sahel — Learn",
  description: "A personal learning app for AI-generated JSON courses.",
  applicationName: "Sahel",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sahel",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

// Set lang/dir from the saved preference before hydration to avoid a flash.
const dirScript = `(function(){try{var l=localStorage.getItem('sahel-lang')||'en';var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${geistMono.variable} ${ibmPlexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: dirScript }} />
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
