"use client";

import { LanguageProvider } from "@/lib/i18n";
import Pwa from "@/components/Pwa";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Pwa />
      {children}
    </LanguageProvider>
  );
}
