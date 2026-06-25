import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock db module ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getBusinessByOwnerId: vi.fn(),
  createBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  getBusinessById: vi.fn(),
  getTeamMembersByBusiness: vi.fn(),
  createTeamMember: vi.fn(),
  updateTeamMember: vi.fn(),
  deleteTeamMember: vi.fn(),
  getLeadsByBusiness: vi.fn(),
  getLeadById: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  getConversationsByBusiness: vi.fn(),
  getConversationById: vi.fn(),
  createConversation: vi.fn(),
  updateConversation: vi.fn(),
  getMessagesByConversation: vi.fn(),
  createMessage: vi.fn(),
  cancelFollowUpTasksForLead: vi.fn(),
  getLeadSourcesByBusiness: vi.fn(),
  createLeadSource: vi.fn(),
  updateLeadSource: vi.fn(),
  getFollowUpSequencesByBusiness: vi.fn(),
  createFollowUpSequence: vi.fn(),
  updateFollowUpSequence: vi.fn(),
  deleteFollowUpSequence: vi.fn(),
  getAvailabilitySlotsByBusiness: vi.fn(),
  createAvailabilitySlot: vi.fn(),
  updateAvailabilitySlot: vi.fn(),
  deleteAvailabilitySlot: vi.fn(),
  getBookingsByBusiness: vi.fn(),
  createBooking: vi.fn(),
  getLeadStats: vi.fn(),
  getBookingStats: vi.fn(),
  getFollowUpSequenceById: vi.fn(),
  createFollowUpTask: vi.fn(),
  getPendingFollowUpTasks: vi.fn(),
  markFollowUpTaskSent: vi.fn(),
  getFollowUpTasksByLead: vi.fn(),
  getUserByStripeCustomerId: vi.fn(),
  updateUserStripe: vi.fn(),
  getUserSubscription: vi.fn(),
}));

// ─── Mock LLM ────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Thank you for reaching out! I'd be happy to help with your AC repair." } }],
  }),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createProtectedContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "owner@hvacpro.com",
    name: "Test Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Business Profile Tests ──────────────────────────────────────────────────
describe("business", () => {
  it("returns null when no business exists for user", async () => {
    (db.getBusinessByOwnerId as any).mockResolvedValue(null);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.business.get();
    expect(result).toBeNull();
    expect(db.getBusinessByOwnerId).toHaveBeenCalledWith(1);
  });

  it("creates a business profile", async () => {
    (db.getBusinessByOwnerId as any).mockResolvedValue(null);
    (db.createBusiness as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.business.create({
      name: "HVAC Pro",
      phone: "555-0100",
      email: "info@hvacpro.com",
      serviceCategories: ["HVAC", "Plumbing"],
      timezone: "America/New_York",
    });
    expect(result).toEqual({ id: 1 });
    expect(db.createBusiness).toHaveBeenCalledWith(expect.objectContaining({
      name: "HVAC Pro",
      ownerId: 1,
    }));
  });

  it("prevents duplicate business creation", async () => {
    (db.getBusinessByOwnerId as any).mockResolvedValue({ id: 1, name: "Existing" });
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(caller.business.create({ name: "Duplicate" })).rejects.toThrow("Business already exists");
  });

  it("updates business profile with AI config", async () => {
    (db.updateBusiness as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.business.update({
      id: 1,
      aiContext: "We are a 20-year HVAC company in Phoenix",
      aiTone: "friendly",
      aiPromptInstructions: "Always mention 24/7 service",
      aiResponseRules: ["Ask for address", "Offer free estimate"],
      aiUnsupportedReply: "Sorry, we only handle HVAC and plumbing.",
    });
    expect(result).toEqual({ success: true });
    expect(db.updateBusiness).toHaveBeenCalledWith(1, expect.objectContaining({
      aiContext: "We are a 20-year HVAC company in Phoenix",
      aiTone: "friendly",
    }));
  });

  it("updates availability mode to servicetitan", async () => {
    (db.updateBusiness as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.business.update({
      id: 1,
      availabilityMode: "servicetitan",
      serviceTitanConfig: { tenantId: "t123", clientId: "c456" },
    });
    expect(result).toEqual({ success: true });
    expect(db.updateBusiness).toHaveBeenCalledWith(1, expect.objectContaining({
      availabilityMode: "servicetitan",
    }));
  });
});

// ─── Team Members Tests ──────────────────────────────────────────────────────
describe("team", () => {
  it("lists team members for a business", async () => {
    const members = [
      { id: 1, name: "Alice", role: "owner", isActive: true },
      { id: 2, name: "Bob", role: "team_member", isActive: true },
    ];
    (db.getTeamMembersByBusiness as any).mockResolvedValue(members);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.team.list({ businessId: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
  });

  it("creates a team member with role", async () => {
    (db.createTeamMember as any).mockResolvedValue({ id: 3 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.team.create({
      businessId: 1,
      name: "Charlie",
      email: "charlie@test.com",
      role: "team_member",
    });
    expect(result).toEqual({ id: 3 });
  });

  it("deletes a team member", async () => {
    (db.deleteTeamMember as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.team.delete({ id: 2 });
    expect(result).toEqual({ success: true });
    expect(db.deleteTeamMember).toHaveBeenCalledWith(2);
  });
});

// ─── Leads Tests ─────────────────────────────────────────────────────────────
describe("leads", () => {
  it("lists leads for a business", async () => {
    const mockLeads = [
      { id: 1, customerName: "John", status: "new" },
      { id: 2, customerName: "Jane", status: "qualified" },
    ];
    (db.getLeadsByBusiness as any).mockResolvedValue(mockLeads);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.leads.list({ businessId: 1 });
    expect(result).toHaveLength(2);
  });

  it("creates a lead and associated conversation", async () => {
    (db.createLead as any).mockResolvedValue({ id: 10 });
    (db.createConversation as any).mockResolvedValue({ id: 20 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.leads.create({
      businessId: 1,
      customerName: "Mike",
      customerEmail: "mike@example.com",
      serviceNeeded: "AC repair",
      sourceType: "yelp",
    });
    expect(result).toEqual({ leadId: 10, conversationId: 20 });
    expect(db.createConversation).toHaveBeenCalledWith(expect.objectContaining({
      leadId: 10,
      aiActive: true,
    }));
  });

  it("updates lead status to booked and cancels follow-ups", async () => {
    (db.updateLead as any).mockResolvedValue(undefined);
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.leads.updateStatus({ id: 5, status: "booked" });
    expect(result).toEqual({ success: true });
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
    expect(db.updateLead).toHaveBeenCalledWith(5, expect.objectContaining({
      status: "booked",
      bookedAt: expect.any(Date),
    }));
  });

  it("updates lead status to lost and cancels follow-ups", async () => {
    (db.updateLead as any).mockResolvedValue(undefined);
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.leads.updateStatus({ id: 6, status: "lost" });
    expect(result).toEqual({ success: true });
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(6);
  });

  it("assigns a lead to a team member", async () => {
    (db.updateLead as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.leads.assign({ id: 5, assignedToId: 3 });
    expect(result).toEqual({ success: true });
    expect(db.updateLead).toHaveBeenCalledWith(5, { assignedToId: 3 });
  });

  it("validates lead status enum", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.leads.updateStatus({ id: 1, status: "invalid" as any })
    ).rejects.toThrow();
  });
});

// ─── Conversations Tests ─────────────────────────────────────────────────────
describe("conversations", () => {
  it("team member message pauses AI and cancels follow-ups", async () => {
    (db.createMessage as any).mockResolvedValue({ id: 100 });
    (db.updateConversation as any).mockResolvedValue(undefined);
    (db.getConversationById as any).mockResolvedValue({ id: 1, leadId: 5 });
    (db.updateLead as any).mockResolvedValue(undefined);
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    await caller.conversations.sendMessage({
      conversationId: 1,
      content: "I'll take over this conversation",
      senderType: "team_member",
      senderId: 1,
    });

    expect(db.updateConversation).toHaveBeenCalledWith(1, { aiActive: false });
    expect(db.updateLead).toHaveBeenCalledWith(5, { aiActive: false });
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });

  it("customer response cancels pending follow-ups", async () => {
    (db.createMessage as any).mockResolvedValue({ id: 101 });
    (db.updateConversation as any).mockResolvedValue(undefined);
    (db.getConversationById as any).mockResolvedValue({ id: 1, leadId: 5 });
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    await caller.conversations.sendMessage({
      conversationId: 1,
      content: "Yes, I'd like to schedule a visit",
      senderType: "customer",
    });

    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });

  it("toggles AI on a conversation", async () => {
    (db.updateConversation as any).mockResolvedValue(undefined);
    (db.getConversationById as any).mockResolvedValue({ id: 1, leadId: 5 });
    (db.updateLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.conversations.toggleAI({
      conversationId: 1,
      aiActive: false,
    });
    expect(result).toEqual({ success: true });
    expect(db.updateConversation).toHaveBeenCalledWith(1, { aiActive: false });
    expect(db.updateLead).toHaveBeenCalledWith(5, { aiActive: false });
  });
});

// ─── AI Reply Tests ──────────────────────────────────────────────────────────
describe("ai", () => {
  it("generates an AI reply for a conversation", async () => {
    (db.getBusinessById as any).mockResolvedValue({
      id: 1,
      name: "HVAC Pro",
      serviceCategories: ["HVAC"],
      aiTone: "professional",
      aiContext: "We serve Phoenix area",
    });
    (db.getConversationById as any).mockResolvedValue({ id: 1, leadId: 5 });
    (db.getMessagesByConversation as any).mockResolvedValue([
      { id: 1, content: "My AC is broken", senderType: "customer" },
    ]);
    (db.getLeadById as any).mockResolvedValue({
      id: 5,
      customerName: "John",
      serviceNeeded: "AC repair",
      responseTimeMs: null,
      createdAt: new Date(Date.now() - 5000),
    });
    (db.createMessage as any).mockResolvedValue({ id: 2 });
    (db.updateConversation as any).mockResolvedValue(undefined);
    (db.updateLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.ai.generateReply({
      conversationId: 1,
      businessId: 1,
    });

    expect(result.reply).toContain("Thank you for reaching out");
    expect(db.createMessage).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 1,
      senderType: "ai",
    }));
    // Should record response time for first reply
    expect(db.updateLead).toHaveBeenCalledWith(5, expect.objectContaining({
      responseTimeMs: expect.any(Number),
    }));
  });

  it("throws when business not found", async () => {
    (db.getBusinessById as any).mockResolvedValue(null);
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.ai.generateReply({ conversationId: 1, businessId: 999 })
    ).rejects.toThrow("Business not found");
  });
});

// ─── Follow-Up Sequences Tests ───────────────────────────────────────────────
describe("followUps", () => {
  it("creates a follow-up sequence with steps", async () => {
    (db.createFollowUpSequence as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.create({
      businessId: 1,
      name: "Standard Follow-Up",
      steps: [
        { delayMinutes: 10, messageTemplate: "Hi {{name}}, just checking in!" },
        { delayMinutes: 60, messageTemplate: "We're still available to help." },
        { delayMinutes: 1440, messageTemplate: "Last chance to book!" },
      ],
    });
    expect(result).toEqual({ id: 1 });
    expect(db.createFollowUpSequence).toHaveBeenCalledWith(expect.objectContaining({
      name: "Standard Follow-Up",
      steps: expect.arrayContaining([
        expect.objectContaining({ delayMinutes: 10 }),
      ]),
    }));
  });

  it("toggles a follow-up sequence active status", async () => {
    (db.updateFollowUpSequence as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.update({ id: 1, isActive: false });
    expect(result).toEqual({ success: true });
  });

  it("deletes a follow-up sequence", async () => {
    (db.deleteFollowUpSequence as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.delete({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(db.deleteFollowUpSequence).toHaveBeenCalledWith(1);
  });
});

// ─── Availability Tests ──────────────────────────────────────────────────────
describe("availability", () => {
  it("creates an availability slot", async () => {
    (db.createAvailabilitySlot as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.availability.create({
      businessId: 1,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "17:00",
      maxBookings: 5,
    });
    expect(result).toEqual({ id: 1 });
  });

  it("validates dayOfWeek range (0-6)", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.availability.create({
        businessId: 1,
        dayOfWeek: 7,
        startTime: "08:00",
        endTime: "17:00",
      })
    ).rejects.toThrow();
  });

  it("deletes an availability slot", async () => {
    (db.deleteAvailabilitySlot as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.availability.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ─── Bookings Tests ──────────────────────────────────────────────────────────
describe("bookings", () => {
  it("creates a booking and marks lead as booked", async () => {
    (db.createBooking as any).mockResolvedValue({ id: 1 });
    (db.updateLead as any).mockResolvedValue(undefined);
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.bookings.create({
      leadId: 5,
      businessId: 1,
      scheduledDate: "2026-05-01",
      scheduledTime: "10:00",
      serviceType: "AC Repair",
      notes: "Customer reports no cold air",
    });

    expect(result).toEqual({ id: 1 });
    expect(db.updateLead).toHaveBeenCalledWith(5, expect.objectContaining({
      status: "booked",
      bookedAt: expect.any(Date),
    }));
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });
});

// ─── KPI Tests ───────────────────────────────────────────────────────────────
describe("kpi", () => {
  it("returns correct KPI stats", async () => {
    (db.getLeadStats as any).mockResolvedValue({
      total: 100,
      new: 30,
      qualified: 25,
      booked: 35,
      lost: 10,
      avgResponseMs: 15000,
    });
    (db.getBookingStats as any).mockResolvedValue({
      total: 35,
      confirmed: 20,
      completed: 10,
      cancelled: 5,
    });

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.kpi.stats({ businessId: 1 });

    expect(result.leadVolume).toBe(100);
    expect(result.newLeads).toBe(30);
    expect(result.qualifiedLeads).toBe(25);
    expect(result.bookedLeads).toBe(35);
    expect(result.lostLeads).toBe(10);
    expect(result.avgResponseTimeSec).toBe(15);
    expect(result.bookingRate).toBe(35);
    expect(result.totalBookings).toBe(35);
    expect(result.confirmedBookings).toBe(20);
    expect(result.completedBookings).toBe(10);
  });

  it("handles zero leads gracefully", async () => {
    (db.getLeadStats as any).mockResolvedValue({
      total: 0, new: 0, qualified: 0, booked: 0, lost: 0, avgResponseMs: 0,
    });
    (db.getBookingStats as any).mockResolvedValue({
      total: 0, confirmed: 0, completed: 0, cancelled: 0,
    });

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.kpi.stats({ businessId: 1 });

    expect(result.leadVolume).toBe(0);
    expect(result.bookingRate).toBe(0);
    expect(result.avgResponseTimeSec).toBe(0);
  });
});

// ─── Lead Sources Tests ──────────────────────────────────────────────────────
describe("sources", () => {
  it("creates a lead source", async () => {
    (db.createLeadSource as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.sources.create({
      businessId: 1,
      sourceType: "yelp",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("updates lead source connection status", async () => {
    (db.updateLeadSource as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.sources.update({ id: 1, isConnected: false });
    expect(result).toEqual({ success: true });
  });
});

// ─── Build System Prompt Tests (via AI simulate) ─────────────────────────────
describe("buildSystemPrompt (via simulateInquiry)", () => {
  it("generates AI reply with business context", async () => {
    (db.createLead as any).mockResolvedValue({ id: 10 });
    (db.createConversation as any).mockResolvedValue({ id: 20 });
    (db.createMessage as any).mockResolvedValue({ id: 30 });
    (db.getBusinessById as any).mockResolvedValue({
      id: 1,
      name: "Cool Air HVAC",
      serviceCategories: ["HVAC", "AC Repair"],
      workingHours: {
        Monday: { start: "8:00 AM", end: "5:00 PM", enabled: true },
      },
      timezone: "America/Phoenix",
      aiTone: "empathetic",
      aiContext: "Family-owned for 20 years",
      aiPromptInstructions: "Always mention free estimates",
      aiResponseRules: ["Ask for customer address"],
      aiUnsupportedReply: "We only handle HVAC services",
    });
    (db.getLeadById as any).mockResolvedValue({
      id: 10,
      customerName: "Sarah",
      serviceNeeded: "My AC stopped working",
      createdAt: new Date(),
    });
    (db.updateLead as any).mockResolvedValue(undefined);
    (db.updateConversation as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.ai.simulateInquiry({
      businessId: 1,
      customerName: "Sarah",
      customerPhone: "555-1234",
      serviceNeeded: "My AC stopped working",
      sourceType: "website",
    });

    expect(result.leadId).toBe(10);
    expect(result.conversationId).toBe(20);
    expect(result.aiReply).toBeTruthy();
  });
});

// ─── Follow-Up Task Scheduling/Execution Tests ──────────────────────────────
describe("followUps.enqueue", () => {
  it("enqueues follow-up tasks for a lead based on sequence steps", async () => {
    (db.getFollowUpSequenceById as any).mockResolvedValue({
      id: 1,
      isActive: true,
      steps: [
        { delayMinutes: 10, messageTemplate: "Hi {{name}}, checking in!" },
        { delayMinutes: 60, messageTemplate: "Still need help with {{service}}?" },
      ],
    });
    (db.createFollowUpTask as any).mockResolvedValue({ id: 1 });

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.enqueue({ leadId: 5, sequenceId: 1 });

    expect(result.tasksCreated).toBe(2);
    expect(db.createFollowUpTask).toHaveBeenCalledTimes(2);
    expect(db.createFollowUpTask).toHaveBeenCalledWith(expect.objectContaining({
      leadId: 5,
      sequenceId: 1,
      stepIndex: 0,
      status: "pending",
    }));
    expect(db.createFollowUpTask).toHaveBeenCalledWith(expect.objectContaining({
      leadId: 5,
      sequenceId: 1,
      stepIndex: 1,
      status: "pending",
    }));
  });

  it("throws when sequence is inactive", async () => {
    (db.getFollowUpSequenceById as any).mockResolvedValue({
      id: 1,
      isActive: false,
      steps: [],
    });

    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.followUps.enqueue({ leadId: 5, sequenceId: 1 })
    ).rejects.toThrow("Sequence not found or inactive");
  });

  it("throws when sequence not found", async () => {
    (db.getFollowUpSequenceById as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.followUps.enqueue({ leadId: 5, sequenceId: 999 })
    ).rejects.toThrow("Sequence not found or inactive");
  });
});

describe("followUps.executePending", () => {
  it("sends pending follow-up messages", async () => {
    const now = new Date();
    (db.getPendingFollowUpTasks as any).mockResolvedValue([
      { id: 1, leadId: 5, sequenceId: 1, stepIndex: 0, scheduledAt: now, status: "pending", createdAt: new Date(now.getTime() - 600000) },
    ]);
    (db.getLeadById as any).mockResolvedValue({
      id: 5,
      businessId: 1,
      customerName: "John",
      serviceNeeded: "AC repair",
      status: "new",
    });
    (db.getConversationsByBusiness as any).mockResolvedValue([
      { id: 10, leadId: 5 },
    ]);
    (db.getMessagesByConversation as any).mockResolvedValue([
      { id: 1, senderType: "ai", createdAt: new Date(now.getTime() - 700000) },
    ]);
    (db.getFollowUpSequenceById as any).mockResolvedValue({
      id: 1,
      steps: [
        { delayMinutes: 10, messageTemplate: "Hi {{name}}, checking in about {{service}}!" },
      ],
    });
    (db.createMessage as any).mockResolvedValue({ id: 100 });
    (db.updateConversation as any).mockResolvedValue(undefined);
    (db.markFollowUpTaskSent as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.executePending();

    expect(result.sent).toBe(1);
    expect(result.cancelled).toBe(0);
    expect(db.createMessage).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 10,
      content: "Hi John, checking in about AC repair!",
      senderType: "ai",
    }));
    expect(db.markFollowUpTaskSent).toHaveBeenCalledWith(1);
  });

  it("cancels follow-ups when lead is booked", async () => {
    (db.getPendingFollowUpTasks as any).mockResolvedValue([
      { id: 1, leadId: 5, sequenceId: 1, stepIndex: 0, scheduledAt: new Date(), status: "pending", createdAt: new Date() },
    ]);
    (db.getLeadById as any).mockResolvedValue({
      id: 5,
      businessId: 1,
      status: "booked",
    });
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.executePending();

    expect(result.cancelled).toBe(1);
    expect(result.sent).toBe(0);
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });

  it("cancels follow-ups when customer has responded", async () => {
    const now = new Date();
    const taskCreatedAt = new Date(now.getTime() - 600000);
    (db.getPendingFollowUpTasks as any).mockResolvedValue([
      { id: 1, leadId: 5, sequenceId: 1, stepIndex: 0, scheduledAt: now, status: "pending", createdAt: taskCreatedAt },
    ]);
    (db.getLeadById as any).mockResolvedValue({
      id: 5,
      businessId: 1,
      customerName: "John",
      status: "new",
    });
    (db.getConversationsByBusiness as any).mockResolvedValue([
      { id: 10, leadId: 5 },
    ]);
    // Customer responded AFTER task was created
    (db.getMessagesByConversation as any).mockResolvedValue([
      { id: 1, senderType: "customer", createdAt: new Date(now.getTime() - 300000) },
    ]);
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.executePending();

    expect(result.cancelled).toBe(1);
    expect(result.sent).toBe(0);
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });

  it("cancels follow-ups when lead is lost", async () => {
    (db.getPendingFollowUpTasks as any).mockResolvedValue([
      { id: 1, leadId: 5, sequenceId: 1, stepIndex: 0, scheduledAt: new Date(), status: "pending", createdAt: new Date() },
    ]);
    (db.getLeadById as any).mockResolvedValue({
      id: 5,
      businessId: 1,
      status: "lost",
    });
    (db.cancelFollowUpTasksForLead as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.followUps.executePending();

    expect(result.cancelled).toBe(1);
    expect(db.cancelFollowUpTasksForLead).toHaveBeenCalledWith(5);
  });
});

// ─── Billing & Subscription Tests ───────────────────────────────────────────
describe("billing", () => {
  it("returns null subscription for user without one", async () => {
    (db.getUserSubscription as any).mockResolvedValue(null);
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.billing.getSubscription();
    expect(result).toBeNull();
    expect(db.getUserSubscription).toHaveBeenCalledWith(1);
  });

  it("returns active subscription details", async () => {
    (db.getUserSubscription as any).mockResolvedValue({
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test456",
      subscriptionPlan: "professional",
      subscriptionStatus: "active",
    });
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.billing.getSubscription();
    expect(result).toEqual({
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test456",
      subscriptionPlan: "professional",
      subscriptionStatus: "active",
    });
  });

  it("rejects portal session when no stripe customer exists", async () => {
    (db.getUserSubscription as any).mockResolvedValue(null);
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.billing.createPortal({ origin: "https://example.com" })
    ).rejects.toThrow("No active subscription found");
  });

  it("rejects checkout with invalid plan key", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    await expect(
      caller.billing.createCheckout({
        planKey: "invalid" as any,
        interval: "month",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });
});
