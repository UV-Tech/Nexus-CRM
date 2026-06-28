// Data-driven catalog of automation nodes. This single source of truth powers
// the palette, the per-node config panel, and the execution engine (by `type`).

export type NodeCategory = "trigger" | "condition" | "action";

export type ConfigFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "source"   // static lead-source dropdown
  | "stage"    // dynamic: filled from the org's pipeline stages
  | "member"   // dynamic: filled from the org's members
  | "field";   // dynamic: filled from the org's custom field keys

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: string[];
  placeholder?: string;
}

export interface NodeSpec {
  type: string;
  category: NodeCategory;
  label: string;
  emoji: string;
  description: string;
  /** External actions need an integration; flagged so the UI/engine can note it. */
  pendingIntegration?: boolean;
  config: ConfigField[];
}

export const LEAD_SOURCES = [
  "any",
  "facebook",
  "instagram",
  "whatsapp",
  "webhook",
  "manual",
];

export const NODE_SPECS: NodeSpec[] = [
  // ---- Triggers ----
  {
    type: "trigger.lead_created",
    category: "trigger",
    label: "ליד נוצר",
    emoji: "✨",
    description: "רץ כאשר ליד חדש נוסף (מכל ערוץ).",
    config: [{ key: "source", label: "ממקור", type: "source" }],
  },
  {
    type: "trigger.stage_changed",
    category: "trigger",
    label: "שלב השתנה",
    emoji: "🔀",
    description: "רץ כאשר ליד עובר לשלב.",
    config: [{ key: "stage_id", label: "הועבר לשלב", type: "stage" }],
  },
  {
    type: "trigger.lead_assigned",
    category: "trigger",
    label: "ליד שויך",
    emoji: "🙋",
    description: "רץ כאשר ליד משויך למישהו.",
    config: [],
  },

  // ---- Conditions ----
  {
    type: "condition.source_is",
    category: "condition",
    label: "המקור הוא",
    emoji: "❓",
    description: "המשך רק אם מקור הליד תואם.",
    config: [{ key: "source", label: "מקור", type: "source" }],
  },
  {
    type: "condition.value_gt",
    category: "condition",
    label: "ערך גדול מ",
    emoji: "💰",
    description: "המשך רק אם ערך הליד עולה על סכום.",
    config: [{ key: "amount", label: "סכום", type: "number", placeholder: "1000" }],
  },
  {
    type: "condition.stage_is",
    category: "condition",
    label: "השלב הוא",
    emoji: "📍",
    description: "המשך רק אם הליד נמצא בשלב.",
    config: [{ key: "stage_id", label: "שלב", type: "stage" }],
  },
  {
    type: "condition.field_equals",
    category: "condition",
    label: "שדה מותאם שווה ל",
    emoji: "🧩",
    description: "המשך רק אם שדה מותאם תואם לערך.",
    config: [
      { key: "field", label: "שדה", type: "field" },
      { key: "value", label: "שווה ל", type: "text" },
    ],
  },

  // ---- Actions (internal, executed for real) ----
  {
    type: "action.assign",
    category: "action",
    label: "שיוך לחבר צוות",
    emoji: "👤",
    description: "שייך את הליד לחבר צוות.",
    config: [{ key: "member", label: "משויך ל", type: "member" }],
  },
  {
    type: "action.move_stage",
    category: "action",
    label: "העברה לשלב",
    emoji: "➡️",
    description: "העבר את הליד לשלב בצינור.",
    config: [{ key: "stage_id", label: "שלב", type: "stage" }],
  },
  {
    type: "action.add_note",
    category: "action",
    label: "הוספת הערה",
    emoji: "📝",
    description: "תעד הערה בציר הזמן של הליד.",
    config: [{ key: "text", label: "הערה", type: "textarea", placeholder: "בוצע מעקב אוטומטי" }],
  },
  {
    type: "action.set_field",
    category: "action",
    label: "עדכון שדה מותאם",
    emoji: "✏️",
    description: "עדכן ערך של שדה מותאם בליד.",
    config: [
      { key: "field", label: "שדה", type: "field" },
      { key: "value", label: "ערך", type: "text" },
    ],
  },

  // ---- Actions (external, require an integration — scaffolded) ----
  {
    type: "action.send_whatsapp",
    category: "action",
    label: "שליחת WhatsApp",
    emoji: "💬",
    description: "שלח הודעת WhatsApp / תבנית לליד.",
    pendingIntegration: true,
    config: [{ key: "template", label: "הודעה / תבנית", type: "textarea" }],
  },
  {
    type: "action.send_email",
    category: "action",
    label: "שליחת אימייל",
    emoji: "📧",
    description: "שלח אימייל לליד.",
    pendingIntegration: true,
    config: [
      { key: "subject", label: "נושא", type: "text" },
      { key: "body", label: "תוכן", type: "textarea" },
    ],
  },
  {
    type: "action.notify",
    category: "action",
    label: "התראה לצוות",
    emoji: "🔔",
    description: "שלח התראה פנימית (Slack/אימייל/webhook).",
    pendingIntegration: true,
    config: [{ key: "message", label: "הודעה", type: "text" }],
  },
];

export const SPEC_BY_TYPE: Record<string, NodeSpec> = Object.fromEntries(
  NODE_SPECS.map((s) => [s.type, s])
);

export function specsByCategory(category: NodeCategory): NodeSpec[] {
  return NODE_SPECS.filter((s) => s.category === category);
}
