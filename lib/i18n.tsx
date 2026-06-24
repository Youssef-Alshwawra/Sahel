"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "en" | "ar";

export const STORAGE_KEY = "sahel-lang";

// ---- Dictionary ----------------------------------------------------------

const EN = {
  appName: "Sahel",
  langToggle: "العربية",

  review: "Review",
  importCourse: "Import course",
  library: "Library",
  librarySubtitle: "Your imported courses, grouped by category.",
  loading: "Loading…",
  preview: "Preview",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetZoom: "Reset zoom",
  diagram: "Diagram",
  diagramPreview: "Diagram preview",
  dragToMove: "Drag the diagram to move around.",

  noCoursesTitle: "No courses yet",
  noCoursesBody: "Import a course JSON, or load the sample to take a look around.",
  loadSample: "Load sample course",

  section: "section",
  sections: "sections",
  sectionsHeading: "Sections",
  progress: "Progress",
  courseProgress: "Course progress",
  reviewThisCourse: "Review this course",
  terms: "Terms",
  termsTitle: "Course terms",
  termsFor: "Key terminology used in “{title}”.",
  noTerms: "This course does not include any terms yet.",
  export: "Export",
  delete: "Delete",
  blocks: "blocks",
  questions: "questions",
  start: "Start",
  continue: "Continue",
  revisit: "Revisit",
  courseNotFound: "Course not found",
  backToLibrary: "Back to library",
  backToCourse: "Back to course",
  deleteConfirm:
    "Delete “{title}” and all of its progress and review items?",

  outline: "Outline",
  begin: "Begin",
  previous: "Previous",
  next: "Next",
  sectionComplete: "Section complete",
  sectionCompleteBody:
    "“{title}” is done. Wrong answers were added to your review deck.",
  nextSection: "Next section",
  reviewNow: "Review now",
  sectionNotFound: "Section not found",

  mcqLabel: "Multiple choice",
  fillLabel: "Fill in the blank",
  flashcardLabel: "Flashcard",
  writtenLabel: "Written",
  submit: "Submit",
  check: "Check",
  correct: "Correct",
  notQuite: "Not quite",
  answerColon: "Answer:",
  typeBlank: "Type what goes in the blank…",
  showAnswer: "Show answer",
  showModel: "Show model answer",
  modelAnswer: "Model answer",
  front: "Front",
  back: "Back",
  writePlaceholder:
    "Write your answer, then reveal the model answer to self-grade…",

  recallPrompt: "How well did you recall this?",
  matchPrompt: "How well did your answer match?",
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",

  focusWhy: "Why",
  focusHow: "How",
  focusWhen: "When",
  focusWhat: "What",
  focusSyntax: "Syntax",

  importDesc:
    "Paste a course JSON below, or upload a .json file. It’s validated before anything is saved.",
  importBtn: "Import",
  importing: "Importing…",
  uploadJson: "Upload .json",
  importProblems: "Couldn’t import — {count} {noun}:",
  problemOne: "problem",
  problemMany: "problems",
  invalidJson: "Invalid JSON — {msg}",
  fileReadError: "Could not read the selected file.",
  close: "Close",

  sampleLoaded: "Sample course loaded.",
  importedToast: "Imported “{title}”.",
  updatedToast: "Updated “{title}”.",

  importSection: "Import section",
  importSectionDesc:
    "Paste a section JSON (or an array of sections) to add to “{title}”. A section whose id already exists is replaced. Validated before saving.",
  noSectionFound: "No section found in that JSON.",
  dupBlockIds: "Duplicate block ids (must be unique within a course): {ids}",
  sectionsMerged: "Added {added}, updated {replaced} section(s).",

  loadingReview: "Loading review…",
  allCaughtUp: "All caught up",
  allCaughtUpBody:
    "Nothing is due for review right now. Keep learning to build your deck.",
  sessionComplete: "Session complete",
  itemsReviewed: "items reviewed",
  accuracyAuto: "accuracy (auto-graded)",
  anotherRound: "Another round",
  done: "Done",
  cardXofY: "Card {n} of {total}",
  reviewSubtitle: "Spaced repetition across everything that’s due.",

  // Stats
  statsTitle: "Stats",
  statsSubtitle: "Your retention, streak, and where to focus next.",
  statsEmpty:
    "No review data yet. Learn a section and your stats will appear here.",
  streak: "Streak",
  days: "days",
  todayGoal: "Today",
  dueNow: "Due now",
  recallRate: "Recall rate",
  last100: "last 100 reviews",
  forecast7: "Due in the next 7 days",
  byFocus: "By focus area",
  byFocusHint: "Lower bars are weaker — drill those to level up faster.",
  drill: "Drill",
  activity14: "Activity (14 days)",
  leeches: "Sticking points",
  leechesHint:
    "Items you keep forgetting. Consider rephrasing them in the course JSON.",
  lapsesN: "{n} lapses",
  leechHint: "You’ve missed this several times — slow down and really nail it.",

  // Written
  yourAnswer: "Your answer",

  // Reminders
  remindTitle: "Time to review",
  remindBody: "You have {n} items due in Sahel.",

  // Settings
  settingsTitle: "Settings",
  settingsSubtitle:
    "Goals, reminders, and your data — all stored on this device.",
  dailyGoal: "Daily goal",
  dailyGoalHint: "How many reviews you aim to do each day.",
  cardsPerDay: "cards / day",
  reminders: "Review reminders",
  remindersHint:
    "Get a local notification when reviews are due (while the app is open).",
  notifDenied: "Notifications permission was not granted.",
  notifUnsupported: "This browser doesn’t support notifications.",
  notifBlocked: "Notifications are blocked in your browser settings.",
  installApp: "Install app",
  installHint:
    "Add Sahel to your home screen for an app-like, offline experience.",
  backupTitle: "Backup & restore",
  backupHint:
    "Your courses and progress live only in this browser. Export a backup to keep them safe.",
  backupDownload: "Download backup",
  backupRestore: "Restore from file",
  restoreOk: "Backup restored.",
  restoreFail: "Couldn’t read that backup file.",
  restoreReplaceConfirm:
    "Replace ALL current data with this backup? Click Cancel to merge instead.",
  dangerZone: "Danger zone",
  resetHint:
    "Permanently delete all courses, progress, and review history on this device.",
  resetAll: "Reset everything",
  resetConfirm: "Delete ALL local data? This cannot be undone.",
  resetOk: "All data cleared.",
} as const;

export type TranslationKey = keyof typeof EN;
type Key = TranslationKey;

const AR: Record<Key, string> = {
  appName: "سَهل",
  langToggle: "English",

  review: "مراجعة",
  importCourse: "استيراد كورس",
  library: "المكتبة",
  librarySubtitle: "كورساتك المستوردة، مرتّبة حسب الفئة.",
  loading: "جارٍ التحميل…",
  preview: "معاينة",
  zoomIn: "تكبير",
  zoomOut: "تصغير",
  resetZoom: "إعادة الحجم",
  diagram: "مخطط",
  diagramPreview: "معاينة المخطط",
  dragToMove: "اسحب المخطط بالماوس للتنقّل داخله.",

  noCoursesTitle: "لا توجد كورسات بعد",
  noCoursesBody: "استورد كورس JSON، أو حمّل النموذج لتتعرّف على التطبيق.",
  loadSample: "تحميل كورس نموذجي",

  section: "قسم",
  sections: "أقسام",
  sectionsHeading: "الأقسام",
  progress: "التقدّم",
  courseProgress: "تقدّم الكورس",
  reviewThisCourse: "مراجعة هذا الكورس",
  terms: "المصطلحات",
  termsTitle: "مصطلحات الكورس",
  termsFor: "المصطلحات الأساسية المستخدمة في «{title}».",
  noTerms: "لا يحتوي هذا الكورس على مصطلحات بعد.",
  export: "تصدير",
  delete: "حذف",
  blocks: "عناصر",
  questions: "أسئلة",
  start: "ابدأ",
  continue: "متابعة",
  revisit: "إعادة زيارة",
  courseNotFound: "الكورس غير موجود",
  backToLibrary: "العودة إلى المكتبة",
  backToCourse: "العودة إلى الكورس",
  deleteConfirm: "حذف «{title}» وكل تقدّمه وعناصر مراجعته؟",

  outline: "المخطّط",
  begin: "ابدأ",
  previous: "السابق",
  next: "التالي",
  sectionComplete: "اكتمل القسم",
  sectionCompleteBody: "أُنجز «{title}». أُضيفت الإجابات الخاطئة إلى مجموعة المراجعة.",
  nextSection: "القسم التالي",
  reviewNow: "راجِع الآن",
  sectionNotFound: "القسم غير موجود",

  mcqLabel: "اختيار من متعدّد",
  fillLabel: "املأ الفراغ",
  flashcardLabel: "بطاقة",
  writtenLabel: "إجابة مكتوبة",
  submit: "إرسال",
  check: "تحقّق",
  correct: "صحيح",
  notQuite: "ليست صحيحة تماماً",
  answerColon: "الإجابة:",
  typeBlank: "اكتب ما يملأ الفراغ…",
  showAnswer: "أظهر الإجابة",
  showModel: "أظهر الإجابة النموذجية",
  modelAnswer: "الإجابة النموذجية",
  front: "الوجه",
  back: "الظهر",
  writePlaceholder: "اكتب إجابتك، ثم أظهر الإجابة النموذجية لتقيّم نفسك…",

  recallPrompt: "ما مدى تذكّرك لهذا؟",
  matchPrompt: "ما مدى مطابقة إجابتك؟",
  again: "كرّر",
  hard: "صعب",
  good: "جيّد",
  easy: "سهل",

  focusWhy: "لماذا",
  focusHow: "كيف",
  focusWhen: "متى",
  focusWhat: "ماذا",
  focusSyntax: "الصياغة",

  importDesc:
    "الصق كورس JSON بالأسفل، أو ارفع ملف ‎.json. يُتحقّق منه قبل حفظ أي شيء.",
  importBtn: "استيراد",
  importing: "جارٍ الاستيراد…",
  uploadJson: "رفع ملف ‎.json",
  importProblems: "تعذّر الاستيراد — {count} {noun}:",
  problemOne: "مشكلة",
  problemMany: "مشاكل",
  invalidJson: "JSON غير صالح — {msg}",
  fileReadError: "تعذّرت قراءة الملف المحدّد.",
  close: "إغلاق",

  sampleLoaded: "تم تحميل الكورس النموذجي.",
  importedToast: "تم استيراد «{title}».",
  updatedToast: "تم تحديث «{title}».",

  importSection: "استيراد قسم",
  importSectionDesc:
    "الصق قسم JSON (أو مصفوفة أقسام) لإضافته إلى «{title}». القسم الذي يحمل مُعرّفاً موجوداً مسبقاً سيُستبدل. يُتحقّق منه قبل الحفظ.",
  noSectionFound: "لم يُعثر على قسم في هذا الـ JSON.",
  dupBlockIds: "معرّفات كتل مكرّرة (يجب أن تكون فريدة داخل الكورس): {ids}",
  sectionsMerged: "أُضيف {added}، وحُدّث {replaced} قسماً.",

  loadingReview: "جارٍ تحميل المراجعة…",
  allCaughtUp: "كل شيء مُنجز",
  allCaughtUpBody: "لا شيء مستحقّ للمراجعة الآن. تابع التعلّم لبناء مجموعتك.",
  sessionComplete: "انتهت الجلسة",
  itemsReviewed: "عنصراً تمت مراجعتها",
  accuracyAuto: "الدقّة (المصحّحة آلياً)",
  anotherRound: "جولة أخرى",
  done: "تم",
  cardXofY: "بطاقة {n} من {total}",
  reviewSubtitle: "تكرار متباعد لكل ما هو مستحقّ للمراجعة.",

  // Stats
  statsTitle: "الإحصائيات",
  statsSubtitle: "نسبة تذكّرك، وسلسلتك، وأين تركّز تالياً.",
  statsEmpty: "لا توجد بيانات مراجعة بعد. تعلّم قسماً وستظهر إحصائياتك هنا.",
  streak: "السلسلة",
  days: "يوم",
  todayGoal: "اليوم",
  dueNow: "مستحقّ الآن",
  recallRate: "نسبة التذكّر",
  last100: "آخر 100 مراجعة",
  forecast7: "المستحقّ خلال 7 أيام",
  byFocus: "حسب محور التركيز",
  byFocusHint: "الأشرطة الأقل تدلّ على نقاط ضعف — درّب عليها لتتقدّم أسرع.",
  drill: "تدرّب",
  activity14: "النشاط (14 يوماً)",
  leeches: "النقاط العالقة",
  leechesHint: "عناصر تنساها باستمرار. فكّر في إعادة صياغتها في ملف الكورس.",
  lapsesN: "{n} مرّات نسيان",
  leechHint: "أخطأت بهذا عدّة مرّات — تمهّل وأتقِنه جيداً.",

  // Written
  yourAnswer: "إجابتك",

  // Reminders
  remindTitle: "حان وقت المراجعة",
  remindBody: "لديك {n} عنصراً مستحقّاً في سَهل.",

  // Settings
  settingsTitle: "الإعدادات",
  settingsSubtitle: "الأهداف والتذكيرات وبياناتك — كلّها محفوظة على هذا الجهاز.",
  dailyGoal: "الهدف اليومي",
  dailyGoalHint: "كم مراجعة تستهدف يومياً.",
  cardsPerDay: "بطاقة / يوم",
  reminders: "تذكيرات المراجعة",
  remindersHint: "احصل على إشعار محلي عند استحقاق المراجعة (أثناء فتح التطبيق).",
  notifDenied: "لم يُمنح إذن الإشعارات.",
  notifUnsupported: "هذا المتصفّح لا يدعم الإشعارات.",
  notifBlocked: "الإشعارات محظورة في إعدادات متصفّحك.",
  installApp: "تثبيت التطبيق",
  installHint: "أضِف سَهل إلى شاشتك الرئيسية لتجربة شبيهة بالتطبيقات تعمل دون اتصال.",
  backupTitle: "النسخ الاحتياطي والاستعادة",
  backupHint:
    "كورساتك وتقدّمك محفوظة في هذا المتصفّح فقط. صدّر نسخة احتياطية للحفاظ عليها.",
  backupDownload: "تنزيل نسخة احتياطية",
  backupRestore: "استعادة من ملف",
  restoreOk: "تمت استعادة النسخة الاحتياطية.",
  restoreFail: "تعذّرت قراءة ملف النسخة الاحتياطية.",
  restoreReplaceConfirm:
    "استبدال كل البيانات الحالية بهذه النسخة؟ اضغط إلغاء للدمج بدلاً من ذلك.",
  dangerZone: "منطقة الخطر",
  resetHint: "حذف نهائي لكل الكورسات والتقدّم وسجلّ المراجعة على هذا الجهاز.",
  resetAll: "إعادة ضبط كل شيء",
  resetConfirm: "حذف كل البيانات المحلية؟ لا يمكن التراجع.",
  resetOk: "تم مسح كل البيانات.",
};

const DICT: Record<Lang, Record<Key, string>> = { en: EN, ar: AR };

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

export function translate(
  lang: Lang,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  return interpolate(DICT[lang][key] ?? DICT.en[key] ?? key, vars);
}

// ---- Context -------------------------------------------------------------

type LangContext = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<LangContext | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage (default English).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== "ar" && stored !== "en") return;

    const frame = window.requestAnimationFrame(() => setLangState(stored));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Keep <html> lang/dir and storage in sync.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((l) => (l === "en" ? "ar" : "en")),
    []
  );

  const t = useCallback(
    (key: Key, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang]
  );

  const value = useMemo<LangContext>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, toggle, t }),
    [lang, setLang, toggle, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within <LanguageProvider>");
  return ctx;
}

// ---- Content helpers -----------------------------------------------------

/** Pick the localized string for a content field, falling back to base. */
export function pick(lang: Lang, base: string, ar?: string): string {
  return lang === "ar" && ar ? ar : base;
}

/** Pick the localized array for a content field, falling back to base. */
export function pickArr(lang: Lang, base: string[], ar?: string[]): string[] {
  return lang === "ar" && ar && ar.length ? ar : base;
}
