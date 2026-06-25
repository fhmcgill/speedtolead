import { useLocation } from "wouter";
import { Hammer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
              Terms of Use
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <Section title="1. Acceptance of Terms">
            By accessing or using the LeadHammer platform ("Platform"), you agree to be bound by these Terms
            of Use ("Terms") and our Privacy Policy, which is incorporated herein by reference. If you do not
            agree to these Terms, you may not access or use the Platform. These Terms constitute a legally
            binding agreement between you (or the business entity you represent) and LeadHammer ("we," "us,"
            or "our").
          </Section>

          <Section title="2. Description of Service">
            LeadHammer is a software-as-a-service platform that provides home service businesses with tools
            for AI-powered lead response, shared inbox management, automated follow-up sequences, scheduling
            integration, and business analytics. We reserve the right to modify, suspend, or discontinue any
            aspect of the Platform at any time with reasonable notice.
          </Section>

          <Section title="3. Account Registration and Eligibility">
            To use the Platform, you must create an account and provide accurate, complete, and current
            information. You must be at least 18 years old and authorized to enter into binding contracts on
            behalf of any business you represent. You are responsible for maintaining the confidentiality of
            your account credentials and for all activity that occurs under your account. You agree to notify
            us immediately of any unauthorized use of your account.
          </Section>

          <Section title="4. Subscription Plans and Billing">
            Access to certain features of the Platform requires a paid subscription. By selecting a
            subscription plan, you authorize us to charge the applicable fees to your payment method on a
            recurring basis. All fees are stated in US dollars and are non-refundable except as expressly
            provided in these Terms or required by applicable law. We reserve the right to change pricing
            with at least 30 days' advance notice. Failure to pay may result in suspension or termination
            of your account.
          </Section>

          <Section title="5. Acceptable Use">
            You agree to use the Platform only for lawful purposes and in accordance with these Terms. You
            must not use the Platform to send unsolicited commercial messages in violation of applicable
            anti-spam laws; collect or store personal data about individuals without appropriate legal basis;
            impersonate any person or entity; interfere with or disrupt the integrity or performance of the
            Platform; attempt to gain unauthorized access to any part of the Platform or its related systems;
            or use the Platform in any manner that could harm, disable, or impair our services or other users.
          </Section>

          <Section title="6. Customer Data and Privacy">
            You retain ownership of all customer data you input into the Platform ("Customer Data"). By using
            the Platform, you grant us a limited license to process Customer Data solely to provide the
            services described herein. You represent and warrant that you have obtained all necessary consents
            and have the legal right to provide Customer Data to us. We will handle Customer Data in
            accordance with our Privacy Policy and applicable data protection laws.
          </Section>

          <Section title="7. AI-Generated Content">
            The Platform uses artificial intelligence to generate suggested responses and communications on
            your behalf. You acknowledge that AI-generated content may not always be accurate, appropriate,
            or suitable for your specific situation. You are solely responsible for reviewing, approving, and
            sending any AI-generated communications to your customers. We do not warrant the accuracy,
            completeness, or fitness for purpose of any AI-generated output.
          </Section>

          <Section title="8. Third-Party Integrations">
            The Platform may integrate with third-party services such as ServiceTitan, Jobber, and Stripe.
            Your use of such integrations is subject to the respective third-party terms of service and
            privacy policies. We are not responsible for the availability, accuracy, or conduct of any
            third-party service. You are responsible for maintaining valid credentials and authorizations
            for any third-party integrations you enable.
          </Section>

          <Section title="9. Intellectual Property">
            The Platform, including its software, design, trademarks, and content, is owned by LeadHammer
            and protected by applicable intellectual property laws. These Terms do not grant you any
            ownership rights in the Platform. You may not copy, modify, distribute, sell, or lease any
            part of the Platform, nor may you reverse engineer or attempt to extract the source code of
            the Platform, unless applicable law prohibits this restriction.
          </Section>

          <Section title="10. Disclaimer of Warranties">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE
            UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE
            PLATFORM IS AT YOUR SOLE RISK.
          </Section>

          <Section title="11. Limitation of Liability">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LEADHAMMER SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
            DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM, EVEN IF WE
            HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL CUMULATIVE LIABILITY TO YOU
            FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE FEES PAID BY YOU TO US IN THE
            THREE MONTHS PRECEDING THE CLAIM.
          </Section>

          <Section title="12. Indemnification">
            You agree to indemnify, defend, and hold harmless LeadHammer and its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and expenses
            (including reasonable attorneys' fees) arising out of or in any way connected with your access
            to or use of the Platform, your violation of these Terms, or your infringement of any
            third-party rights.
          </Section>

          <Section title="13. Termination">
            Either party may terminate these Terms at any time. You may cancel your account through the
            billing settings in the Platform. We may suspend or terminate your access immediately if you
            violate these Terms, engage in fraudulent activity, or if required by law. Upon termination,
            your right to use the Platform ceases immediately. Sections 6, 9, 10, 11, 12, and 14 survive
            any termination of these Terms.
          </Section>

          <Section title="14. Governing Law and Dispute Resolution">
            These Terms are governed by the laws of the United States, without regard to conflict of law
            principles. Any dispute arising out of or relating to these Terms or the Platform shall first
            be subject to good-faith negotiation. If unresolved, disputes shall be submitted to binding
            arbitration in accordance with the rules of the American Arbitration Association. You waive
            any right to participate in a class action lawsuit or class-wide arbitration.
          </Section>

          <Section title="15. Changes to These Terms">
            We may update these Terms from time to time. When we do, we will revise the "Last updated"
            date at the top of this page. For material changes, we will provide additional notice such as
            an in-app notification or email. Your continued use of the Platform after any changes
            constitutes your acceptance of the updated Terms.
          </Section>

          <Section title="16. Contact Us">
            If you have questions about these Terms, please contact us at:
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
            <button onClick={() => setLocation("/privacy")} className="hover:text-foreground transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setLocation("/terms")} className="hover:text-foreground transition-colors font-medium text-foreground">
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
