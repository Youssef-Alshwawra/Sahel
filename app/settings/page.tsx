"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Download, RotateCcw, Smartphone, Upload } from "lucide-react";
import type { Settings } from "@/lib/types";
import {
  clearAll,
  exportAll,
  getSettings,
  importAll,
  saveSettings,
} from "@/lib/db";
import { notifyDueChanged } from "@/lib/events";
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from "@/lib/notify";
import { useLang } from "@/lib/i18n";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function SettingsPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    function onBip(e: Event) {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function update(patch: Partial<Settings>) {
    const next = await saveSettings(patch);
    setSettings(next);
  }

  async function toggleReminders() {
    if (!settings) return;
    if (!settings.remindersEnabled) {
      const perm = await requestNotificationPermission();
      if (perm !== "granted") {
        flash(t("notifDenied"));
        return;
      }
    }
    await update({ remindersEnabled: !settings.remindersEnabled });
  }

  async function backup() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sahel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restore(file: File, mode: "merge" | "replace") {
    try {
      const data = JSON.parse(await file.text());
      await importAll(data, mode);
      notifyDueChanged();
      setSettings(await getSettings());
      flash(t("restoreOk"));
    } catch {
      flash(t("restoreFail"));
    }
  }

  function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const mode = window.confirm(t("restoreReplaceConfirm"))
      ? "replace"
      : "merge";
    restore(file, mode);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  async function reset() {
    if (!window.confirm(t("resetConfirm"))) return;
    await clearAll();
    notifyDueChanged();
    setSettings(await getSettings());
    flash(t("resetOk"));
  }

  if (!settings) {
    return <div className="py-24 text-center text-zinc-500">{t("loading")}</div>;
  }

  const perm = notificationPermission();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {t("settingsTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{t("settingsSubtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* Daily goal */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="font-medium text-zinc-100">{t("dailyGoal")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("dailyGoalHint")}</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={500}
              value={settings.dailyGoal}
              onChange={(e) =>
                update({
                  dailyGoal: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                })
              }
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
            />
            <span className="text-sm text-zinc-500">{t("cardsPerDay")}</span>
          </div>
        </section>

        {/* Reminders */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-medium text-zinc-100">
                <Bell className="h-4 w-4 text-indigo-400" />
                {t("reminders")}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">{t("remindersHint")}</p>
            </div>
            <button
              disabled={!notificationsSupported() || perm === "denied"}
              onClick={toggleReminders}
              className={`mt-1 inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors disabled:opacity-40 ${
                settings.remindersEnabled ? "bg-indigo-500" : "bg-zinc-700"
              }`}
              aria-pressed={settings.remindersEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.remindersEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {!notificationsSupported() && (
            <p className="mt-2 text-xs text-zinc-500">{t("notifUnsupported")}</p>
          )}
          {perm === "denied" && (
            <p className="mt-2 text-xs text-amber-300">{t("notifBlocked")}</p>
          )}
        </section>

        {/* Install */}
        {installEvent && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="flex items-center gap-2 font-medium text-zinc-100">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              {t("installApp")}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{t("installHint")}</p>
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
            >
              <Smartphone className="h-4 w-4" />
              {t("installApp")}
            </button>
          </section>
        )}

        {/* Backup / restore */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="font-medium text-zinc-100">{t("backupTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("backupHint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={backup}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              {t("backupDownload")}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <Upload className="h-4 w-4" />
              {t("backupRestore")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onRestoreFile}
              className="hidden"
            />
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="font-medium text-rose-200">{t("dangerZone")}</h2>
          <p className="mt-1 text-sm text-rose-200/70">{t("resetHint")}</p>
          <button
            onClick={reset}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20"
          >
            <RotateCcw className="h-4 w-4" />
            {t("resetAll")}
          </button>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
