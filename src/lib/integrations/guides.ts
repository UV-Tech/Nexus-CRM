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
      "עמוד Facebook לעסק",
      "הרשאת ניהול (Admin) לאותו עמוד",
      "חשבון Meta for Developers (חינמי)",
    ],
    steps: [
      {
        title: "צרו אפליקציית Meta",
        body: [
          "פתחו את Meta for Developers וצרו אפליקציה חדשה.",
          "בחרו בסוג אפליקציה ״Business״, תנו לה שם וצרו אותה.",
        ],
        link: { label: "פתחו את developers.facebook.com", url: "https://developers.facebook.com/apps" },
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
        title: "העתיקו את ה-App ID וה-App Secret",
        body: [
          "באפליקציה, עברו אל Settings → Basic.",
          "העתיקו את ה-App ID ואת ה-App Secret (לחצו על ״Show״).",
        ],
        link: { label: "הגדרות האפליקציה", url: "https://developers.facebook.com/apps" },
        pasteInto: "אסימון גישה / פרטי האפליקציה",
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
        title: "מצאו את ה-Page ID",
        body: [
          "פתחו את Business Settings → Accounts → Pages ובחרו את העמוד שלכם.",
          "העתיקו את ה-Page ID המוצג מתחת לשם העמוד.",
        ],
        link: { label: "פתחו את Business Settings", url: "https://business.facebook.com/settings/pages" },
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
        title: "צרו אסימון גישה לעמוד (Page access token)",
        body: [
          "ב-Business Settings → Users → System users, הוסיפו משתמש מערכת (system user).",
          "שייכו את העמוד שלכם, ואז לחצו ״Generate token״ עם ההרשאות:",
          "• pages_show_list  • leads_retrieval  • pages_manage_metadata",
          "העתיקו את האסימון שנוצר (לא תוכלו לראות אותו שוב).",
        ],
        link: { label: "System users", url: "https://business.facebook.com/settings/system-users" },
        pasteInto: "אסימון גישה",
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
        title: "הירשמו לקבלת Lead Ads ב-webhook שלכם",
        body: [
          "באפליקציה → Webhooks → Page, הירשמו לשדה ״leadgen״.",
          "השתמשו ב-Callback URL שלמטה; עבור ״Verify Token״ הדביקו את הערך",
          "מהשלב הבא. כך לידים חדשים מ-Lead Ads יגיעו ישירות ל-CRM שלכם.",
        ],
        copyValue: { label: "Callback URL (הדביקו ב-Meta)", key: "leadsWebhook" },
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
        title: "הדביקו הכול בטופס החיבור",
        body: [
          "חזרו ל-CRM, פתחו את טופס החיבור והדביקו את ה-Page ID, את",
          "מזהה חשבון המודעות (אופציונלי), ואת אסימון הגישה. שמרו — והכול פעיל.",
          "אפשר לשנות או להדביק מחדש את הערכים בכל עת; שום דבר אינו סופי.",
        ],
        copyValue: { label: "פתחו את טופס החיבור", key: "connectUrl" },
      },
    ],
  },

  // --------------------------------------------------------------- Instagram
  instagram: {
    estMinutes: 12,
    needs: [
      "חשבון Instagram מסוג מקצועי (עסקי)",
      "עמוד Facebook המקושר לאותו חשבון Instagram",
      "אפליקציית Meta for Developers (אותה אחת כמו ב-Facebook)",
    ],
    steps: [
      {
        title: "קשרו את Instagram לעמוד שלכם",
        body: [
          "ב-Business Settings → Accounts → Instagram accounts, חברו את",
          "חשבון ה-Instagram המקצועי שלכם וקשרו אותו לעמוד ה-Facebook שלכם.",
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
        title: "העתיקו את מזהה חשבון ה-Instagram",
        body: [
          "פתחו את Graph API Explorer ושלחו בקשה:",
          "  me/accounts?fields=instagram_business_account",
          "העתיקו את ה-id של instagram_business_account מתוך התשובה.",
        ],
        link: { label: "פתחו את Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" },
        pasteInto: "מזהה חשבון Instagram",
        illustration: {
          vendor: "Graph API Explorer",
          screen: "GET me/accounts?fields=instagram_business_account",
          fields: [
            { label: "instagram_business_account.id", sample: "17841400000000000", highlight: true },
          ],
        },
      },
      {
        title: "קבלו אסימון גישה",
        body: [
          "ב-Graph API Explorer, צרו אסימון עם instagram_basic ו-",
          "pages_show_list. העתיקו אותו (השתמשו באסימון System User לאסימון ארוך-טווח).",
        ],
        link: { label: "Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" },
        pasteInto: "אסימון גישה",
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
        title: "הדביקו בטופס החיבור",
        body: [
          "בטופס החיבור של ה-CRM, הדביקו את מזהה חשבון ה-Instagram ואת",
          "אסימון הגישה, ואז שמרו.",
        ],
        copyValue: { label: "פתחו את טופס החיבור", key: "connectUrl" },
      },
    ],
  },

  // -------------------------------------------------------------- Google Ads
  google_ads: {
    estMinutes: 20,
    needs: [
      "חשבון Google Ads (עם Customer ID)",
      "פרויקט Google Cloud",
      "אסימון מפתח מאושר ל-Google Ads API (מתוך ה-API Center)",
    ],
    steps: [
      {
        title: "מצאו את ה-Customer ID שלכם",
        body: [
          "ב-Google Ads, ה-Customer ID בן 10 הספרות מופיע בפינה הימנית-עליונה,",
          "בפורמט 123-456-7890. העתיקו אותו (ספרות בלבד זה בסדר גמור).",
        ],
        link: { label: "פתחו את Google Ads", url: "https://ads.google.com" },
        pasteInto: "Customer ID",
        illustration: {
          vendor: "Google Ads",
          screen: "Top-right account picker",
          fields: [{ label: "Customer ID", sample: "123-456-7890", highlight: true }],
        },
      },
      {
        title: "בקשו אסימון מפתח (developer token)",
        body: [
          "ב-Google Ads → Tools → API Center, בקשו אסימון מפתח.",
          "הרשאת Basic מספיקה כדי להתחיל. העתיקו את האסימון.",
        ],
        link: { label: "Google Ads API Center", url: "https://ads.google.com/aw/apicenter" },
        illustration: {
          vendor: "Google Ads",
          screen: "Tools › API Center",
          fields: [{ label: "Developer token", sample: "abcdEFGH1234", highlight: true }],
        },
      },
      {
        title: "צרו OAuth client",
        body: [
          "ב-Google Cloud Console → APIs & Services → Credentials, צרו",
          "OAuth client ID (סוג: Web application). העתיקו את ה-Client ID ואת",
          "ה-Client Secret. הוסיפו את ה-redirect URI שלמטה כ-redirect מאושר.",
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
        title: "צרו refresh token",
        body: [
          "השתמשו ב-OAuth 2.0 Playground (אייקון גלגל השיניים → use your own client",
          "credentials) ואשרו את ה-scope של Google Ads API:",
          "  https://www.googleapis.com/auth/adwords",
          "החליפו את הקוד והעתיקו את ה-refresh token.",
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
        title: "הדביקו בטופס החיבור",
        body: [
          "בטופס החיבור של ה-CRM, הדביקו את ה-Customer ID ואת ה-refresh",
          "token, ואז שמרו.",
        ],
        copyValue: { label: "פתחו את טופס החיבור", key: "connectUrl" },
      },
    ],
  },

  // ---------------------------------------------------------------- WhatsApp
  whatsapp: {
    estMinutes: 15,
    needs: [
      "אפליקציית Meta for Developers (סוג Business)",
      "מספר טלפון של WhatsApp Business",
      "הרשאת ניהול (Admin) לחשבון Meta Business",
    ],
    steps: [
      {
        title: "הוסיפו את מוצר WhatsApp",
        body: [
          "בלוח הבקרה של אפליקציית ה-Meta שלכם, לחצו על ״Add product״ והוסיפו את WhatsApp.",
          "עקבו אחר ההגדרה כדי לצרף את חשבון ה-WhatsApp Business שלכם.",
        ],
        link: { label: "פתחו את אפליקציית ה-Meta שלכם", url: "https://developers.facebook.com/apps" },
        illustration: {
          vendor: "Meta for Developers",
          screen: "Dashboard › Add product › WhatsApp",
          fields: [{ label: "Product", sample: "WhatsApp" }],
        },
      },
      {
        title: "העתיקו את ה-Phone number ID",
        body: [
          "פתחו את WhatsApp → API Setup. העתיקו את ה-Phone number ID (לא את מספר",
          "הטלפון עצמו) ואת אסימון הגישה הזמני המוצג שם.",
          "לסביבת production, צרו System User לאסימון קבוע.",
        ],
        link: { label: "WhatsApp API Setup", url: "https://developers.facebook.com/apps" },
        pasteInto: "Phone number ID + אסימון גישה",
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
        title: "בחרו אסימון אימות (verify token)",
        body: [
          "בחרו מחרוזת סודית כלשהי — תשתמשו בה בשני מקומות: בהגדרת ה-webhook",
          "של Meta ובטופס החיבור של ה-CRM. השתמשו בערך המוצע שלמטה (או",
          "בערך משלכם), והקפידו שיהיה זהה בשני המקומות.",
        ],
        copyValue: { label: "אסימון אימות מוצע", key: "verifyToken" },
        pasteInto: "אסימון אימות ל-webhook",
        illustration: {
          vendor: "לבחירתכם",
          screen: "סוד משותף",
          fields: [{ label: "Verify token", sample: "nexus-………", highlight: true }],
        },
      },
      {
        title: "הגדירו את ה-webhook ב-Meta",
        body: [
          "ב-WhatsApp → Configuration → Webhooks, הזינו את ה-Callback URL שלמטה",
          "ואת ה-Verify token מהשלב הקודם, ואז לחצו על Verify.",
          "הירשמו לשדה ״messages״ כדי שתגובות יגיעו לתיבת הדואר הנכנס שלכם.",
        ],
        copyValue: { label: "Callback URL (הדביקו ב-Meta)", key: "whatsappWebhook" },
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
        title: "הדביקו בטופס החיבור",
        body: [
          "בטופס החיבור של ה-CRM, הדביקו את ה-Phone number ID, אסימון הגישה ואת",
          "אותו אסימון אימות. שמרו — ואז פתחו את תיבת הדואר הנכנס של WhatsApp כדי להתכתב.",
        ],
        copyValue: { label: "פתחו את טופס החיבור", key: "connectUrl" },
      },
    ],
  },
};
