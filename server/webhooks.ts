import type { Express, Request, Response } from "express";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Register webhook routes for external lead ingestion
 * and scheduling API stubs (ServiceTitan, Jobber).
 */
export function registerWebhookRoutes(app: Express) {
  // ─── Lead Ingestion Webhook ──────────────────────────────────────────────
  // POST /api/webhook/lead/:businessId
  // Accepts JSON: { customerName, customerPhone, customerEmail, serviceNeeded, sourceType }
  app.post("/api/webhook/lead/:businessId", async (req: Request, res: Response) => {
    try {
      const businessId = parseInt(req.params.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ error: "Invalid businessId" });
      }

      const business = await db.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const { customerName, customerPhone, customerEmail, serviceNeeded, sourceType } = req.body;

      if (!serviceNeeded && !customerName) {
        return res.status(400).json({ error: "At least customerName or serviceNeeded is required" });
      }

      // Create lead
      const lead = await db.createLead({
        businessId,
        customerName: customerName || "Unknown",
        customerPhone,
        customerEmail,
        serviceNeeded: serviceNeeded || "",
        sourceType: sourceType || "website",
        status: "new",
        aiActive: true,
      });

      // Create conversation
      const conv = await db.createConversation({
        leadId: lead.id,
        businessId,
        channel: sourceType || "website",
        aiActive: true,
        lastMessageAt: new Date(),
      });

      // Create customer message
      if (serviceNeeded) {
        await db.createMessage({
          conversationId: conv.id,
          content: serviceNeeded,
          senderType: "customer",
        });
      }

      // Generate AI reply if business has AI enabled
      let aiReply = "";
      try {
        const leadData = await db.getLeadById(lead.id);
        const systemPrompt = buildWebhookSystemPrompt(business, leadData);

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: serviceNeeded || `New inquiry from ${customerName}` },
          ],
        });

        aiReply = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : "Thank you for reaching out! We received your inquiry and will get back to you shortly.";

        await db.createMessage({
          conversationId: conv.id,
          content: aiReply,
          senderType: "ai",
        });

        const responseTimeMs = Date.now() - new Date(leadData!.createdAt).getTime();
        await db.updateLead(lead.id, { responseTimeMs });
      } catch (err) {
        console.error("[Webhook] AI reply failed:", err);
        aiReply = "Thank you for reaching out! We received your inquiry and will get back to you shortly.";
      }

      await db.updateConversation(conv.id, { lastMessageAt: new Date() });

      return res.status(201).json({
        success: true,
        leadId: lead.id,
        conversationId: conv.id,
        aiReply,
      });
    } catch (err: any) {
      console.error("[Webhook] Lead ingestion error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── ServiceTitan Availability Stub ────────────────────────────────────────
  // GET /api/integrations/servicetitan/availability/:businessId
  app.get("/api/integrations/servicetitan/availability/:businessId", async (req: Request, res: Response) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const business = await db.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      if (business.availabilityMode !== "servicetitan") {
        return res.status(400).json({ error: "Business is not configured for ServiceTitan" });
      }

      const config = business.serviceTitanConfig as any;
      if (!config?.tenantId || !config?.clientId) {
        return res.status(400).json({
          error: "ServiceTitan not configured",
          message: "Please provide tenantId and clientId in Settings > Availability",
          requiredFields: ["tenantId", "clientId", "clientSecret"],
        });
      }

      // Stub: In production, this would call the ServiceTitan Dispatch API
      // https://developer.servicetitan.io/apis/dispatch/
      // GET /dispatch/v2/tenant/{tenant}/capacity
      return res.json({
        source: "servicetitan",
        status: "stub",
        message: "ServiceTitan integration is configured. In production, this would fetch live availability from the ServiceTitan Dispatch API.",
        config: {
          tenantId: config.tenantId,
          endpoint: `https://api.servicetitan.io/dispatch/v2/tenant/${config.tenantId}/capacity`,
        },
        sampleSlots: generateSampleSlots(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Jobber Availability Stub ──────────────────────────────────────────────
  // GET /api/integrations/jobber/availability/:businessId
  app.get("/api/integrations/jobber/availability/:businessId", async (req: Request, res: Response) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const business = await db.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      if (business.availabilityMode !== "jobber") {
        return res.status(400).json({ error: "Business is not configured for Jobber" });
      }

      const config = business.jobberConfig as any;
      if (!config?.accessToken) {
        return res.status(400).json({
          error: "Jobber not configured",
          message: "Please provide an access token in Settings > Availability",
          requiredFields: ["accessToken"],
        });
      }

      // Stub: In production, this would call the Jobber GraphQL API
      // https://developer.getjobber.com/docs/
      // Query: { scheduleEntries { ... } }
      return res.json({
        source: "jobber",
        status: "stub",
        message: "Jobber integration is configured. In production, this would fetch live availability from the Jobber GraphQL API.",
        config: {
          endpoint: "https://api.getjobber.com/api/graphql",
          query: "{ scheduleEntries(filter: { startAt: ... }) { nodes { startAt endAt } } }",
        },
        sampleSlots: generateSampleSlots(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSampleSlots() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((day) => ({
    day,
    slots: [
      { start: "08:00", end: "10:00", available: true },
      { start: "10:00", end: "12:00", available: true },
      { start: "13:00", end: "15:00", available: true },
      { start: "15:00", end: "17:00", available: false },
    ],
  }));
}

function buildWebhookSystemPrompt(business: any, lead: any): string {
  const categories = business.serviceCategories?.length > 0
    ? business.serviceCategories.join(", ")
    : "general home services";

  let prompt = `You are an AI assistant for ${business.name}, a home service company specializing in ${categories}.
Your role is to respond to customer inquiries about repair and service needs. Be helpful, knowledgeable, and aim to qualify leads and book appointments.
Communication Style: ${business.aiTone || "professional"} tone. Be warm, empathetic, and solution-oriented.`;

  if (business.aiContext) {
    prompt += `\n\nBusiness Context:\n${business.aiContext}`;
  }
  if (business.aiPromptInstructions) {
    prompt += `\n\nInstructions:\n${business.aiPromptInstructions}`;
  }
  if (business.aiResponseRules?.length > 0) {
    prompt += `\n\nRules:\n${business.aiResponseRules.map((r: string) => `- ${r}`).join("\n")}`;
  }

  prompt += `\n\nGuidelines:
- Respond quickly and professionally
- Ask qualifying questions to understand the issue
- Offer to schedule an appointment when appropriate
- Keep responses concise but helpful (2-4 sentences)
- Never make up pricing`;

  if (lead) {
    prompt += `\n\nCustomer: ${lead.customerName || "Unknown"}`;
    if (lead.serviceNeeded) prompt += `\nInquiry: ${lead.serviceNeeded}`;
  }

  return prompt;
}
