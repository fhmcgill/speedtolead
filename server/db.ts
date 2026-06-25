import { eq, desc, and, sql, count, avg, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  businesses, InsertBusiness,
  leads, InsertLead,
  conversations, InsertConversation,
  messages, InsertMessage,
  teamMembers, InsertTeamMember,
  leadSources, InsertLeadSource,
  followUpSequences, InsertFollowUpSequence,
  followUpTasks, InsertFollowUpTask,
  availabilitySlots, InsertAvailabilitySlot,
  bookings, InsertBooking,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Businesses ──────────────────────────────────────────────────────────────
export async function createBusiness(data: InsertBusiness) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(businesses).values(data);
  return { id: result[0].insertId };
}

export async function getBusinessByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).limit(1);
  return result[0] ?? null;
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateBusiness(id: number, data: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

// ─── Team Members ────────────────────────────────────────────────────────────
export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teamMembers).values(data);
  return { id: result[0].insertId };
}

export async function getTeamMembersByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.businessId, businessId));
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

// ─── Leads ───────────────────────────────────────────────────────────────────
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return { id: result[0].insertId };
}

export async function getLeadsByBusiness(businessId: number, statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter && statusFilter !== "all") {
    return db.select().from(leads)
      .where(and(eq(leads.businessId, businessId), eq(leads.status, statusFilter as any)))
      .orderBy(desc(leads.createdAt));
  }
  return db.select().from(leads).where(eq(leads.businessId, businessId)).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

// ─── Conversations ───────────────────────────────────────────────────────────
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(conversations).values(data);
  return { id: result[0].insertId };
}

export async function getConversationsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.businessId, businessId)).orderBy(desc(conversations.lastMessageAt));
}

export async function getConversationByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations).where(eq(conversations.leadId, leadId)).limit(1);
  return result[0] ?? null;
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ─── Messages ────────────────────────────────────────────────────────────────
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  return { id: result[0].insertId };
}

export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ─── Lead Sources ────────────────────────────────────────────────────────────
export async function createLeadSource(data: InsertLeadSource) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leadSources).values(data);
  return { id: result[0].insertId };
}

export async function getLeadSourcesByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadSources).where(eq(leadSources.businessId, businessId));
}

export async function updateLeadSource(id: number, data: Partial<InsertLeadSource>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leadSources).set(data).where(eq(leadSources.id, id));
}

// ─── Follow-Up Sequences ─────────────────────────────────────────────────────
export async function createFollowUpSequence(data: InsertFollowUpSequence) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(followUpSequences).values(data);
  return { id: result[0].insertId };
}

export async function getFollowUpSequencesByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpSequences).where(eq(followUpSequences.businessId, businessId));
}

export async function updateFollowUpSequence(id: number, data: Partial<InsertFollowUpSequence>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(followUpSequences).set(data).where(eq(followUpSequences.id, id));
}

export async function getFollowUpSequenceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(followUpSequences).where(eq(followUpSequences.id, id)).limit(1);
  return result[0];
}
export async function deleteFollowUpSequence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(followUpSequences).where(eq(followUpSequences.id, id));
}

// ─── Follow-Up Tasks ─────────────────────────────────────────────────────────
export async function createFollowUpTask(data: InsertFollowUpTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(followUpTasks).values(data);
  return { id: result[0].insertId };
}

export async function cancelFollowUpTasksForLead(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(followUpTasks).set({ status: "cancelled" }).where(and(eq(followUpTasks.leadId, leadId), eq(followUpTasks.status, "pending")));
}
export async function getPendingFollowUpTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpTasks).where(and(eq(followUpTasks.status, "pending"), lte(followUpTasks.scheduledAt, new Date())));
}
export async function markFollowUpTaskSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(followUpTasks).set({ status: "sent", sentAt: new Date() }).where(eq(followUpTasks.id, id));
}
export async function getFollowUpTasksByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpTasks).where(eq(followUpTasks.leadId, leadId));
}

// ─── Availability Slots ──────────────────────────────────────────────────────
export async function createAvailabilitySlot(data: InsertAvailabilitySlot) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(availabilitySlots).values(data);
  return { id: result[0].insertId };
}

export async function getAvailabilitySlotsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(availabilitySlots).where(eq(availabilitySlots.businessId, businessId));
}

export async function updateAvailabilitySlot(id: number, data: Partial<InsertAvailabilitySlot>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(availabilitySlots).set(data).where(eq(availabilitySlots.id, id));
}

export async function deleteAvailabilitySlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bookings).values(data);
  return { id: result[0].insertId };
}

export async function getBookingsByBusiness(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.businessId, businessId)).orderBy(desc(bookings.createdAt));
}

// ─── KPI Helpers ─────────────────────────────────────────────────────────────
export async function getLeadStats(businessId: number) {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, qualified: 0, booked: 0, lost: 0, avgResponseMs: 0 };
  const allLeads = await db.select().from(leads).where(eq(leads.businessId, businessId));
  const total = allLeads.length;
  const newCount = allLeads.filter(l => l.status === "new").length;
  const qualified = allLeads.filter(l => l.status === "qualified").length;
  const booked = allLeads.filter(l => l.status === "booked").length;
  const lost = allLeads.filter(l => l.status === "lost").length;
  const responseTimes = allLeads.filter(l => l.responseTimeMs != null).map(l => l.responseTimeMs!);
  const avgResponseMs = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  return { total, new: newCount, qualified, booked, lost, avgResponseMs };
}

export async function getBookingStats(businessId: number) {
  const db = await getDb();
  if (!db) return { total: 0, confirmed: 0, completed: 0, cancelled: 0 };
  const allBookings = await db.select().from(bookings).where(eq(bookings.businessId, businessId));
  return {
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === "confirmed").length,
    completed: allBookings.filter(b => b.status === "completed").length,
    cancelled: allBookings.filter(b => b.status === "cancelled").length,
  };
}

// ─── Inbound SMS helpers ────────────────────────────────────────────────────
/** Normalise a phone number to digits-only E.164 (US assumed if 10 digits) */
function normalisePhoneDb(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export async function getLeadByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalised = normalisePhoneDb(phone);
  // Try both the normalised form and the raw form so stored variants are matched
  const candidates = normalised !== phone
    ? [normalised, phone]
    : [phone];
  for (const candidate of candidates) {
    const result = await db
      .select()
      .from(leads)
      .where(eq(leads.customerPhone, candidate))
      .orderBy(desc(leads.createdAt))
      .limit(1);
    if (result[0]) return result[0];
  }
  return undefined;
}

export async function getLeadsByPhone(phone: string) {
  const db = await getDb();
  if (!db) return [];
  const normalised = normalisePhoneDb(phone);
  if (normalised !== phone) {
    return db.select().from(leads)
      .where(or(eq(leads.customerPhone, normalised), eq(leads.customerPhone, phone)))
      .orderBy(desc(leads.createdAt));
  }
  return db.select().from(leads).where(eq(leads.customerPhone, phone)).orderBy(desc(leads.createdAt));
}

// ─── Stripe / Subscription ──────────────────────────────────────────────────
export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
  return result[0] ?? undefined;
}

export async function updateUserStripe(userId: number, data: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set(data as any).where(eq(users.id, userId));
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    stripeCustomerId: users.stripeCustomerId,
    stripeSubscriptionId: users.stripeSubscriptionId,
    subscriptionPlan: users.subscriptionPlan,
    subscriptionStatus: users.subscriptionStatus,
  }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}
