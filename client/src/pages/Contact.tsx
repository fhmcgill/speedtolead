import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hammer, Mail, Phone, MapPin, ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  trade: string;
  message: string;
  reason: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  trade: "",
  message: "",
  reason: "",
};

export default function Contact() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Message sent! We'll be in touch within one business day.");
    },
    onError: (err) => {
      setLoading(false);
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    setLoading(true);
    submitMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName || undefined,
      email: form.email,
      phone: form.phone || undefined,
      company: form.company || undefined,
      trade: form.trade || undefined,
      reason: form.reason || undefined,
      message: form.message,
    });
  };

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
              onClick={() => setLocation("/about")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
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
        <div className="container relative py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Get in Touch
            </div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Let's Talk About{" "}
              <span className="text-gradient">Your Business</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're ready to get started, have questions about pricing,
              or want a personalized demo — we're here to help. We typically
              respond within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 pb-24">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      label: "Email",
                      value: "hello@leadhammer.ai",
                      href: "mailto:hello@leadhammer.ai",
                    },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: "Available upon request",
                      href: undefined,
                    },
                    {
                      icon: MapPin,
                      label: "Location",
                      value: "United States",
                      href: undefined,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6 space-y-4">
                <h3 className="font-semibold">What to Expect</h3>
                <ul className="space-y-3">
                  {[
                    "Response within one business day",
                    "No high-pressure sales tactics",
                    "Honest answers to all your questions",
                    "Free personalized demo available",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="card-premium p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h3
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Message Sent!
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      Thanks for reaching out. A member of our team will get back
                      to you within one business day.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setForm(initialForm); setSubmitted(false); }}>
                      Send Another
                    </Button>
                    <Button onClick={() => setLocation("/")}>
                      Back to Home
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Send Us a Message
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fill out the form below and we'll get back to you shortly.
                    </p>
                  </div>

                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        value={form.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={form.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@example.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Company & Trade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Smith HVAC Services"
                        value={form.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trade">Trade / Industry</Label>
                      <Select
                        value={form.trade}
                        onValueChange={(v) => handleChange("trade", v)}
                      >
                        <SelectTrigger id="trade">
                          <SelectValue placeholder="Select trade..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hvac">HVAC / Air Conditioning</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="roofing">Roofing</SelectItem>
                          <SelectItem value="pest-control">Pest Control</SelectItem>
                          <SelectItem value="landscaping">Landscaping</SelectItem>
                          <SelectItem value="garage-door">Garage Door</SelectItem>
                          <SelectItem value="general">General Contracting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">How Can We Help?</Label>
                    <Select
                      value={form.reason}
                      onValueChange={(v) => handleChange("reason", v)}
                    >
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Request a Demo</SelectItem>
                        <SelectItem value="pricing">Pricing Questions</SelectItem>
                        <SelectItem value="trial">Start a Free Trial</SelectItem>
                        <SelectItem value="integration">Integration Support</SelectItem>
                        <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                        <SelectItem value="other">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your business and what you're looking for..."
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full shadow-md hover:shadow-lg transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
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
