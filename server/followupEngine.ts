/**
 * followupEngine.ts — Estimate Follow-Up Engine for LeadHammer
 *
 * Responsibilities:
 *  1. CRUD for follow-up templates (owner coaching)
 *  2. A/B variant management
 *  3. Queue management (create, list, approve, reject)
 *  4. AI message generation from template instructions
 *  5. Send approved/auto-approved messages via Plivo
 */

import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  followupTemplates,
  followupAbVariants,
  estimateFollowupQueue,
  type FollowupTemplate,
  type InsertFollowupTemplate,
  type FollowupAbVariant,
  type EstimateFollowupQueue,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { sendSms } from "./messaging";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

// ─── Default templates seeded for new businesses ─────────────────────────────

const DEFAULT_TEMPLATES: Omit<InsertFollowupTemplate, "businessId">[] = [
  {
    attemptNumber: 1,
    name: "First Nudge",
    promptInstructions:
      "Write a warm, friendly SMS follow-up reminding the customer about their open estimate. " +
      "Reference the service they inquired about and the approximate amount. " +
      "Keep it conversational, no pressure. Offer to answer any questions. " +
      "End with a soft call-to-action to confirm the appointment.",
    tone: "friendly",
    maxChars: 320,
    forbiddenPhrases: [],
    approvalRequired: false,
    delayHours: 24,
    isActive: true,
  },
  {
    attemptNumber: 2,
    name: "Value Reinforcement",
    promptInstructions:
      "Write a follow-up SMS that reinforces the value of the service quoted. " +
      "Mention one specific benefit relevant to their service type (e.g. energy savings for HVAC, " +
      "water damage prevention for plumbing). " +
      "Acknowledge that they may have questions and offer a quick call. " +
      "Tone should be helpful and professional, not pushy.",
    tone: "professional",
    maxChars: 320,
    forbiddenPhrases: [],
    approvalRequired: false,
    delayHours: 72,
    isActive: true,
  },
  {
    attemptNumber: 3,
    name: "Final Offer",
    promptInstructions:
      "Write a final follow-up SMS. Create mild urgency — mention that scheduling slots are filling up " +
      "or that the estimate is valid for a limited time (do not invent specific deadlines). " +
      "Keep it brief and direct. Include a clear call-to-action to book now. " +
      "Do not be aggressive or use high-pressure language.",
    tone: "urgent",
    maxChars: 320,
    forbiddenPhrases: ["guaranteed", "cheapest", "best price"],
    approvalRequired: true, // Final attempt requires owner approval by default
    delayHours: 168, // 7 days
    isActive: true,
  },
];

// ─── Template CRUD ────────────────────────────────────────────────────────────

export async function getTemplatesForBusiness(businessId: number): Promise<FollowupTemplate[]> {
  const db = await requireDb();
  const existing = await db
    .select()
    .from(followupTemplates)
    .where(eq(followupTemplates.businessId, businessId))
    .orderBy(asc(followupTemplates.attemptNumber));

  // Seed defaults if none exist
  if (existing.length === 0) {
    for (const tmpl of DEFAULT_TEMPLATES) {
      await db.insert(followupTemplates).values({ ...tmpl, businessId });
    }
    return db
      .select()
      .from(followupTemplates)
      .where(eq(followupTemplates.businessId, businessId))
      .orderBy(asc(followupTemplates.attemptNumber));
  }

  return existing;
}

export async function saveTemplate(
  businessId: number,
  data: {
    id?: number;
    attemptNumber: number;
    name: string;
    promptInstructions: string;
    tone: "friendly" | "professional" | "urgent";
    maxChars: number;
    forbiddenPhrases: string[];
    approvalRequired: boolean;
    delayHours: number;
    isActive: boolean;
  }
): Promise<FollowupTemplate> {
  const db = await requireDb();

  if (data.id) {
    await db
      .update(followupTemplates)
      .set({
        name: data.name,
        promptInstructions: data.promptInstructions,
        tone: data.tone,
        maxChars: data.maxChars,
        forbiddenPhrases: data.forbiddenPhrases,
        approvalRequired: data.approvalRequired,
        delayHours: data.delayHours,
        isActive: data.isActive,
      })
      .where(and(eq(followupTemplates.id, data.id), eq(followupTemplates.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(followupTemplates)
      .where(eq(followupTemplates.id, data.id))
      .limit(1);
    return updated;
  }

  await db.insert(followupTemplates).values({ ...data, businessId });
  const [created] = await db
    .select()
    .from(followupTemplates)
    .where(
      and(
        eq(followupTemplates.businessId, businessId),
        eq(followupTemplates.attemptNumber, data.attemptNumber)
      )
    )
    .orderBy(desc(followupTemplates.createdAt))
    .limit(1);
  return created;
}

// ─── A/B Variant CRUD ─────────────────────────────────────────────────────────

export async function getVariantsForTemplate(templateId: number): Promise<FollowupAbVariant[]> {
  const db = await requireDb();
  return db
    .select()
    .from(followupAbVariants)
    .where(eq(followupAbVariants.templateId, templateId))
    .orderBy(asc(followupAbVariants.variantLabel));
}

export async function saveVariant(
  templateId: number,
  data: { id?: number; variantLabel: "A" | "B"; promptInstructions: string }
): Promise<FollowupAbVariant> {
  const db = await requireDb();

  if (data.id) {
    await db
      .update(followupAbVariants)
      .set({ promptInstructions: data.promptInstructions })
      .where(eq(followupAbVariants.id, data.id));
    const [updated] = await db
      .select()
      .from(followupAbVariants)
      .where(eq(followupAbVariants.id, data.id))
      .limit(1);
    return updated;
  }

  await db.insert(followupAbVariants).values({ templateId, ...data });
  const [created] = await db
    .select()
    .from(followupAbVariants)
    .where(
      and(
        eq(followupAbVariants.templateId, templateId),
        eq(followupAbVariants.variantLabel, data.variantLabel)
      )
    )
    .orderBy(desc(followupAbVariants.createdAt))
    .limit(1);
  return created;
}

// ─── AI Message Generation ────────────────────────────────────────────────────

export async function generateFollowupMessage(opts: {
  promptInstructions: string;
  tone: string;
  maxChars: number;
  forbiddenPhrases: string[];
  customerName: string;
  serviceDescription: string;
  estimateAmount?: string;
  attemptNumber: number;
  businessName: string;
}): Promise<string> {
  const forbidden =
    opts.forbiddenPhrases.length > 0
      ? `\nNEVER use these phrases: ${opts.forbiddenPhrases.join(", ")}`
      : "";

  const systemPrompt = `You are an SMS follow-up assistant for ${opts.businessName}, a home services company.
You write concise, ${opts.tone} SMS messages to follow up on unsigned estimates.
Keep messages under ${opts.maxChars} characters.
Do not use emojis unless they feel natural for the tone.
Always sign off with the business name.${forbidden}`;

  const userPrompt = `Write a follow-up SMS (attempt #${opts.attemptNumber}) for:
Customer: ${opts.customerName}
Service: ${opts.serviceDescription}
${opts.estimateAmount ? `Estimate amount: ${opts.estimateAmount}` : ""}

Instructions: ${opts.promptInstructions}

Return ONLY the SMS text, nothing else.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text =
    typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content.trim()
      : "";

  // Enforce max character limit
  return text.length > opts.maxChars ? text.slice(0, opts.maxChars - 3) + "..." : text;
}

// ─── Queue Management ─────────────────────────────────────────────────────────

export interface EnqueueFollowupOpts {
  businessId: number;
  leadId?: number;
  templateId: number;
  variantId?: number;
  attemptNumber: number;
  estimateId?: string;
  customerName: string;
  customerPhone: string;
  estimateAmount?: string;
  serviceDescription: string;
  generatedMessage: string;
  approvalRequired: boolean;
  scheduledAt: Date;
}

export async function enqueueFollowup(opts: EnqueueFollowupOpts): Promise<EstimateFollowupQueue> {
  const db = await requireDb();

  await db.insert(estimateFollowupQueue).values({
    businessId: opts.businessId,
    leadId: opts.leadId ?? null,
    templateId: opts.templateId,
    variantId: opts.variantId ?? null,
    attemptNumber: opts.attemptNumber,
    estimateId: opts.estimateId ?? null,
    customerName: opts.customerName,
    customerPhone: opts.customerPhone,
    estimateAmount: opts.estimateAmount ?? null,
    serviceDescription: opts.serviceDescription,
    generatedMessage: opts.generatedMessage,
    status: opts.approvalRequired ? "pending_approval" : "approved",
    scheduledAt: opts.scheduledAt,
  });

  const [created] = await db
    .select()
    .from(estimateFollowupQueue)
    .where(eq(estimateFollowupQueue.businessId, opts.businessId))
    .orderBy(desc(estimateFollowupQueue.createdAt))
    .limit(1);

  return created;
}

export async function getQueue(
  businessId: number,
  status?: EstimateFollowupQueue["status"]
): Promise<EstimateFollowupQueue[]> {
  const db = await requireDb();
  const conditions = [eq(estimateFollowupQueue.businessId, businessId)];
  if (status) conditions.push(eq(estimateFollowupQueue.status, status));

  return db
    .select()
    .from(estimateFollowupQueue)
    .where(and(...conditions))
    .orderBy(desc(estimateFollowupQueue.scheduledAt));
}

export async function approveQueueItem(
  id: number,
  businessId: number
): Promise<{ success: boolean; smsSent: boolean; error?: string }> {
  const db = await requireDb();

  const [item] = await db
    .select()
    .from(estimateFollowupQueue)
    .where(and(eq(estimateFollowupQueue.id, id), eq(estimateFollowupQueue.businessId, businessId)))
    .limit(1);

  if (!item) return { success: false, smsSent: false, error: "Queue item not found" };
  if (!item.generatedMessage) return { success: false, smsSent: false, error: "No message to send" };

  // Mark approved
  await db
    .update(estimateFollowupQueue)
    .set({ status: "approved" })
    .where(eq(estimateFollowupQueue.id, id));

  // Send via Plivo
  const smsResult = await sendSms({
    businessId,
    toNumber: item.customerPhone!,
    body: item.generatedMessage,
    leadId: item.leadId ?? undefined,
    messageType: "followup",
  });

  if (smsResult.success) {
    await db
      .update(estimateFollowupQueue)
      .set({ status: "sent", sentAt: new Date(), smsLogId: smsResult.logId ?? null })
      .where(eq(estimateFollowupQueue.id, id));

    // Increment A/B variant send count
    if (item.variantId) {
      await db
        .update(followupAbVariants)
        .set({ sendCount: db.select().from(followupAbVariants) as any })
        .where(eq(followupAbVariants.id, item.variantId));
    }

    return { success: true, smsSent: true };
  } else {
    await db
      .update(estimateFollowupQueue)
      .set({ status: "failed" })
      .where(eq(estimateFollowupQueue.id, id));
    return { success: false, smsSent: false, error: smsResult.error };
  }
}

export async function rejectQueueItem(id: number, businessId: number): Promise<boolean> {
  const db = await requireDb();
  await db
    .update(estimateFollowupQueue)
    .set({ status: "rejected" })
    .where(and(eq(estimateFollowupQueue.id, id), eq(estimateFollowupQueue.businessId, businessId)));
  return true;
}

export async function updateGeneratedMessage(
  id: number,
  businessId: number,
  newMessage: string
): Promise<boolean> {
  const db = await requireDb();
  await db
    .update(estimateFollowupQueue)
    .set({ generatedMessage: newMessage })
    .where(and(eq(estimateFollowupQueue.id, id), eq(estimateFollowupQueue.businessId, businessId)));
  return true;
}

export async function markResultedInBooking(
  leadId: number,
  businessId: number
): Promise<void> {
  const db = await requireDb();
  await db
    .update(estimateFollowupQueue)
    .set({ resultedInBooking: true })
    .where(
      and(
        eq(estimateFollowupQueue.leadId, leadId),
        eq(estimateFollowupQueue.businessId, businessId),
        eq(estimateFollowupQueue.status, "sent")
      )
    );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getFollowupStats(businessId: number) {
  const db = await requireDb();
  const all = await db
    .select()
    .from(estimateFollowupQueue)
    .where(eq(estimateFollowupQueue.businessId, businessId));

  const total = all.length;
  const sent = all.filter((r) => r.status === "sent").length;
  const pending = all.filter((r) => r.status === "pending_approval").length;
  const converted = all.filter((r) => r.resultedInBooking).length;
  const conversionRate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

  return { total, sent, pending, converted, conversionRate };
}
