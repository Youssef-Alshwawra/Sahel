"use client";

import { useEffect } from "react";
import { maybeRemind } from "@/lib/notify";
import { DUE_CHANGED } from "@/lib/events";
import { useLang } from "@/lib/i18n";

/** Registers the service worker and fires due-review reminders (when enabled).
 *  Mounted once near the app root; renders nothing. */
export default function Pwa() {
  const { t } = useLang();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const remind = () =>
      maybeRemind({
        title: t("remindTitle"),
        body: (n) => t("remindBody", { n }),
      });

    remind();
    window.addEventListener("focus", remind);
    window.addEventListener(DUE_CHANGED, remind);
    return () => {
      window.removeEventListener("focus", remind);
      window.removeEventListener(DUE_CHANGED, remind);
    };
  }, [t]);

  return null;
}
