/**
 * SpeedLead Subscription Plans
 * Prices are created dynamically via Stripe API on first use.
 */

export interface PlanConfig {
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly: number;  // in cents
  features: string[];
  leadLimit: number | null; // null = unlimited
  teamMemberLimit: number;
  aiRepliesPerMonth: number | null;
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: "Starter",
    description: "Perfect for solo operators getting started with AI-powered lead response.",
    priceMonthly: 4900, // $49/mo
    priceYearly: 47000, // $470/yr (~$39/mo)
    features: [
      "Up to 50 leads/month",
      "AI-powered instant response",
      "1 team member",
      "Shared inbox",
      "Basic follow-up sequences",
      "Email support",
    ],
    leadLimit: 50,
    teamMemberLimit: 1,
    aiRepliesPerMonth: 200,
  },
  professional: {
    name: "Professional",
    description: "For growing home service businesses that need more capacity and integrations.",
    priceMonthly: 9900, // $99/mo
    priceYearly: 95000, // $950/yr (~$79/mo)
    features: [
      "Up to 250 leads/month",
      "AI-powered instant response",
      "5 team members",
      "Shared inbox with AI toggle",
      "Advanced follow-up sequences",
      "ServiceTitan / Jobber integration",
      "Multi-channel lead capture",
      "KPI dashboard",
      "Priority support",
    ],
    leadLimit: 250,
    teamMemberLimit: 5,
    aiRepliesPerMonth: 1000,
  },
  enterprise: {
    name: "Enterprise",
    description: "Unlimited capacity for established businesses with multiple locations.",
    priceMonthly: 19900, // $199/mo
    priceYearly: 190000, // $1900/yr (~$158/mo)
    features: [
      "Unlimited leads",
      "AI-powered instant response",
      "Unlimited team members",
      "Shared inbox with AI toggle",
      "Advanced follow-up sequences",
      "ServiceTitan / Jobber integration",
      "Multi-channel lead capture",
      "Advanced analytics & KPI dashboard",
      "Custom AI training",
      "Dedicated account manager",
      "Phone & email support",
    ],
    leadLimit: null,
    teamMemberLimit: 999,
    aiRepliesPerMonth: null,
  },
};
