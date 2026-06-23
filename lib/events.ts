/** Lightweight cross-component signal so the header's due badge can refresh
 *  whenever review items change (answered, scheduled, imported, deleted). */
export const DUE_CHANGED = "sahel:due-changed";

export function notifyDueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DUE_CHANGED));
  }
}
