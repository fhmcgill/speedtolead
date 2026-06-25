import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Check,
  CreditCard,
  Crown,
  Loader2,
  Rocket,
  Shield,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface PlanConfig {
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: PlanConfig[] = [
  {
    key: "starter",
    name: "Starter",
    description: "Perfect for solo operators getting started with AI-powered lead response.",
    priceMonthly: 49,
    priceYearly: 39,
    features: [
      "Up to 50 leads/month",
      "AI-powered instant response",
      "1 team member",
      "Shared inbox",
      "Basic follow-up sequences",
      "Email support",
    ],
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    key: "professional",
    name: "Professional",
    description: "For growing home service businesses that need more capacity and integrations.",
    priceMonthly: 99,
    priceYearly: 79,
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
    icon: <Crown className="h-5 w-5" />,
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Unlimited capacity for established businesses with multiple locations.",
    priceMonthly: 199,
    priceYearly: 158,
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
    icon: <Shield className="h-5 w-5" />,
  },
];

export default function Billing() {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: subscription, isLoading: subLoading } = trpc.billing.getSubscription.useQuery(
    undefined,
    { enabled: !!user }
  );

  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to checkout...");
      window.open(data.checkoutUrl, "_blank");
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create checkout session");
      setLoadingPlan(null);
    },
  });

  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      toast.success("Opening subscription management...");
      window.open(data.portalUrl, "_blank");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to open billing portal");
    },
  });

  // Handle success/cancelled query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated successfully! Welcome aboard.");
      window.history.replaceState({}, "", "/billing");
    }
    if (params.get("cancelled") === "true") {
      toast.info("Checkout was cancelled. No charges were made.");
      window.history.replaceState({}, "", "/billing");
    }
  }, []);

  const handleSubscribe = (planKey: string) => {
    setLoadingPlan(planKey);
    checkoutMutation.mutate({
      planKey: planKey as "starter" | "professional" | "enterprise",
      interval: billingInterval,
      origin: window.location.origin,
    });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate({ origin: window.location.origin });
  };

  const isCurrentPlan = (planKey: string) => {
    return subscription?.subscriptionPlan === planKey && subscription?.subscriptionStatus === "active";
  };

  const hasActiveSubscription = subscription?.subscriptionStatus === "active";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your plan, billing, and payment information.
          </p>
        </div>

        {/* Current Subscription Status */}
        {hasActiveSubscription && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {subscription?.subscriptionPlan
                      ? subscription.subscriptionPlan.charAt(0).toUpperCase() + subscription.subscriptionPlan.slice(1)
                      : "Active"}{" "}
                    Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is{" "}
                    <Badge variant="default" className="ml-1 text-xs">
                      {subscription?.subscriptionStatus}
                    </Badge>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Past Due Warning */}
        {subscription?.subscriptionStatus === "past_due" && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-5">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Payment Past Due</p>
                <p className="text-sm text-muted-foreground">
                  Your last payment failed. Please update your payment method to avoid service interruption.
                </p>
              </div>
              <Button variant="destructive" className="ml-auto" onClick={handleManageSubscription}>
                Update Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingInterval === "month"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingInterval === "year"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = billingInterval === "month" ? plan.priceMonthly : plan.priceYearly;
            const isCurrent = isCurrentPlan(plan.key);
            const isLoading = loadingPlan === plan.key;

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
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold tracking-tight">${price}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      /mo{billingInterval === "year" ? " (billed yearly)" : ""}
                    </span>
                  </div>

                  <Separator className="mb-4" />

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={portalMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${plan.popular ? "" : "variant-outline"}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isLoading || checkoutMutation.isPending}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {hasActiveSubscription ? "Switch Plan" : "Get Started"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              All payments are securely processed through Stripe. Your card details are never stored on our servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Secure Payment Processing</p>
                <p className="text-xs text-muted-foreground">
                  Powered by Stripe — PCI DSS Level 1 certified. Cancel anytime from the billing portal.
                </p>
              </div>
            </div>

            {hasActiveSubscription && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Need to update your payment method?</p>
                  <p className="text-xs text-muted-foreground">
                    Manage your card, view invoices, or cancel your subscription.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={portalMutation.isPending}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Billing Portal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Mode Notice */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>
            Currently in test mode. Use card number <code className="bg-muted px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code> with any future expiry and CVC to test.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
