/**
 * googleLsaSync.ts — Google Local Services Ads lead + conversation sync.
 *
 * This is poll-based, not webhook-based: Google's Local Services resources
 * (local_services_lead, local_services_lead_conversation) are queried via
 * GAQL on the regular Google Ads API. There is no LSA-specific push/webhook
 * mechanism for third parties, so this module is meant to be invoked
 * periodically by an external scheduler hitting the cron-secret-protected
 * route registered in index.ts, not by an inbound webhook.
 *
 * Per-business config (a connected business's own Google Ads customer ID and
 * the OAuth refresh token granting access to it) lives in
 * lead_sources.config -- see _core/googleAdsClient.ts for why that's split
 * from the global env vars.
 *
 * ⚠️  VERIFICATION NEEDED ONCE LIVE CREDENTIALS EXIST:
 * The GAQL field names below (local_services_lead.*, local_services_lead_
 * conversation.*) are confirmed against Google's official API docs. The
 * request shape passed to `appendLeadConversation()` (sendLsaReply, below)
 * is informed by the consistent operation-wrapper pattern used elsewhere in
 * the Google Ads API, but could not be confirmed against a live response --
 * this sandbox has no Google Ads credentials to test against. Run a real
 * sync once credentials exist and adjust that one function if the request
 * is rejected; everything else (queries, DB mapping, AI reply trigger) does
 * not depend on that uncertainty and should work as written.
 */

import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { getGoogleAdsCustomer } from "./_core/googleAdsClient";

type LsaConfig = {
  customerId: string;
  refreshToken: string;
};

function parseLsaConfig(config: Record<string, string> | null | undefined): LsaConfig | null {
  if (!config?.customerId || !config?.refreshToken) return null;
  return { customerId: config.customerId, refreshToken: config.refreshToken };
}

// ─── Reading leads + conversations from Google ────────────────────────────────

type RawLsaLead = {
  local_services_lead: {
    resource_name: string;
    id: string;
    lead_type: string; // "MESSAGE" | "PHONE_CALL" | "BOOKING" | ...
    lead_status: string;
    category_id?: string;
    creation_date_time: string; // "YYYY-MM-DD HH:MM:SS"
    contact_details?: {
      // Field names confirmed to exist on ContactDetails; exact casing/path
      // for name/email beyond phone_number not fully confirmed -- see header.
      phone_number?: string;
      consumer_name?: string;
      consumer_email?: string;
    };
  };
};

async function fetchLsaLeads(opts: LsaConfig, sinceDays = 14): Promise<RawLsaLead[]> {
  const customer = getGoogleAdsCustomer(opts);
  const query = `
    SELECT
      local_services_lead.resource_name,
      local_services_lead.id,
      local_services_lead.lead_type,
      local_services_lead.lead_status,
      local_services_lead.category_id,
      local_services_lead.creation_date_time,
      local_services_lead.contact_details
    FROM local_services_lead
    WHERE local_services_lead.creation_date_time >= '${sinceDaysClause(sinceDays)}'
  `;
  return customer.query<RawLsaLead[]>(query);
}

type RawLsaConversationEntry = {
  local_services_lead_conversation: {
    id: string;
    conversation_channel: string; // "MESSAGE" | "PHONE_CALL" | "EMAIL" | ...
    lead: string; // resource name of the parent local_services_lead
    event_date_time: string;
    message_details?: { text?: string };
  };
};

async function fetchLeadConversations(
  opts: LsaConfig,
  leadResourceName: string
): Promise<RawLsaConversationEntry[]> {
  const customer = getGoogleAdsCustomer(opts);
  const query = `
    SELECT
      local_services_lead_conversation.id,
      local_services_lead_conversation.conversation_channel,
      local_services_lead_conversation.lead,
      local_services_lead_conversation.event_date_time,
      local_services_lead_conversation.message_details.text
    FROM local_services_lead_conversation
    WHERE local_services_lead_conversation.lead = '${leadResourceName}'
    ORDER BY local_services_lead_conversation.event_date_time ASC
  `;
  return customer.query<RawLsaConversationEntry[]>(query);
}

function sinceDaysClause(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ─── Sending a reply back through Google ──────────────────────────────────────

/**
 * Append an AI/team reply to a Google LSA message-lead conversation.
 * ⚠️ Request shape not yet verified against a live response -- see header.
 */
export async function sendLsaReply(
  opts: LsaConfig,
  leadResourceName: string,
  text: string
): Promise<void> {
  const customer = getGoogleAdsCustomer(opts);

  await customer.localsLeadServices.appendLeadConversation({
    customer_id: opts.customerId,
    conversation: {
      lead: leadResourceName,
      conversation_channel: "MESSAGE",
      message_details: { text },
    },
  } as any); // cast: exact request type pending live verification, see header
}

// ─── Sync: pull leads + conversations into our own schema ─────────────────────

export async function syncGoogleLsaLeadsForBusiness(businessId: number): Promise<{
  leadsCreated: number;
  messagesCreated: number;
  repliesSent: number;
}> {
  let leadsCreated = 0;
  let messagesCreated = 0;
  let repliesSent = 0;

  const sources = await db.getLeadSourcesByBusiness(businessId);
  const lsaSource = sources.find((s) => s.sourceType === "google_lsa" && s.isConnected);
  const config = parseLsaConfig(lsaSource?.config as Record<string, string> | null);
  if (!lsaSource || !config) {
    console.warn(`[GoogleLSA] Business ${businessId} has no connected google_lsa lead source`);
    return { leadsCreated, messagesCreated, repliesSent };
  }

  const business = await db.getBusinessById(businessId);
  if (!business) return { leadsCreated, messagesCreated, repliesSent };

  const rawLeads = await fetchLsaLeads(config);

  for (const row of rawLeads) {
    const raw = row.local_services_lead;
    const externalId = raw.resource_name;

    // 1. Find or create the lead
    let lead = await db.getLeadByExternalId(externalId);
    if (!lead) {
      const created = await db.createLead({
        businessId,
        sourceType: "google_lsa",
        externalId,
        customerName: raw.contact_details?.consumer_name ?? null,
        customerEmail: raw.contact_details?.consumer_email ?? null,
        customerPhone: raw.contact_details?.phone_number ?? null,
        serviceNeeded: raw.category_id ?? null,
        status: "new",
        aiActive: true,
      });
      lead = await db.getLeadById(created.id);
      leadsCreated++;
    }
    if (!lead) continue;

    // Only MESSAGE-type leads have a text conversation an LLM can reply to.
    // PHONE_CALL and BOOKING leads still get synced above (for visibility in
    // the dashboard/stats), but are skipped here.
    if (raw.lead_type !== "MESSAGE") continue;

    // 2. Find or create the conversation
    let conv = await db.getConversationByLeadId(lead.id);
    if (!conv) {
      const created = await db.createConversation({
        leadId: lead.id,
        businessId,
        channel: "google_lsa",
        aiActive: true,
      });
      conv = await db.getConversationById(created.id);
    }
    if (!conv) continue;

    // 3. Sync conversation entries, dedup'd by externalId
    const entries = await fetchLeadConversations(config, externalId);
    let newestCustomerMessageId: number | null = null;

    for (const entry of entries) {
      const c = entry.local_services_lead_conversation;
      if (c.conversation_channel !== "MESSAGE" || !c.message_details?.text) continue;

      const msgExternalId = c.id;
      const existing = await db.getMessageByExternalId(msgExternalId);
      if (existing) continue;

      const { id: messageId } = await db.createMessage({
        conversationId: conv.id,
        senderType: "customer",
        content: c.message_details.text,
        externalId: msgExternalId,
      });
      messagesCreated++;
      newestCustomerMessageId = messageId;
    }

    await db.updateConversation(conv.id, { lastMessageAt: new Date() });

    // 4. If there's a new customer message and AI is active, generate + send a reply
    if (newestCustomerMessageId && conv.aiActive) {
      try {
        const sent = await triggerAIReplyForLsaLead(config, business, lead, conv, externalId);
        if (sent) repliesSent++;
      } catch (err) {
        console.error(`[GoogleLSA] AI reply failed for lead ${externalId}:`, err);
      }
    }
  }

  await db.updateLeadSource(lsaSource.id, { lastSyncAt: new Date() });

  return { leadsCreated, messagesCreated, repliesSent };
}

async function triggerAIReplyForLsaLead(
  config: LsaConfig,
  business: any,
  lead: any,
  conv: any,
  leadResourceName: string
): Promise<boolean> {
  const systemPrompt = buildLsaSystemPrompt(business, lead);
  const recentMessages = await db.getMessagesByConversation(conv.id);
  const history = recentMessages.slice(-10).map((m: any) => ({
    role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
    content: m.content as string,
  }));

  const response = await invokeLLM({
    messages: [{ role: "system", content: systemPrompt }, ...history],
  });

  const aiText =
    typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content.trim()
      : "";

  if (!aiText) return false;

  await db.createMessage({
    conversationId: conv.id,
    content: aiText,
    senderType: "ai",
  });
  await db.updateConversation(conv.id, { lastMessageAt: new Date() });

  await sendLsaReply(config, leadResourceName, aiText);
  return true;
}

function buildLsaSystemPrompt(business: any, lead: any): string {
  const categories =
    business.serviceCategories?.length > 0
      ? business.serviceCategories.join(", ")
      : "general home services";

  let prompt = `You are an AI assistant for ${business.name}, a home service company specializing in ${categories}.
Respond to a customer message lead from Google Local Services Ads. Be concise, helpful, and aim to book appointments.
Tone: ${business.aiTone || "professional"}.`;

  if (business.aiContext) prompt += `\n\nBusiness context:\n${business.aiContext}`;
  if (business.aiPromptInstructions) prompt += `\n\nInstructions:\n${business.aiPromptInstructions}`;
  if (lead?.serviceNeeded) prompt += `\n\nService category: ${lead.serviceNeeded}`;

  prompt += "\n\nKeep responses concise and never make up pricing.";
  return prompt;
}

// ─── Entry point for the cron route ────────────────────────────────────────────

export async function syncGoogleLsaLeadsForAllConnectedBusinesses() {
  const sources = await db.getConnectedLeadSourcesByType("google_lsa");
  const results: Array<{ businessId: number; leadsCreated: number; messagesCreated: number; repliesSent: number }> = [];

  for (const source of sources) {
    try {
      const result = await syncGoogleLsaLeadsForBusiness(source.businessId);
      results.push({ businessId: source.businessId, ...result });
    } catch (err) {
      console.error(`[GoogleLSA] Sync failed for business ${source.businessId}:`, err);
    }
  }

  return results;
}
