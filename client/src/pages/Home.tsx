import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Hammer,
  MessageSquare,
  BarChart3,
  Clock,
  Bot,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Shield,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [loading, user, setLocation]);

  if (!loading && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Hammer className="h-6 w-6" style={{ color: "oklch(0.68 0.19 42)" }} />
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              LeadHammer
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <button onClick={() => setLocation("/about")} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => setLocation("/contact")} className="hover:text-foreground transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              size="sm"
              className="hidden md:inline-flex"
            >
              Sign In
            </Button>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <button onClick={() => { setLocation("/about"); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">About</button>
            <button onClick={() => { setLocation("/contact"); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">Contact</button>
            <Button onClick={() => (window.location.href = getLoginUrl())} size="sm" className="w-full mt-2">Sign In</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="container relative py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Hammer className="h-4 w-4" />
              AI-Powered Lead Response for Home Services
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Respond to Leads in{" "}
              <span className="text-gradient">Seconds</span>, Not Hours
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              LeadHammer uses AI to instantly engage, qualify, and book home
              service leads the moment they come in — from Yelp, Thumbtack,
              Google, and your website.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="text-base px-8 shadow-lg hover:shadow-xl transition-all"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8"
                onClick={() => setLocation("/contact")}
              >
                Request a Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Setup in 5 minutes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "< 10s", label: "Average Response Time" },
              { value: "3x", label: "More Bookings" },
              { value: "24/7", label: "AI Availability" },
              { value: "85%", label: "Lead Qualification Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Everything You Need to Win More Jobs
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              From instant AI responses to automated follow-ups, LeadHammer
              handles your entire lead pipeline.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "AI-Powered Responses",
                desc: "Intelligent replies that understand HVAC, plumbing, electrical, and more. Customizable per business.",
              },
              {
                icon: Clock,
                title: "Instant Lead Engagement",
                desc: "Respond to inquiries in seconds, not hours. Beat competitors to the punch every time.",
              },
              {
                icon: MessageSquare,
                title: "Unified Inbox",
                desc: "All conversations from every channel in one place. See AI status and take over anytime.",
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                desc: "Manual time slots or live availability via ServiceTitan and Jobber integration.",
              },
              {
                icon: Hammer,
                title: "Automated Follow-Ups",
                desc: "Configurable sequences that stop automatically when a customer responds or books.",
              },
              {
                icon: BarChart3,
                title: "KPI Dashboard",
                desc: "Track lead volume, response times, booking rates, and team performance at a glance.",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Owner and Team Member roles. Assign leads, manage access, and collaborate.",
              },
              {
                icon: Shield,
                title: "Multi-Channel Capture",
                desc: "Yelp, Thumbtack, Google LSA, and website forms — all feeding into one system.",
              },
              {
                icon: Hammer,
                title: "Configurable AI",
                desc: "Set custom instructions, tone, response rules, and context per business profile.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card-premium p-6 group hover:border-primary/30 transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section -- intentionally hidden while Thumbtack/Google Ads API
          applications are pending, so reviewers don't see this as already
          commercially available. Restore by removing this comment wrapper
          once ready to go live with pricing again. */}
      {/*
      <section id="pricing" className="py-24 bg-muted/20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Start free. Scale as you grow. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                period: "/mo",
                desc: "Perfect for solo operators and small crews.",
                features: ["Up to 100 leads/mo", "AI lead response", "Shared inbox", "Basic analytics", "Email support"],
                cta: "Start Free Trial",
                highlight: false,
              },
              {
                name: "Professional",
                price: "$149",
                period: "/mo",
                desc: "For growing home service businesses.",
                features: ["Up to 500 leads/mo", "Everything in Starter", "Follow-up automation", "ServiceTitan/Jobber sync", "Team management", "Priority support"],
                cta: "Start Free Trial",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For multi-location or franchise operations.",
                features: ["Unlimited leads", "Everything in Professional", "Custom AI training", "Dedicated account manager", "SLA guarantee", "White-label option"],
                cta: "Contact Sales",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card-premium p-8 flex flex-col gap-6 ${plan.highlight ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""}`}
              >
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold w-fit">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  onClick={() => plan.name === "Enterprise" ? setLocation("/contact") : (window.location.href = getLoginUrl())}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Ready to Win More Leads?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join home service companies that are booking more jobs with
              LeadHammer's AI-powered speed to lead.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="text-base px-8 shadow-lg hover:shadow-xl transition-all"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8"
                onClick={() => setLocation("/contact")}
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Hammer className="h-5 w-5" style={{ color: "oklch(0.68 0.19 42)" }} />
              <span className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                LeadHammer
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => setLocation("/about")} className="hover:text-foreground transition-colors">About</button>
              <button onClick={() => setLocation("/contact")} className="hover:text-foreground transition-colors">Contact</button>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <button onClick={() => setLocation("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button onClick={() => setLocation("/terms")} className="hover:text-foreground transition-colors">Terms of Use</button>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LeadHammer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
