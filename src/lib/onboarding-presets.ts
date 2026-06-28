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

const WON: StagePreset = { name: "Won", color: "#22c55e", isWon: true };
const LOST: StagePreset = { name: "Lost", color: "#ef4444", isLost: true };

export const BUSINESS_TYPES: BusinessTypePreset[] = [
  {
    key: "real_estate",
    label: "Real Estate",
    emoji: "🏠",
    description: "Agents, brokers, property managers",
    stages: [
      { name: "New inquiry", color: "#6366f1" },
      { name: "Viewing scheduled", color: "#0ea5e9" },
      { name: "Offer made", color: "#f59e0b" },
      { name: "Under contract", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "Budget", type: "number" },
      { label: "Property type", type: "select", options: ["Apartment", "House", "Commercial", "Land"] },
      { label: "Preferred area", type: "text" },
      { label: "Financing approved", type: "checkbox" },
    ],
  },
  {
    key: "ecommerce",
    label: "E-commerce",
    emoji: "🛍️",
    description: "Online stores and DTC brands",
    stages: [
      { name: "New lead", color: "#6366f1" },
      { name: "Engaged", color: "#0ea5e9" },
      { name: "Cart / quote", color: "#f59e0b" },
      { name: "Paid", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "Product interest", type: "text" },
      { label: "Order value", type: "number" },
      { label: "Channel", type: "select", options: ["Instagram", "Facebook", "WhatsApp", "Website"] },
      { label: "Returning customer", type: "checkbox" },
    ],
  },
  {
    key: "services",
    label: "Professional Services",
    emoji: "💼",
    description: "Consultants, clinics, legal, finance",
    stages: [
      { name: "New lead", color: "#6366f1" },
      { name: "Consultation", color: "#0ea5e9" },
      { name: "Proposal sent", color: "#f59e0b" },
      { name: "Negotiation", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "Service needed", type: "text" },
      { label: "Estimated budget", type: "number" },
      { label: "Preferred date", type: "date" },
      { label: "Urgency", type: "select", options: ["Low", "Medium", "High"] },
    ],
  },
  {
    key: "agency",
    label: "Agency / Marketing",
    emoji: "📈",
    description: "Marketing, design, dev agencies",
    stages: [
      { name: "New lead", color: "#6366f1" },
      { name: "Discovery call", color: "#0ea5e9" },
      { name: "Proposal", color: "#f59e0b" },
      { name: "Contract", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "Project type", type: "text" },
      { label: "Monthly retainer", type: "number" },
      { label: "Lead source", type: "select", options: ["Referral", "Ads", "Cold outreach", "Inbound"] },
    ],
  },
  {
    key: "hospitality",
    label: "Restaurant / Hospitality",
    emoji: "🍽️",
    description: "Events, catering, venues",
    stages: [
      { name: "Inquiry", color: "#6366f1" },
      { name: "Quote sent", color: "#0ea5e9" },
      { name: "Tasting / visit", color: "#f59e0b" },
      { name: "Booked", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [
      { label: "Event date", type: "date" },
      { label: "Guests", type: "number" },
      { label: "Event type", type: "select", options: ["Wedding", "Corporate", "Private", "Other"] },
    ],
  },
  {
    key: "other",
    label: "Something else",
    emoji: "✨",
    description: "Start from a clean, simple pipeline",
    stages: [
      { name: "New", color: "#6366f1" },
      { name: "Contacted", color: "#0ea5e9" },
      { name: "Qualified", color: "#f59e0b" },
      { name: "Proposal", color: "#8b5cf6" },
      WON,
      LOST,
    ],
    fields: [],
  },
];
