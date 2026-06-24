import { getDueCount, getSettings, saveSettings } from "./db";

// Free, server-less reminders. We can't do true background web-push without a
// backend + VAPID keys, so instead we fire a *local* notification when the app
// is open (or regains focus) and reviews are due — at most once per ~20h.

const MIN_GAP_MS = 20 * 60 * 60 * 1000;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : "denied";
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** Show a notification via the service worker if available, else directly. */
async function show(title: string, body: string): Promise<void> {
  const options: NotificationOptions = {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "sahel-due",
  };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, { ...options, data: { url: "/review" } });
      return;
    }
  } catch {
    // fall through to a plain Notification
  }
  new Notification(title, options);
}

/**
 * If reminders are on, permission is granted, items are due, and we haven't
 * reminded recently, surface a local notification. Safe to call on every load.
 */
export async function maybeRemind(messages: {
  title: string;
  body: (count: number) => string;
}): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;

  const settings = await getSettings();
  if (!settings.remindersEnabled) return;

  const last = settings.lastRemindedAt
    ? new Date(settings.lastRemindedAt).getTime()
    : 0;
  if (Date.now() - last < MIN_GAP_MS) return;

  const due = await getDueCount();
  if (due <= 0) return;

  await show(messages.title, messages.body(due));
  await saveSettings({ lastRemindedAt: new Date().toISOString() });
}
