// Suggested setup per business type. Everything here is a starting point the
// owner can edit, extend, or skip — and change later in Settings.

export interface StagePreset {
  name: string;
  color: string;
  isWon?: boolean;
  isLost?: boolean;
}

export interface FieldPreset {
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  options?: string[];
}

export interface OnboardingPayload {
  businessType: string;
  stages: StagePreset[];
  fields: FieldPreset[];
  invites: { email: string; role: string }[];
}

export interface BusinessTypePreset {
  key: string;
  label: string;
  emoji: string;
  description: string;
  stages: StagePreset[];
  fields: FieldPreset[];
}

const WON: StagePreset = { name: "נסגר בהצלחה", color: "#22c55e", isWon: true };
const LOST: StagePreset = { name: "אבוד", color: "#ef4444", isLost: true };

export const BUSINESS_TYPES: BusinessTypePreset[] = [
  {
    key: "real_estate",
    label: "נדל״ן",
    emoji: "🏠",
    description: "סוכנים, מתווכים, מנהלי נכסים",
    stages: [
      { name: "פנייה חדשה", color: "#6366f1" },
      { name: "צפייה נקבעה", color: "#0ea5e9" },
      { name: "הוגשה הצעה", color: "#f59e0b" },
      { name: "בחוזה", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "תקציב", type: "number" },
      { label: "סוג נכס", type: "select", options: ["דירה", "בית", "מסחרי", "קרקע"] },
      { label: "אזור מועדף", type: "text" },
      { label: "מימון מאושר", type: "checkbox" },
    ],
  },
  {
    key: "ecommerce",
    label: "מסחר אלקטרוני",
    emoji: "🛍️",
    description: "חנויות מקוונות ומותגי DTC",
    stages: [
      { name: "ליד חדש", color: "#6366f1" },
      { name: "מתעניין", color: "#0ea5e9" },
      { name: "עגלה / הצעת מחיר", color: "#f59e0b" },
      { name: "שולם", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "מוצר מעניין", type: "text" },
      { label: "שווי הזמנה", type: "number" },
      { label: "ערוץ", type: "select", options: ["Instagram", "Facebook", "WhatsApp", "אתר"] },
      { label: "לקוח חוזר", type: "checkbox" },
    ],
  },
  {
    key: "services",
    label: "שירותים מקצועיים",
    emoji: "💼",
    description: "יועצים, מרפאות, משפטים, פיננסים",
    stages: [
      { name: "ליד חדש", color: "#6366f1" },
      { name: "ייעוץ", color: "#0ea5e9" },
      { name: "נשלחה הצעת מחיר", color: "#f59e0b" },
      { name: "משא ומתן", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "שירות נדרש", type: "text" },
      { label: "תקציב משוער", type: "number" },
      { label: "תאריך מועדף", type: "date" },
      { label: "דחיפות", type: "select", options: ["נמוכה", "בינונית", "גבוהה"] },
    ],
  },
  {
    key: "agency",
    label: "סוכנות / שיווק",
    emoji: "📈",
    description: "סוכנויות שיווק, עיצוב ופיתוח",
    stages: [
      { name: "ליד חדש", color: "#6366f1" },
      { name: "שיחת היכרות", color: "#0ea5e9" },
      { name: "הצעת מחיר", color: "#f59e0b" },
      { name: "חוזה", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "סוג פרויקט", type: "text" },
      { label: "ריטיינר חודשי", type: "number" },
      { label: "מקור הליד", type: "select", options: ["הפניה", "פרסום", "פנייה יזומה", "פנייה נכנסת"] },
    ],
  },
  {
    key: "hospitality",
    label: "מסעדנות / אירוח",
    emoji: "🍽️",
    description: "אירועים, קייטרינג, אולמות",
    stages: [
      { name: "פנייה", color: "#6366f1" },
      { name: "נשלחה הצעת מחיר", color: "#0ea5e9" },
      { name: "טעימה / ביקור", color: "#f59e0b" },
      { name: "הוזמן", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "תאריך האירוע", type: "date" },
      { label: "מספר אורחים", type: "number" },
      { label: "סוג אירוע", type: "select", options: ["חתונה", "אירוע עסקי", "אירוע פרטי", "אחר"] },
    ],
  },
  {
    key: "other",
    label: "משהו אחר",
    emoji: "✨",
    description: "התחלה מצינור פשוט ונקי",
    stages: [
      { name: "חדש", color: "#6366f1" },
      { name: "נוצר קשר", color: "#0ea5e9" },
      { name: "מוסמך", color: "#f59e0b" },
      { name: "הצעת מחיר", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [],
  },
];
