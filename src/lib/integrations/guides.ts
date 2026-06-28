// Step-by-step connection guides per provider. Content is illustrative — each
// step links to the real vendor console and shows exactly which value to copy
// and where to paste it in our Connect form. Dynamic values (webhook URLs,
// suggested verify token) are resolved at render time and referenced by key.

export type DynamicValueKey =
  | "leadsWebhook"
  | "whatsappWebhook"
  | "verifyToken"
  | "connectUrl";

export interface MockField {
  label: string;
  sample: string;
  highlight?: boolean; // the value to copy in this step
}

export interface Illustration {
  vendor: string; // header label of the mocked console
  screen: string; // breadcrumb / screen name
  fields: MockField[];
}

export interface GuideStep {
  title: string;
  body: string[]; // paragraphs / bullet lines
  link?: { label: string; url: string };
  // A dynamic value (e.g. the webhook URL) the user must copy FROM our app.
  copyValue?: { label: string; key: DynamicValueKey };
  // Which field in our Connect form this step's value goes into.
  pasteInto?: string;
  illustration?: Illustration;
}

export interface ProviderGuide {
  estMinutes: number;
  needs: string[];
  steps: GuideStep[];
}

export const GUIDES: Record<string, ProviderGuide> = {
  // ---------------------------------------------------------------- Facebook
  facebook: {
    estMinutes: 15,
    needs: [
      "A Facebook Page for the business",
      "Admin access to that Page",
      "A (free) Meta for Developers account",
    ],
    steps: [
      {
        title: "Create a Meta app",
        body: [
          "Open Meta for Developers and create a new app.",
          "Choose the “Business” app type, give it a name, and create it.",
        ],
        link: { label: "Open developers.facebook.com", url: "https://developers.facebook.com/apps" },
        illustration: {
          vendor: "Meta for Developers",
          screen: "My Apps › Create App",
          fields: [
            { label: "App type", sample: "Business" },
            { label: "App name", sample: "Acme CRM" },
          ],
        },
      },
      {
        title: "Copy your App ID and App Secret",
        body: [
          "In the app, go to Settings → Basic.",
          "Copy the App ID and the App Secret (click “Show”).",
        ],
        link: { label: "App settings", url: "https://developers.facebook.com/apps" },
        pasteInto: "Access token / app credentials",
        illustration: {
          vendor: "Meta for Developers",
          screen: "Settings › Basic",
          fields: [
            { label: "App ID", sample: "1234567890", highlight: true },
            { label: "App Secret", sample: "••••••••••••  Show", highlight: true },
          ],
        },
      },
      {
        title: "Find your Page ID",
        body: [
          "Open Business Settings → Accounts → Pages, select your Page.",
          "Copy the Page ID shown under the page name.",
        ],
        link: { label: "Open Business Settings", url: "https://business.facebook.com/settings/pages" },
        pasteInto: "Page ID",
        illustration: {
          vendor: "Meta Business Settings",
          screen: "Accounts › Pages",
          fields: [
            { label: "Page name", sample: "Acme Inc." },
            { label: "Page ID", sample: "102938475610", highlight: true },
          ],
        },
      },
      {
        title: "Generate a Page access token",
        body: [
          "In Business Settings → Users → System users, add a system user.",
          "Assign your Page, then “Generate token” with the permissions:",
          "• pages_show_list  • leads_retrieval  • pages_manage_metadata",
          "Copy the generated token (you won’t see it again).",
        ],
        link: { label: "System users", url: "https://business.facebook.com/settings/system-users" },
        pasteInto: "Access token",
        illustration: {
          vendor: "Meta Business Settings",
          screen: "Users › System users › Generate token",
          fields: [
            { label: "Permissions", sample: "leads_retrieval, pages_show_list" },
            { label: "Access token", sample: "EAAB…long token…", highlight: true },
          ],
        },
      },
      {
        title: "Subscribe Lead Ads to your webhook",
        body: [
          "In the app → Webhooks → Page, subscribe to the “leadgen” field.",
          "Use the Callback URL below; for “Verify Token” paste the value from",
          "the next step. This delivers new Lead Ads straight into your CRM.",
        ],
        copyValue: { label: "Callback URL (paste in Meta)", key: "leadsWebhook" },
        illustration: {
          vendor: "Meta for Developers",
          screen: "Webhooks › Page › leadgen",
          fields: [
            { label: "Callback URL", sample: "https://your-app/api/webhooks/leads?token=…", highlight: true },
            { label: "Subscribe to", sample: "leadgen" },
          ],
        },
      },
      {
        title: "Paste everything into Connect",
        body: [
          "Back in the CRM, open the Connect form and paste the Page ID, the",
          "ad account ID (optional), and the Access token. Save — you’re live.",
          "You can change or re-paste these anytime; nothing is final.",
        ],
        copyValue: { label: "Open the Connect form", key: "connectUrl" },
      },
    ],
  },

  // --------------------------------------------------------------- Instagram
  instagram: {
    estMinutes: 12,
    needs: [
      "An Instagram professional (business) account",
      "A Facebook Page linked to that Instagram account",
      "A Meta for Developers app (same as Facebook)",
    ],
    steps: [
      {
        title: "Link Instagram to your Page",
        body: [
          "In Business Settings → Accounts → Instagram accounts, connect your",
          "Instagram professional account and link it to your Facebook Page.",
        ],
        link: { label: "Business Settings → Instagram", url: "https://business.facebook.com/settings/instagram-account-v2" },
        illustration: {
          vendor: "Meta Business Settings",
          screen: "Accounts › Instagram accounts",
          fields: [
            { label: "Instagram", sample: "@acme" },
            { label: "Linked Page", sample: "Acme Inc." },
          ],
        },
      },
      {
        title: "Copy your Instagram account ID",
        body: [
          "Open the Graph API Explorer and request:",
          "  me/accounts?fields=instagram_business_account",
          "Copy the instagram_business_account id from the response.",
        ],
        link: { label: "Open Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" },
        pasteInto: "Instagram account ID",
        illustration: {
          vendor: "Graph API Explorer",
          screen: "GET me/accounts?fields=instagram_business_account",
          fields: [
            { label: "instagram_business_account.id", sample: "17841400000000000", highlight: true },
          ],
        },
      },
      {
        title: "Get an access token",
        body: [
          "In the Graph API Explorer, generate a token with instagram_basic and",
          "pages_show_list. Copy it (use a System User token for a long-lived one).",
        ],
        link: { label: "Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" },
        pasteInto: "Access token",
        illustration: {
          vendor: "Graph API Explorer",
          screen: "Generate access token",
          fields: [
            { label: "Permissions", sample: "instagram_basic, pages_show_list" },
            { label: "Access token", sample: "EAAB…token…", highlight: true },
          ],
        },
      },
      {
        title: "Paste into Connect",
        body: [
          "In the CRM Connect form, paste the Instagram account ID and the",
          "Access token, then Save.",
        ],
        copyValue: { label: "Open the Connect form", key: "connectUrl" },
      },
    ],
  },

  // -------------------------------------------------------------- Google Ads
  google_ads: {
    estMinutes: 20,
    needs: [
      "A Google Ads account (with a Customer ID)",
      "A Google Cloud project",
      "An approved Google Ads API developer token (from the API Center)",
    ],
    steps: [
      {
        title: "Find your Customer ID",
        body: [
          "In Google Ads, your 10-digit Customer ID is at the top-right,",
          "shown as 123-456-7890. Copy it (digits only is fine).",
        ],
        link: { label: "Open Google Ads", url: "https://ads.google.com" },
        pasteInto: "Customer ID",
        illustration: {
          vendor: "Google Ads",
          screen: "Top-right account picker",
          fields: [{ label: "Customer ID", sample: "123-456-7890", highlight: true }],
        },
      },
      {
        title: "Request a developer token",
        body: [
          "In Google Ads → Tools → API Center, request a developer token.",
          "Basic access is enough to start. Copy the token.",
        ],
        link: { label: "Google Ads API Center", url: "https://ads.google.com/aw/apicenter" },
        illustration: {
          vendor: "Google Ads",
          screen: "Tools › API Center",
          fields: [{ label: "Developer token", sample: "abcdEFGH1234", highlight: true }],
        },
      },
      {
        title: "Create an OAuth client",
        body: [
          "In Google Cloud Console → APIs & Services → Credentials, create an",
          "OAuth client ID (type: Web application). Copy the Client ID and",
          "Client Secret. Add the redirect URI below as an authorized redirect.",
        ],
        link: { label: "Google Cloud Credentials", url: "https://console.cloud.google.com/apis/credentials" },
        copyValue: { label: "Authorized redirect URI", key: "connectUrl" },
        illustration: {
          vendor: "Google Cloud Console",
          screen: "APIs & Services › Credentials › OAuth client ID",
          fields: [
            { label: "Client ID", sample: "1234-abc.apps.googleusercontent.com", highlight: true },
            { label: "Client secret", sample: "GOCSPX-••••••", highlight: true },
          ],
        },
      },
      {
        title: "Generate a refresh token",
        body: [
          "Use the OAuth 2.0 Playground (gear icon → use your own client",
          "credentials) and authorize the Google Ads API scope:",
          "  https://www.googleapis.com/auth/adwords",
          "Exchange the code and copy the refresh token.",
        ],
        link: { label: "OAuth 2.0 Playground", url: "https://developers.google.com/oauthplayground" },
        pasteInto: "OAuth refresh token",
        illustration: {
          vendor: "OAuth 2.0 Playground",
          screen: "Step 2 › Exchange authorization code",
          fields: [{ label: "Refresh token", sample: "1//0g…long…", highlight: true }],
        },
      },
      {
        title: "Paste into Connect",
        body: [
          "In the CRM Connect form, paste your Customer ID and the refresh",
          "token, then Save.",
        ],
        copyValue: { label: "Open the Connect form", key: "connectUrl" },
      },
    ],
  },

  // ---------------------------------------------------------------- WhatsApp
  whatsapp: {
    estMinutes: 15,
    needs: [
      "A Meta for Developers app (Business type)",
      "A WhatsApp Business phone number",
      "Admin access to the Meta Business account",
    ],
    steps: [
      {
        title: "Add the WhatsApp product",
        body: [
          "In your Meta app dashboard, click “Add product” and add WhatsApp.",
          "Follow the setup to attach your WhatsApp Business account.",
        ],
        link: { label: "Open your Meta app", url: "https://developers.facebook.com/apps" },
        illustration: {
          vendor: "Meta for Developers",
          screen: "Dashboard › Add product › WhatsApp",
          fields: [{ label: "Product", sample: "WhatsApp" }],
        },
      },
      {
        title: "Copy the Phone number ID",
        body: [
          "Open WhatsApp → API Setup. Copy the Phone number ID (not the phone",
          "number itself) and a temporary Access token shown there.",
          "For production, create a System User for a permanent token.",
        ],
        link: { label: "WhatsApp API Setup", url: "https://developers.facebook.com/apps" },
        pasteInto: "Phone number ID + Access token",
        illustration: {
          vendor: "Meta for Developers",
          screen: "WhatsApp › API Setup",
          fields: [
            { label: "Phone number ID", sample: "109876543210000", highlight: true },
            { label: "Temporary access token", sample: "EAAG…token…", highlight: true },
          ],
        },
      },
      {
        title: "Choose a verify token",
        body: [
          "Pick any secret string — you’ll use it in two places: Meta’s webhook",
          "config and the CRM Connect form. Use the suggested value below (or",
          "your own), and keep it identical in both.",
        ],
        copyValue: { label: "Suggested verify token", key: "verifyToken" },
        pasteInto: "Webhook verify token",
        illustration: {
          vendor: "Your choice",
          screen: "A shared secret",
          fields: [{ label: "Verify token", sample: "nexus-………", highlight: true }],
        },
      },
      {
        title: "Configure the webhook in Meta",
        body: [
          "In WhatsApp → Configuration → Webhooks, set the Callback URL below",
          "and the Verify token from the previous step, then click Verify.",
          "Subscribe to the “messages” field so replies reach your inbox.",
        ],
        copyValue: { label: "Callback URL (paste in Meta)", key: "whatsappWebhook" },
        illustration: {
          vendor: "Meta for Developers",
          screen: "WhatsApp › Configuration › Webhooks",
          fields: [
            { label: "Callback URL", sample: "https://your-app/api/webhooks/whatsapp?token=…", highlight: true },
            { label: "Verify token", sample: "nexus-………" },
            { label: "Subscribe to", sample: "messages" },
          ],
        },
      },
      {
        title: "Paste into Connect",
        body: [
          "In the CRM Connect form, paste the Phone number ID, Access token and",
          "the same verify token. Save — then open the WhatsApp inbox to chat.",
        ],
        copyValue: { label: "Open the Connect form", key: "connectUrl" },
      },
    ],
  },
};
