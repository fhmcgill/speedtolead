/**
 * messaging.ts — Plivo SMS delivery layer for LeadHammer
 */

import plivo from "plivo";
import { getDb } from "./db";
import { smsLogs, messagingSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

const client = new plivo.Client(ENV.plivoAuthId, ENV.plivoAuthToken);

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

export interface SendSmsOptions {
  businessId: number;
  toNumber: string;
  body: string;
  leadId?: number;
  conversationId?: number;
  /** Optional tag for log categorisation (e.g. "ai_reply", "followup", "manual") */
  messageType?: string;
}

export interface SendSmsResult {
  success: boolean;
  plivoMessageUuid?: string;
  error?: string;
  logId?: number;
}

/** Normalise a phone number to E.164 digits-only (US assumed if no country code) */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

/** Check whether a number has opted out for a given business */
export async function isOptedOut(businessId: number, toNumber: string): Promise<boolean> {
  const db = await requireDb();
  const settings = await db
    .select()
    .from(messagingSettings)
    .where(eq(messagingSettings.businessId, businessId))
    .limit(1);

  if (!settings.length) return false;
  const optedOut: string[] = (settings[0].optedOutNumbers as string[]) ?? [];
  return optedOut.includes(normalisePhone(toNumber));
}

/** Get or create messaging settings for a business */
export async function getOrCreateMessagingSettings(businessId: number) {
  const db = await requireDb();
  const existing = await db
    .select()
    .from(messagingSettings)
    .where(eq(messagingSettings.businessId, businessId))
    .limit(1);

  if (existing.length) return existing[0];

  await db.insert(messagingSettings).values({
    businessId,
    smsEnabled: true,
    fromNumber: ENV.plivoFromNumber,
    optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT", "CANCEL", "END"],
    optedOutNumbers: [],
    dailySendLimit: 200,
  });

  const created = await db
    .select()
    .from(messagingSettings)
    .where(eq(messagingSettings.businessId, businessId))
    .limit(1);

  return created[0];
}

/** Send an SMS via Plivo and log the result */
export async function sendSms(opts: SendSmsOptions): Promise<SendSmsResult> {
  const db = await requireDb();
  const { businessId, toNumber, body, leadId, conversationId } = opts;

  const normalised = normalisePhone(toNumber);
  const fromNumber = normalisePhone(ENV.plivoFromNumber);

  // Check opt-out
  const optedOut = await isOptedOut(businessId, normalised);
  if (optedOut) {
    return { success: false, error: "Recipient has opted out of SMS messages." };
  }

  // Insert a queued log entry
  const [logInsert] = await db.insert(smsLogs).values({
    businessId,
    leadId: leadId ?? null,
    conversationId: conversationId ?? null,
    direction: "outbound",
    toNumber: normalised,
    fromNumber,
    body,
    status: "queued",
  });

  const logId = (logInsert as any).insertId as number;

  try {
    const response = await client.messages.create(fromNumber, normalised, body);

    const uuid =
      (response as any).messageUuid?.[0] ??
      (response as any).message_uuid?.[0] ??
      "";

    await db
      .update(smsLogs)
      .set({ status: "sent", plivoMessageUuid: uuid, sentAt: new Date() })
      .where(eq(smsLogs.id, logId));

    return { success: true, plivoMessageUuid: uuid, logId };
  } catch (err: any) {
    const errorMessage = err?.message ?? String(err);

    await db
      .update(smsLogs)
      .set({ status: "failed", errorMessage })
      .where(eq(smsLogs.id, logId));

    return { success: false, error: errorMessage, logId };
  }
}

/** Process an inbound opt-out keyword and record it */
export async function handleOptOut(
  businessId: number,
  fromNumber: string,
  body: string
): Promise<boolean> {
  const db = await requireDb();
  const settings = await getOrCreateMessagingSettings(businessId);
  const keywords: string[] =
    (settings.optOutKeywords as string[]) ?? ["STOP", "UNSUBSCRIBE", "QUIT", "CANCEL", "END"];
  const trimmed = body.trim().toUpperCase();

  if (!keywords.includes(trimmed)) return false;

  const normalised = normalisePhone(fromNumber);
  const optedOut: string[] = (settings.optedOutNumbers as string[]) ?? [];

  if (!optedOut.includes(normalised)) {
    await db
      .update(messagingSettings)
      .set({ optedOutNumbers: [...optedOut, normalised] })
      .where(eq(messagingSettings.businessId, businessId));
  }

  return true;
}
