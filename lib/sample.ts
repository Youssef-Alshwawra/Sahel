import type { Course } from "./schema";

/** Smoke-test course used by the "Load sample course" button on the empty home page.
 *  Authored bilingually (English base + Arabic `*Ar`) to demonstrate the toggle. */
export const sampleCourse: Course = {
  schemaVersion: 1,
  id: "laravel-eloquent-relationships",
  category: "IT",
  categoryAr: "تقنية المعلومات",
  title: "Laravel — Eloquent Relationships",
  titleAr: "لارافيل — علاقات Eloquent",
  language: "mixed",
  dir: "ltr",
  description: "Core Eloquent relationships and how to load them efficiently.",
  descriptionAr: "علاقات Eloquent الأساسية وكيفية تحميلها بكفاءة.",
  sections: [
    {
      id: "s1",
      title: "Relationship Types",
      titleAr: "أنواع العلاقات",
      outline: [
        "Why relationships exist",
        "one-to-one (hasOne / belongsTo)",
        "one-to-many (hasMany / belongsTo)",
        "many-to-many (belongsToMany + pivot)",
      ],
      outlineAr: [
        "لماذا توجد العلاقات",
        "واحد-لواحد (hasOne / belongsTo)",
        "واحد-لمتعدّد (hasMany / belongsTo)",
        "متعدّد-لمتعدّد (belongsToMany + جدول وسيط)",
      ],
      summary:
        "Eloquent maps table relationships to PHP methods so you can traverse related records as objects instead of writing manual joins.",
      summaryAr:
        "يربط Eloquent علاقات الجداول بدوال PHP لتتنقّل بين السجلات المرتبطة ككائنات بدل كتابة عمليات join يدوية.",
      blocks: [
        {
          type: "note",
          md: "## Why relationships\nInstead of manual joins, Eloquent exposes related rows as **methods** on your model. Calling the method returns a query builder; accessing it as a property returns the loaded result(s).",
          mdAr: "## لماذا العلاقات\nبدل عمليات join اليدوية، يكشف Eloquent الصفوف المرتبطة كـ**دوال** على الموديل. استدعاء الدالة يُعيد query builder؛ والوصول إليها كخاصية يُعيد النتيجة/النتائج المحمّلة.",
        },
        {
          type: "diagram",
          engine: "mermaid",
          code: "erDiagram\n  USER ||--o{ POST : has\n  POST }o--|| USER : belongsTo",
          caption: "A User has many Posts",
          captionAr: "المستخدم له منشورات كثيرة",
        },
        {
          type: "code",
          lang: "php",
          code: "class User extends Model {\n  public function posts() {\n    return $this->hasMany(Post::class);\n  }\n}",
          caption: "Defining one-to-many",
          captionAr: "تعريف علاقة واحد-لمتعدّد",
        },
        {
          type: "mcq",
          id: "s1-q0",
          question:
            "Why use Eloquent relationships instead of writing joins by hand?",
          questionAr: "لماذا نستخدم علاقات Eloquent بدل كتابة الـ joins يدوياً؟",
          options: [
            "They are always faster than raw SQL joins",
            "They let you traverse related records as objects and avoid repetitive join code",
            "They remove the need for a database",
            "They are required for migrations to run",
          ],
          optionsAr: [
            "لأنها دائماً أسرع من الـ joins الخام",
            "لأنها تتيح التنقّل بين السجلات المرتبطة ككائنات وتجنّب تكرار كود الـ join",
            "لأنها تُغني عن قاعدة البيانات",
            "لأنها مطلوبة كي تعمل الـ migrations",
          ],
          answer: 1,
          explain:
            "The value is expressiveness and reuse — related rows become object properties; under the hood it still issues SQL.",
          explainAr:
            "القيمة في التعبيرية وإعادة الاستخدام — تصبح الصفوف المرتبطة خصائص للكائن؛ وخلف الكواليس يبقى الأمر استعلامات SQL.",
          focus: "why",
        },
        {
          type: "mcq",
          id: "s1-q1",
          question: "Which method defines the inverse of hasMany?",
          questionAr: "أي دالة تُعرّف عكس hasMany؟",
          options: ["hasOne", "belongsTo", "belongsToMany", "morphMany"],
          answer: 1,
          explain: "The child references its single parent with belongsTo.",
          explainAr: "يشير الابن إلى أبيه الواحد باستخدام belongsTo.",
          focus: "how",
        },
        {
          type: "fill",
          id: "s1-f1",
          prompt: "Define a many-to-many between User and Role on the User model:",
          promptAr:
            "عرّف علاقة متعدّد-لمتعدّد بين User و Role على موديل User:",
          lang: "php",
          template: "return $this->____(Role::class);",
          answer: "belongsToMany",
          hints: ["plural; both sides own many of the other"],
          hintsAr: ["بصيغة الجمع؛ كل طرف يملك كثيراً من الآخر"],
          focus: "syntax",
        },
        {
          type: "flashcard",
          id: "s1-fc1",
          front: "What kind of table backs a many-to-many relationship?",
          frontAr: "ما نوع الجدول الذي يقف خلف علاقة متعدّد-لمتعدّد؟",
          back: "A pivot table holding both foreign keys.",
          backAr: "جدول وسيط (pivot) يحمل المفتاحين الأجنبيين.",
          focus: "what",
        },
        {
          type: "written",
          id: "s1-w1",
          question:
            "When would you choose many-to-many over one-to-many? Give an example.",
          questionAr:
            "متى تختار متعدّد-لمتعدّد بدل واحد-لمتعدّد؟ أعطِ مثالاً.",
          model:
            "When both sides can relate to many of the other — e.g. users and roles, or posts and tags. A pivot table stores the pairs.",
          modelAr:
            "عندما يرتبط كل طرف بكثير من الآخر — مثل المستخدمين والأدوار، أو المنشورات والوسوم. جدول وسيط يخزّن الأزواج.",
          focus: "when",
        },
      ],
    },
  ],
};
