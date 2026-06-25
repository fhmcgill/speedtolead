import { Button } from "@/components/ui/button";
import {
  Hammer,
  ArrowRight,
  Users,
  Target,
  Lightbulb,
  Heart,
  Wrench,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setLocation("/")}
          >
            <Hammer className="h-6 w-6" style={{ color: "oklch(0.68 0.19 42)" }} />
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              LeadHammer
            </span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/contact")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
            <Button size="sm" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Heart className="h-4 w-4" />
              Built by Marketers, for Home Service Pros
            </div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              We Know Home Services.{" "}
              <span className="text-gradient">We've Lived It.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              LeadHammer was built by a small, passionate team of marketers with
              deep roots in the home services industry. We've spent years helping
              HVAC companies, plumbers, electricians, and roofers grow their
              businesses — and we got tired of watching great companies lose jobs
              because they couldn't respond fast enough.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 border-t border-border/40">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <div className="space-y-6">
              <h2
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The Problem We Set Out to Solve
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  After years of running digital marketing campaigns for home
                  service companies, we kept seeing the same pattern: a homeowner
                  submits a lead on Yelp or Google at 7 PM on a Tuesday, and the
                  contractor doesn't respond until the next morning. By then, the
                  homeowner has already booked with a competitor.
                </p>
                <p>
                  The research is clear — responding to a lead within the first
                  five minutes makes you 100x more likely to connect. But most
                  home service businesses are too busy doing the actual work to
                  monitor every lead channel 24/7. That's the gap we built
                  LeadHammer to close.
                </p>
                <p>
                  We're not a big enterprise software company. We're a small team
                  that genuinely cares about helping tradespeople and home service
                  operators compete and win — without needing a full-time sales
                  team or a massive marketing budget.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Wrench, label: "Home Services Focus", desc: "HVAC, plumbing, electrical, roofing, and more" },
                { icon: Target, label: "LeadHammer", desc: "Respond in seconds, not hours or days" },
                { icon: BarChart3, label: "Data-Driven", desc: "Every decision backed by real performance data" },
                { icon: Lightbulb, label: "Practical AI", desc: "AI that actually works in the real world" },
              ].map((item) => (
                <div key={item.label} className="card-premium p-5 space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted/20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What We Stand For
            </h2>
            <p className="text-muted-foreground mt-4">
              A few principles that guide everything we build and every decision
              we make.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Hammer,
                title: "Speed is Everything",
                desc: "In home services, the first responder wins. We obsess over response time because we know it's the single biggest driver of booked jobs.",
              },
              {
                icon: Users,
                title: "Built for Real Businesses",
                desc: "We don't build for enterprise software buyers. We build for the owner-operator who's on the job site all day and needs their business to run itself.",
              },
              {
                icon: Heart,
                title: "Honest and Transparent",
                desc: "No hidden fees, no bloated feature lists, no confusing contracts. We want to earn your trust by delivering real results, not by locking you in.",
              },
            ].map((value) => (
              <div key={value.title} className="card-premium p-7 space-y-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Industries We Know Best
            </h2>
            <p className="text-muted-foreground mt-4">
              Our team has worked directly with companies in these trades, which
              means LeadHammer speaks their language from day one.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              "HVAC & Air Conditioning",
              "Plumbing",
              "Electrical",
              "Roofing",
              "Pest Control",
              "Landscaping",
              "Garage Door",
              "General Contracting",
            ].map((trade) => (
              <div
                key={trade}
                className="card-premium p-4 flex items-center gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">{trade}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Ready to See LeadHammer in Action?
            </h2>
            <p className="text-muted-foreground text-lg">
              Get started free or reach out to our team — we'd love to show you
              what's possible for your business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="text-base px-8 shadow-lg hover:shadow-xl transition-all"
                onClick={() => setLocation("/")}
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
                Contact Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setLocation("/")}
          >
            <Hammer className="h-5 w-5" style={{ color: "oklch(0.68 0.19 42)" }} />
            <span className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              LeadHammer
            </span>
          </button>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LeadHammer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
