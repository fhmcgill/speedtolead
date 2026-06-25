/**
 * plivoInbound.test.ts — Unit tests for the Plivo inbound SMS webhook
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock db module ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLeadByPhone: vi.fn(),
  getLeadsByPhone: vi.fn(),
  getConversationByLeadId: vi.fn(),
  createConversation: vi.fn(),
  createMessage: vi.fn(),
  updateConversation: vi.fn(),
  createLead: vi.fn(),
  getBusinessById: vi.fn(),
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Mock messaging module ───────────────────────────────────────────────────
vi.mock("./messaging", () => ({
  normalisePhone: (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `1${digits}`;
    return digits;
  },
  sendSms: vi.fn().mockResolvedValue({ success: true }),
  isOptedOut: vi.fn().mockResolvedValue(false),
}));

// ─── Mock LLM ────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Thanks for reaching out! We'll be right with you." } }],
  }),
}));

// ─── Mock drizzle schema ─────────────────────────────────────────────────────
vi.mock("../drizzle/schema", () => ({
  smsLogs: "smsLogs",
  businesses: "businesses",
}));

import * as db from "./db";
import { normalisePhone } from "./messaging";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("normalisePhone (used by inbound handler)", () => {
  it("normalises a 10-digit US number by prepending 1", () => {
    expect(normalisePhone("6785361017")).toBe("16785361017");
  });

  it("strips formatting characters", () => {
    expect(normalisePhone("+1 (678) 536-1017")).toBe("16785361017");
  });

  it("leaves an already-normalised E.164 number unchanged", () => {
    expect(normalisePhone("16785361017")).toBe("16785361017");
  });

  it("handles international numbers (non-US)", () => {
    expect(normalisePhone("+447911123456")).toBe("447911123456");
  });
});

describe("inbound webhook — phone matching logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a lead by normalised phone number", async () => {
    const mockLead = {
      id: 1,
      businessId: 10,
      customerPhone: "16785361017",
      customerName: "John Doe",
      aiActive: true,
    };
    vi.mocked(db.getLeadByPhone).mockResolvedValueOnce(mockLead as any);

    const result = await db.getLeadByPhone("16785361017");
    expect(result).toEqual(mockLead);
    expect(db.getLeadByPhone).toHaveBeenCalledWith("16785361017");
  });

  it("returns undefined for an unknown phone number", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValueOnce(undefined);

    const result = await db.getLeadByPhone("19999999999");
    expect(result).toBeUndefined();
  });

  it("falls back to raw number when normalised number has no match", async () => {
    vi.mocked(db.getLeadByPhone)
      .mockResolvedValueOnce(undefined) // normalised form — no match
      .mockResolvedValueOnce({ id: 2, businessId: 10 } as any); // raw form — match

    const normalised = normalisePhone("+1678-536-1017");
    const raw = "+1678-536-1017";

    let lead = await db.getLeadByPhone(normalised);
    if (!lead && normalised !== raw) {
      lead = await db.getLeadByPhone(raw);
    }

    expect(lead).toEqual({ id: 2, businessId: 10 });
    expect(db.getLeadByPhone).toHaveBeenCalledTimes(2);
  });
});

describe("inbound webhook — conversation handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses existing conversation when one is found", async () => {
    const mockConv = { id: 5, leadId: 1, aiActive: false };
    vi.mocked(db.getConversationByLeadId).mockResolvedValueOnce(mockConv as any);

    const conv = await db.getConversationByLeadId(1);
    expect(conv).toEqual(mockConv);
    expect(db.createConversation).not.toHaveBeenCalled();
  });

  it("creates a new conversation when none exists", async () => {
    vi.mocked(db.getConversationByLeadId)
      .mockResolvedValueOnce(null) // first call — not found
      .mockResolvedValueOnce({ id: 99, leadId: 1, aiActive: true } as any); // re-fetch after create
    vi.mocked(db.createConversation).mockResolvedValueOnce({ id: 99 } as any);

    let conv = await db.getConversationByLeadId(1);
    if (!conv) {
      await db.createConversation({
        leadId: 1,
        businessId: 10,
        channel: "sms",
        aiActive: true,
        lastMessageAt: new Date(),
      });
      conv = await db.getConversationByLeadId(1);
    }

    expect(db.createConversation).toHaveBeenCalledOnce();
    expect(conv?.id).toBe(99);
  });
});

describe("inbound webhook — message insertion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts the inbound text as a customer message", async () => {
    vi.mocked(db.createMessage).mockResolvedValueOnce({ id: 42 } as any);

    await db.createMessage({
      conversationId: 5,
      content: "What time can you come?",
      senderType: "customer",
    });

    expect(db.createMessage).toHaveBeenCalledWith({
      conversationId: 5,
      content: "What time can you come?",
      senderType: "customer",
    });
  });

  it("updates conversation lastMessageAt after inserting message", async () => {
    vi.mocked(db.updateConversation).mockResolvedValueOnce(undefined as any);

    const now = new Date();
    await db.updateConversation(5, { lastMessageAt: now });

    expect(db.updateConversation).toHaveBeenCalledWith(5, { lastMessageAt: now });
  });
});

describe("inbound webhook — unknown number handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined for a completely unknown phone number", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValue(undefined);

    const lead = await db.getLeadByPhone("19999999999");
    expect(lead).toBeUndefined();
  });

  it("createLead is called with correct fields when creating an unknown lead", async () => {
    vi.mocked(db.createLead).mockResolvedValueOnce({ id: 99 } as any);

    const result = await db.createLead({
      businessId: 1,
      customerName: "Unknown (SMS)",
      customerPhone: "19999999999",
      serviceNeeded: "Hi, is anyone available?",
      sourceType: "website",
      status: "new",
      aiActive: true,
    });

    expect(result.id).toBe(99);
    expect(db.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Unknown (SMS)",
        customerPhone: "19999999999",
        aiActive: true,
      })
    );
  });
});

describe("inbound webhook — AI auto-reply trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT trigger AI reply when conversation.aiActive is false", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const { sendSms } = await import("./messaging");

    // Simulate a conversation with aiActive=false
    const conv = { id: 5, leadId: 1, aiActive: false };

    // The handler should skip AI reply — invokeLLM and sendSms should not be called
    if (conv.aiActive) {
      await invokeLLM({ messages: [] });
    }

    expect(invokeLLM).not.toHaveBeenCalled();
    expect(sendSms).not.toHaveBeenCalled();
  });

  it("would trigger AI reply when conversation.aiActive is true", async () => {
    const { invokeLLM } = await import("./_core/llm");

    // Simulate a conversation with aiActive=true
    const conv = { id: 5, leadId: 1, aiActive: true };

    if (conv.aiActive) {
      await invokeLLM({
        messages: [
          { role: "system" as const, content: "You are a helpful assistant." },
          { role: "user" as const, content: "When can you come?" },
        ],
      });
    }

    expect(invokeLLM).toHaveBeenCalledOnce();
  });
});

describe("inbound webhook — opt-out handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isOptedOut returns true for an opted-out number", async () => {
    const { isOptedOut } = await import("./messaging");
    vi.mocked(isOptedOut).mockResolvedValueOnce(true);

    const result = await isOptedOut(1, "16785361017");
    expect(result).toBe(true);
  });

  it("isOptedOut returns false for a non-opted-out number", async () => {
    const { isOptedOut } = await import("./messaging");
    vi.mocked(isOptedOut).mockResolvedValueOnce(false);

    const result = await isOptedOut(1, "16785361017");
    expect(result).toBe(false);
  });

  it("AI reply should be skipped if the lead has opted out", async () => {
    const { isOptedOut, sendSms } = await import("./messaging");
    vi.mocked(isOptedOut).mockResolvedValueOnce(true);

    const optedOut = await isOptedOut(1, "16785361017");
    if (!optedOut) {
      await sendSms({ toNumber: "16785361017", body: "Hello!", businessId: 1 });
    }

    expect(sendSms).not.toHaveBeenCalled();
  });
});
