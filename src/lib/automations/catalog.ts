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
    label: "Lead created",
    emoji: "✨",
    description: "Runs when a new lead is added (any channel).",
    config: [{ key: "source", label: "From source", type: "source" }],
  },
  {
    type: "trigger.stage_changed",
    category: "trigger",
    label: "Stage changed",
    emoji: "🔀",
    description: "Runs when a lead moves to a stage.",
    config: [{ key: "stage_id", label: "Moved to stage", type: "stage" }],
  },
  {
    type: "trigger.lead_assigned",
    category: "trigger",
    label: "Lead assigned",
    emoji: "🙋",
    description: "Runs when a lead is assigned to someone.",
    config: [],
  },

  // ---- Conditions ----
  {
    type: "condition.source_is",
    category: "condition",
    label: "Source is",
    emoji: "❓",
    description: "Continue only if the lead's source matches.",
    config: [{ key: "source", label: "Source", type: "source" }],
  },
  {
    type: "condition.value_gt",
    category: "condition",
    label: "Value greater than",
    emoji: "💰",
    description: "Continue only if the lead value exceeds an amount.",
    config: [{ key: "amount", label: "Amount", type: "number", placeholder: "1000" }],
  },
  {
    type: "condition.stage_is",
    category: "condition",
    label: "Stage is",
    emoji: "📍",
    description: "Continue only if the lead is in a stage.",
    config: [{ key: "stage_id", label: "Stage", type: "stage" }],
  },
  {
    type: "condition.field_equals",
    category: "condition",
    label: "Custom field equals",
    emoji: "🧩",
    description: "Continue only if a custom field matches a value.",
    config: [
      { key: "field", label: "Field", type: "field" },
      { key: "value", label: "Equals", type: "text" },
    ],
  },

  // ---- Actions (internal, executed for real) ----
  {
    type: "action.assign",
    category: "action",
    label: "Assign to member",
    emoji: "👤",
    description: "Assign the lead to a team member.",
    config: [{ key: "member", label: "Assignee", type: "member" }],
  },
  {
    type: "action.move_stage",
    category: "action",
    label: "Move to stage",
    emoji: "➡️",
    description: "Move the lead to a pipeline stage.",
    config: [{ key: "stage_id", label: "Stage", type: "stage" }],
  },
  {
    type: "action.add_note",
    category: "action",
    label: "Add note",
    emoji: "📝",
    description: "Log a note on the lead's timeline.",
    config: [{ key: "text", label: "Note", type: "textarea", placeholder: "Followed up automatically" }],
  },
  {
    type: "action.set_field",
    category: "action",
    label: "Set custom field",
    emoji: "✏️",
    description: "Set a custom field value on the lead.",
    config: [
      { key: "field", label: "Field", type: "field" },
      { key: "value", label: "Value", type: "text" },
    ],
  },

  // ---- Actions (external, require an integration — scaffolded) ----
  {
    type: "action.send_whatsapp",
    category: "action",
    label: "Send WhatsApp",
    emoji: "💬",
    description: "Send a WhatsApp message/template to the lead.",
    pendingIntegration: true,
    config: [{ key: "template", label: "Message / template", type: "textarea" }],
  },
  {
    type: "action.send_email",
    category: "action",
    label: "Send email",
    emoji: "📧",
    description: "Send an email to the lead.",
    pendingIntegration: true,
    config: [
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    type: "action.notify",
    category: "action",
    label: "Notify team",
    emoji: "🔔",
    description: "Send an internal notification (Slack/email/webhook).",
    pendingIntegration: true,
    config: [{ key: "message", label: "Message", type: "text" }],
  },
];

export const SPEC_BY_TYPE: Record<string, NodeSpec> = Object.fromEntries(
  NODE_SPECS.map((s) => [s.type, s])
);

export function specsByCategory(category: NodeCategory): NodeSpec[] {
  return NODE_SPECS.filter((s) => s.category === category);
}
