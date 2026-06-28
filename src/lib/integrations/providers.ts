// Catalog of external tools an organization can connect. Each provider lists
// the credentials needed to connect. Live OAuth requires registering an app
// with the vendor (Meta/Google) and approval; until then credentials can be
// entered manually here, and the connection state drives the rest of the app.

export interface CredentialField {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
}

export interface ProviderSpec {
  key: string;
  name: string;
  emoji: string;
  blurb: string;
  capabilities: string[];
  credentials: CredentialField[];
  /** Env var that, when set, enables a real OAuth flow (not required for now). */
  oauthEnv?: string;
  href?: string; // optional deep link after connecting (e.g. WhatsApp inbox)
}

export const PROVIDERS: ProviderSpec[] = [
  {
    key: "facebook",
    name: "Facebook Pages & Lead Ads",
    emoji: "📘",
    blurb: "סנכרון עמודים, חשבונות מודעות, וקליטת מודעות לידים באופן אוטומטי.",
    capabilities: [
      "גישה לעמוד ולחשבון מודעות",
      "ייבוא אוטומטי של מודעות לידים",
      "תובנות על קמפיינים",
    ],
    oauthEnv: "FACEBOOK_APP_ID",
    credentials: [
      { key: "page_id", label: "מזהה עמוד" },
      { key: "ad_account_id", label: "מזהה חשבון מודעות", placeholder: "act_123…" },
      { key: "access_token", label: "אסימון גישה", secret: true },
    ],
  },
  {
    key: "instagram",
    name: "Instagram",
    emoji: "📸",
    blurb: "חברו את חשבון העסק ב‑Instagram המקושר לעמוד שלכם.",
    capabilities: ["נתוני חשבון ומדיה", "קליטת לידים", "תובנות"],
    oauthEnv: "FACEBOOK_APP_ID",
    credentials: [
      { key: "ig_account_id", label: "מזהה חשבון Instagram" },
      { key: "access_token", label: "אסימון גישה", secret: true },
    ],
  },
  {
    key: "google_ads",
    name: "Google Ads",
    emoji: "🟢",
    blurb: "משיכת ביצועי קמפיינים ונתוני טפסי לידים מ‑Google Ads.",
    capabilities: ["מדדי קמפיין", "הרחבות טופס לידים", "הוצאה ו‑ROAS"],
    oauthEnv: "GOOGLE_CLIENT_ID",
    credentials: [
      { key: "customer_id", label: "מזהה לקוח", placeholder: "123-456-7890" },
      { key: "refresh_token", label: "אסימון רענון של OAuth", secret: true },
    ],
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    emoji: "💬",
    blurb: "צפייה ומענה להודעות WhatsApp בתוך ה‑CRM, כולל תבניות.",
    capabilities: ["תיבת הודעות מאוחדת", "מענה מתוך ה‑CRM", "תבניות הודעות"],
    oauthEnv: "WHATSAPP_TOKEN",
    href: "/inbox",
    credentials: [
      { key: "phone_number_id", label: "מזהה מספר טלפון" },
      { key: "access_token", label: "אסימון גישה", secret: true },
      { key: "verify_token", label: "אסימון אימות Webhook" },
    ],
  },
];

export const PROVIDER_BY_KEY: Record<string, ProviderSpec> = Object.fromEntries(
  PROVIDERS.map((p) => [p.key, p])
);
