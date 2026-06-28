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
    blurb: "Sync Pages, ad accounts, and capture Lead Ads automatically.",
    capabilities: [
      "Page & ad account access",
      "Auto-import Lead Ads",
      "Insights on campaigns",
    ],
    oauthEnv: "FACEBOOK_APP_ID",
    credentials: [
      { key: "page_id", label: "Page ID" },
      { key: "ad_account_id", label: "Ad account ID", placeholder: "act_123…" },
      { key: "access_token", label: "Access token", secret: true },
    ],
  },
  {
    key: "instagram",
    name: "Instagram",
    emoji: "📸",
    blurb: "Connect an Instagram business account linked to your Page.",
    capabilities: ["Account & media data", "Lead capture", "Insights"],
    oauthEnv: "FACEBOOK_APP_ID",
    credentials: [
      { key: "ig_account_id", label: "Instagram account ID" },
      { key: "access_token", label: "Access token", secret: true },
    ],
  },
  {
    key: "google_ads",
    name: "Google Ads",
    emoji: "🟢",
    blurb: "Pull campaign performance and lead-form data from Google Ads.",
    capabilities: ["Campaign metrics", "Lead form extensions", "Spend & ROAS"],
    oauthEnv: "GOOGLE_CLIENT_ID",
    credentials: [
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" },
      { key: "refresh_token", label: "OAuth refresh token", secret: true },
    ],
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    emoji: "💬",
    blurb: "See and reply to WhatsApp messages inside the CRM, with templates.",
    capabilities: ["Unified inbox", "Reply from the CRM", "Message templates"],
    oauthEnv: "WHATSAPP_TOKEN",
    href: "/inbox",
    credentials: [
      { key: "phone_number_id", label: "Phone number ID" },
      { key: "access_token", label: "Access token", secret: true },
      { key: "verify_token", label: "Webhook verify token" },
    ],
  },
];

export const PROVIDER_BY_KEY: Record<string, ProviderSpec> = Object.fromEntries(
  PROVIDERS.map((p) => [p.key, p])
);
