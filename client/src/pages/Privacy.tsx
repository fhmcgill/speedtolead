import { useLocation } from "wouter";
import { Hammer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <Hammer className="h-5 w-5" style={{ color: "oklch(0.68 0.19 42)" }} />
            LeadHammer
          </button>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <Section title="1. Introduction">
            LeadHammer ("we," "us," or "our") operates the LeadHammer platform, a software-as-a-service product
            designed to help home service businesses manage leads, automate follow-ups, and integrate with field
            service management tools. This Privacy Policy explains how we collect, use, disclose, and safeguard
            information when you use our platform. Please read it carefully. By accessing or using LeadHammer,
            you agree to the practices described in this policy.
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect information in the following ways:</p>

            <SubSection title="Information You Provide Directly">
              When you create an account, configure a business profile, or contact us, you may provide your name,
              email address, phone number, company name, and billing information. Business owners may also input
              customer data (lead names, phone numbers, email addresses, and service details) as part of normal
              platform use.
            </SubSection>

            <SubSection title="Information Collected Automatically">
              We automatically collect certain technical data when you interact with our platform, including IP
              addresses, browser type, operating system, referring URLs, pages visited, and timestamps. We use
              cookies and similar tracking technologies to maintain session state and improve user experience.
            </SubSection>

            <SubSection title="Information from Third-Party Integrations">
              If you connect third-party services such as ServiceTitan or Jobber, we receive data from those
              platforms as authorized by you, including scheduling availability, customer records, and job
              information. We only access the data necessary to provide the integration features you have enabled.
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            We use the information we collect to provide, maintain, and improve the LeadHammer platform; process
            transactions and send related billing communications; send operational notifications such as lead
            alerts and follow-up summaries; respond to support inquiries; detect and prevent fraudulent or
            unauthorized activity; and comply with applicable legal obligations. We do not sell your personal
            information or your customers' data to third parties.
          </Section>

          <Section title="4. Data Sharing and Disclosure">
            We may share information with trusted service providers who assist us in operating the platform
            (such as cloud hosting, payment processing, and email delivery), subject to confidentiality
            obligations. We may also disclose information when required by law, court order, or government
            authority, or when necessary to protect the rights, property, or safety of LeadHammer, our users,
            or the public. In the event of a merger, acquisition, or sale of assets, user information may be
            transferred as part of that transaction, with notice provided to affected users.
          </Section>

          <Section title="5. Data Retention">
            We retain account and business data for as long as your account remains active or as needed to
            provide services. Lead and conversation data is retained for the duration of your subscription and
            for a reasonable period thereafter to allow for account recovery. You may request deletion of your
            data at any time by contacting us at the address below, subject to any legal retention requirements.
          </Section>

          <Section title="6. Security">
            We implement industry-standard technical and organizational measures to protect your information
            against unauthorized access, alteration, disclosure, or destruction. These include encrypted data
            transmission (TLS), access controls, and regular security reviews. However, no method of
            transmission over the internet or electronic storage is completely secure, and we cannot guarantee
            absolute security.
          </Section>

          <Section title="7. Your Rights">
            Depending on your jurisdiction, you may have the right to access, correct, or delete personal
            information we hold about you; object to or restrict certain processing activities; and receive a
            portable copy of your data. To exercise any of these rights, please contact us using the information
            in Section 10. We will respond to verified requests within the timeframe required by applicable law.
          </Section>

          <Section title="8. Children's Privacy">
            LeadHammer is intended for use by business professionals and is not directed at children under the
            age of 16. We do not knowingly collect personal information from children. If we become aware that
            a child has provided us with personal information, we will take steps to delete it promptly.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated"
            date at the top of this page and, for material changes, provide additional notice (such as an
            in-app notification or email). Your continued use of the platform after any changes constitutes
            your acceptance of the updated policy.
          </Section>

          <Section title="10. Contact Us">
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us at:
            <div className="mt-3 p-4 rounded-xl border border-border/60 bg-muted/30 text-sm space-y-1">
              <p className="font-medium">LeadHammer</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a href="mailto:hello@leadhammer.ai" className="text-primary hover:underline">
                  hello@leadhammer.ai
                </a>
              </p>
              <p className="text-muted-foreground">Website: hammerapp.ai</p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LeadHammer. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setLocation("/privacy")} className="hover:text-foreground transition-colors font-medium text-foreground">
              Privacy Policy
            </button>
            <button onClick={() => setLocation("/terms")} className="hover:text-foreground transition-colors">
              Terms of Use
            </button>
            <button onClick={() => setLocation("/about")} className="hover:text-foreground transition-colors">
              About
            </button>
            <button onClick={() => setLocation("/contact")} className="hover:text-foreground transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 mt-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
