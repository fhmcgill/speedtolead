import { useState } from "react";
import { CreditCard, Check, Zap, Building, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const plans = [
  {
    key: "starter",
    name: "Starter",
    description: "Perfect for solo operators getting started with AI-powered lead response.",
    priceMonthly: 49,
    priceYearly: 39,
    icon: <Zap className="h-4 w-4" />,
    popular: false,
    features: [
      "Up to 50 leads/month",
      "AI-powered instant response",
      "1 team member",
      "Shared inbox",
      "Basic follow-up sequences",
      "Email support",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    description: "For growing home service businesses that need more capacity and integrations.",
    priceMonthly: 99,
    priceYearly: 79,
    icon: <Building className="h-4 w-4" />,
    popular: true,
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
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Unlimited capacity for established businesses with multiple locations.",
    priceMonthly: 199,
    priceYearly: 158,
    icon: <Rocket className="h-4 w-4" />,
    popular: false,
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
  },
];

export default function Billing() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const { data: subscription, isLoading } = trpc.billing.getSubscription.useQuery();
  const utils = trpc.useUtils();

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data: any) => {
      toast.success("Redirecting to checkout...");
      if (data?.url) {
        window.location.href = data.url;
      }
    },
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error("Failed to open billing portal");
    },
  });

  const handleSelectPlan = (planKey: string) => {
    createCheckout.mutate({ planKey, interval, origin: window.location.origin });
  };

  const isCurrentPlan = (planKey: string) => {
    return subscription?.subscriptionPlan === planKey && subscription?.subscriptionStatus === "active";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing details.
          </p>
        </div>
        {subscription?.subscriptionStatus === "active" && (
          <Button
            variant="outline"
            onClick={() => createPortal.mutate({ origin: window.location.origin })}
          >
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <span className="font-semibold capitalize">
                  {subscription.subscriptionPlan || "Free"}
                </span>
                <span className="ml-2">
                  <Badge variant={subscription.subscriptionStatus === "active" ? "default" : "secondary"}>
                    {subscription.subscriptionStatus}
                  </Badge>
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your card, view invoices, or cancel your subscription.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setInterval("monthly")}
        >
          Monthly
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setInterval("yearly")}
        >
          Yearly <span className="text-xs opacity-75">Save 20%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const isCurrent = isCurrentPlan(plan.key);

          return (
            <Card
              key={plan.key}
              className={`relative flex flex-col transition-all hover:shadow-lg ${
                plan.popular
                  ? "border-primary shadow-md ring-1 ring-primary/20"
                  : "border-border"
              } ${isCurrent ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={isCurrent || createCheckout.isPending}
                >
                  {isCurrent ? "Current Plan" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
