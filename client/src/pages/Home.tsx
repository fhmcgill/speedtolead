import { useNavigate } from "react-router-dom";
import {
  Zap,
  Bot,
  MessageSquare,
  Calendar,
  ChartColumn,
  Users,
  Plug,
  Settings,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Responses",
    description:
      "Intelligent replies that understand HVAC, plumbing, electrical, and more. Customizable per business.",
  },
  {
    icon: Zap,
    title: "Instant Lead Engagement",
    description:
      "Respond to inquiries in seconds, not hours. Beat competitors to the punch every time.",
  },
  {
    icon: MessageSquare,
    title: "Unified Inbox",
    description:
      "All conversations from every channel in one place. See AI status and take over anytime.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Manual time slots or live availability via ServiceTitan and Jobber integration.",
  },
  {
    icon: Zap,
    title: "Automated Follow-Ups",
    description:
      "Configurable sequences that stop automatically when a customer responds or books.",
  },
  {
    icon: ChartColumn,
    title: "KPI Dashboard",
    description:
      "Track lead volume, response times, booking rates, and team performance at a glance.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Owner and Team Member roles. Assign leads, manage access, and collaborate.",
  },
  {
    icon: Plug,
    title: "Multi-Channel Capture",
    description:
      "Yelp, Thumbtack, Google LSA, and website forms — all feeding into one system.",
  },
  {
    icon: Settings,
    title: "Configurable AI",
    description:
      "Set custom instructions, tone, response rules, and context per business profile.",
  },
];

const stats = [
  { value: "< 10s", label: "Average Response Time" },
  { value: "3x", label: "More Bookings" },
  { value: "24/7", label: "AI Availability" },
  { value: "85%", label: "Lead Qualification Rate" },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold font-display">SpeedLead</span>
          </div>
          <Button
            onClick={() =>
              isAuthenticated ? navigate("/dashboard") : signIn()
            }
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium mb-8">
            <Zap className="h-4 w-4 text-primary" />
            AI-Powered Lead Response
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Respond to Leads in{" "}
            <span className="text-primary">Seconds</span>, Not Hours
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-6">
            SpeedLead uses AI to instantly engage, qualify, and book home service
            leads the moment they come in — from Yelp, Thumbtack, Google, and
            your website.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button
              size="lg"
              onClick={() =>
                isAuthenticated ? navigate("/dashboard") : signIn()
              }
              className="gap-2"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Setup in 5 minutes
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">
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

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Everything You Need to Win More Jobs
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              From instant AI responses to automated follow-ups, SpeedLead
              handles your entire lead pipeline.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Win More Leads?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join home service companies that are booking more jobs with
            AI-powered speed to lead.
          </p>
          <Button
            size="lg"
            onClick={() =>
              isAuthenticated ? navigate("/dashboard") : signIn()
            }
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold">SpeedLead</span>
          </div>
          <p>AI-powered lead response for home service companies.</p>
        </div>
      </footer>
    </div>
  );
}
