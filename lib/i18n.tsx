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

  noCoursesTitle: "No courses yet",
  noCoursesBody: "Import a course JSON, or load the sample to take a look around.",
  loadSample: "Load sample course",

  section: "section",
  sections: "sections",
  sectionsHeading: "Sections",
  progress: "Progress",
  courseProgress: "Course progress",
  reviewThisCourse: "Review this course",
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
} as const;

type Key = keyof typeof EN;

const AR: Record<Key, string> = {
  appName: "ساحل",
  langToggle: "English",

  review: "مراجعة",
  importCourse: "استيراد كورس",
  library: "المكتبة",
  librarySubtitle: "كورساتك المستوردة، مرتّبة حسب الفئة.",
  loading: "جارٍ التحميل…",

  noCoursesTitle: "لا توجد كورسات بعد",
  noCoursesBody: "استورد كورس JSON، أو حمّل النموذج لتتعرّف على التطبيق.",
  loadSample: "تحميل كورس نموذجي",

  section: "قسم",
  sections: "أقسام",
  sectionsHeading: "الأقسام",
  progress: "التقدّم",
  courseProgress: "تقدّم الكورس",
  reviewThisCourse: "مراجعة هذا الكورس",
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
};

const DICT: Record<Lang, Record<Key, string>> = { en: EN, ar: AR };

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
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
    if (stored === "ar" || stored === "en") setLangState(stored);
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
      interpolate(DICT[lang][key] ?? DICT.en[key] ?? key, vars),
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
