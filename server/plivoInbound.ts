/**
 * plivoInbound.ts — Inbound SMS webhook handler for Plivo
 *
 * Plivo calls POST /api/webhooks/plivo/inbound when a lead replies to an SMS.
 * Payload fields (form-encoded or JSON):
 *   From     — sender's phone number (E.164 or local)
 *   To       — your Plivo number
 *   Text     — the message body
 *   MessageUUID — Plivo message ID
 *
 * Flow:
 *  1. Normalise the From number
 *  2. Find the most-recent lead with that customerPhone
 *  3. Find or create a conversation for that lead
 *  4. Insert the inbound message as senderType="customer"
 *  5. Log the inbound SMS in sms_logs
 *  6. If conversation.aiActive === true, trigger AI reply
 *  7. Return empty Plivo XML <Response/> to suppress auto-reply
 */

import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getDb } from "./db";
import { smsLogs } from "../drizzle/schema";
import { normalisePhone } from "./messaging";
import { invokeLLM } from "./_core/llm";
import { sendSms } from "./messaging";

export function registerPlivoInboundRoute(app: Express) {
  // Plivo sends form-encoded POST — express.urlencoded already registered globally
  app.post("/api/webhooks/plivo/inbound", async (req: Request, res: Response) => {
    // Always respond quickly with valid XML so Plivo doesn't retry
    const respondXml = () => {
      res.set("Content-Type", "text/xml");
      res.send("<Response></Response>");
    };

    try {
      const from: string = req.body?.From || req.body?.from || "";
      const text: string = req.body?.Text || req.body?.text || req.body?.Body || "";
      const messageUUID: string = req.body?.MessageUUID || req.body?.message_uuid || "";

      console.log(`[Plivo Inbound] From=${from} Text="${text}" UUID=${messageUUID}`);

      if (!from || !text) {
        console.warn("[Plivo Inbound] Missing From or Text — ignoring");
        return respondXml();
      }

      // 1. Normalise the sender's number
      const normalisedFrom = normalisePhone(from);

      // 2. Find the most-recent lead with this phone number
      //    Try normalised form first, then raw form
      let lead = await db.getLeadByPhone(normalisedFrom);
      if (!lead && normalisedFrom !== from) {
        lead = await db.getLeadByPhone(from);
      }

      if (!lead) {
        console.warn(`[Plivo Inbound] No lead found for phone ${normalisedFrom} — creating unknown lead`);
        // Create a new lead so the message lands in the inbox
        const business = await getFirstBusiness();
        if (!business) {
          console.error("[Plivo Inbound] No business found — cannot create lead");
          return respondXml();
        }
        const newLead = await db.createLead({
          businessId: business.id,
          customerName: "Unknown (SMS)",
          customerPhone: normalisedFrom || from,
          serviceNeeded: text,
          sourceType: "website",
          status: "new",
          aiActive: true,
        });
        lead = { id: newLead.id, businessId: business.id, aiActive: true, customerPhone: normalisedFrom || from, customerName: "Unknown (SMS)" } as any;
      }

      // After the guard above, lead is guaranteed to be defined
      const resolvedLead = lead!;

      // 3. Find or create a conversation for this lead
      let conv = await db.getConversationByLeadId(resolvedLead.id);
      if (!conv) {
        conv = await db.createConversation({
          leadId: resolvedLead.id,
          businessId: resolvedLead.businessId,
          channel: "sms",
          aiActive: true,
          lastMessageAt: new Date(),
        }) as any;
        // Re-fetch to get full object
        conv = await db.getConversationByLeadId(resolvedLead.id);
      }

      if (!conv) {
        console.error("[Plivo Inbound] Could not find or create conversation");
        return respondXml();
      }

      // 4. Insert inbound message as customer
      await db.createMessage({
        conversationId: conv.id,
        content: text,
        senderType: "customer",
      });

      // Update conversation lastMessageAt
      await db.updateConversation(conv.id, { lastMessageAt: new Date() });

      // 5. Log inbound SMS in sms_logs
      await logInboundSms({
        businessId: resolvedLead.businessId,
        leadId: resolvedLead.id,
        conversationId: conv.id,
        fromNumber: normalisedFrom || from,
        toNumber: req.body?.To || req.body?.to || "",
        messageBody: text,
        plivoMessageUUID: messageUUID,
      });

      // 6. If AI is active on this conversation, trigger AI reply
      if (conv.aiActive) {
        // Fire-and-forget — don't block the Plivo response
        triggerAIReply(conv.id, resolvedLead.businessId, resolvedLead).catch((err) =>
          console.error("[Plivo Inbound] AI reply error:", err)
        );
      }

      // 7. Respond to Plivo
      return respondXml();
    } catch (err: any) {
      console.error("[Plivo Inbound] Unhandled error:", err?.message ?? err);
      return respondXml(); // Always return valid XML
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getFirstBusiness() {
  const dbConn = await getDb();
  if (!dbConn) return null;
  // Fallback: get the first business in the system (for unmatched inbound numbers)
  const { businesses } = await import("../drizzle/schema");
  const result = await dbConn.select().from(businesses).limit(1);
  return result[0] ?? null;
}

async function logInboundSms(opts: {
  businessId: number;
  leadId: number;
  conversationId: number;
  fromNumber: string;
  toNumber: string;
  messageBody: string;
  plivoMessageUUID: string;
}) {
  const dbConn = await getDb();
  if (!dbConn) return;
  try {
    await dbConn.insert(smsLogs).values({
      businessId: opts.businessId,
      leadId: opts.leadId,
      conversationId: opts.conversationId,
      toNumber: opts.fromNumber,   // "to" from our perspective = the lead's number
      fromNumber: opts.toNumber,   // "from" our perspective = our Plivo number
      messageBody: opts.messageBody,
      status: "delivered",
      direction: "inbound",
      plivoMessageUUID: opts.plivoMessageUUID || null,
      messageType: "inbound_reply",
      sentAt: new Date(),
    } as any);
  } catch (err) {
    console.error("[Plivo Inbound] Failed to log SMS:", err);
  }
}

async function triggerAIReply(conversationId: number, businessId: number, lead: any) {
  const business = await db.getBusinessById(businessId);
  if (!business) return;

  // Build system prompt from business config
  const systemPrompt = buildInboundSystemPrompt(business, lead);

  // Get recent conversation history (last 10 messages)
  const recentMessages = await db.getMessagesByConversation(conversationId);
  const history = recentMessages.slice(-10).map((m: any) => ({
    role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
    content: m.content as string,
  }));

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
    ],
  });

  const aiText =
    typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content.trim()
      : "";

  if (!aiText) return;

  // Save AI message to conversation
  await db.createMessage({
    conversationId,
    content: aiText,
    senderType: "ai",
  });
  await db.updateConversation(conversationId, { lastMessageAt: new Date() });

  // Send via Plivo if lead has a phone number
  if (lead?.customerPhone) {
    await sendSms({
      toNumber: lead.customerPhone,
      body: aiText,
      businessId,
      leadId: lead.id,
      conversationId,
      messageType: "ai_reply",
    });
  }
}

function buildInboundSystemPrompt(business: any, lead: any): string {
  const categories =
    business.serviceCategories?.length > 0
      ? business.serviceCategories.join(", ")
      : "general home services";

  let prompt = `You are an AI assistant for ${business.name}, a home service company specializing in ${categories}.
Respond to customer SMS replies. Be concise (2-3 sentences max for SMS), helpful, and aim to book appointments.
Tone: ${business.aiTone || "professional"}.`;

  if (business.aiContext) prompt += `\n\nBusiness context:\n${business.aiContext}`;
  if (business.aiPromptInstructions) prompt += `\n\nInstructions:\n${business.aiPromptInstructions}`;

  if (lead?.customerName && lead.customerName !== "Unknown (SMS)") {
    prompt += `\n\nCustomer: ${lead.customerName}`;
  }
  if (lead?.serviceNeeded) prompt += `\nOriginal inquiry: ${lead.serviceNeeded}`;

  prompt += "\n\nKeep responses under 320 characters for SMS. Never make up pricing.";
  return prompt;
}
