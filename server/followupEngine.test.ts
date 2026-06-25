/**
 * Tests for the Follow-Up Engine module
 * Covers: generateFollowupMessage, queue helpers, stats
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(() =>
    Promise.resolve({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    })
  ),
}));

// ─── Mock invokeLLM ───────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "Hi John, just following up on your HVAC estimate of $285. Ready to book? — AcmeCo",
        },
      },
    ],
  }),
}));

// ─── Mock sendSms ─────────────────────────────────────────────────────────────
vi.mock("./messaging", () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true, messageUUID: "test-uuid-123" }),
  isOptedOut: vi.fn().mockResolvedValue(false),
  normalisePhone: vi.fn((p: string) => p),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import { generateFollowupMessage } from "./followupEngine";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Follow-Up Engine — generateFollowupMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call invokeLLM once", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await generateFollowupMessage({
      promptInstructions: "Be warm and friendly",
      tone: "friendly",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "John",
      serviceDescription: "HVAC tune-up",
      estimateAmount: "$285",
      businessName: "AcmeCo",
    });
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("should return a non-empty string", async () => {
    const result = await generateFollowupMessage({
      promptInstructions: "Be professional",
      tone: "professional",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Alice",
      serviceDescription: "Plumbing inspection",
      estimateAmount: "$200",
      businessName: "PlumbCo",
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should truncate message to maxChars with ellipsis", async () => {
    const { invokeLLM } = await import("./_core/llm");
    // Return a very long message
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: "A".repeat(500) } }],
    });
    const result = await generateFollowupMessage({
      promptInstructions: "Be brief",
      tone: "friendly",
      maxChars: 100,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Bob",
      serviceDescription: "Roof repair",
      estimateAmount: "$500",
      businessName: "RoofCo",
    });
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith("...")).toBe(true);
  });

  it("should not truncate message that fits within maxChars", async () => {
    const shortMsg = "Hi Carol, your estimate is ready. Call us!";
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: shortMsg } }],
    });
    const result = await generateFollowupMessage({
      promptInstructions: "Keep it short",
      tone: "friendly",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Carol",
      serviceDescription: "Electrical work",
      estimateAmount: "$300",
      businessName: "ElecCo",
    });
    expect(result).toBe(shortMsg);
  });

  it("should pass attempt number to LLM prompt", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await generateFollowupMessage({
      promptInstructions: "Final attempt",
      tone: "urgent",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 3,
      customerName: "Dave",
      serviceDescription: "HVAC installation",
      estimateAmount: "$2500",
      businessName: "HVACCo",
    });
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    const userMsg = callArgs.messages.find((m: any) => m.role === "user")?.content ?? "";
    expect(userMsg).toContain("3");
  });

  it("should include forbidden phrases in system prompt", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await generateFollowupMessage({
      promptInstructions: "Be concise",
      tone: "professional",
      maxChars: 160,
      forbiddenPhrases: ["guaranteed", "cheapest"],
      attemptNumber: 2,
      customerName: "Eve",
      serviceDescription: "Roof repair",
      estimateAmount: "$500",
      businessName: "RoofCo",
    });
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    const sysMsg = callArgs.messages.find((m: any) => m.role === "system")?.content ?? "";
    expect(sysMsg).toContain("guaranteed");
    expect(sysMsg).toContain("cheapest");
  });

  it("should include business name in system prompt", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await generateFollowupMessage({
      promptInstructions: "Be friendly",
      tone: "friendly",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Frank",
      serviceDescription: "AC repair",
      estimateAmount: "$150",
      businessName: "CoolAirCo",
    });
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    const sysMsg = callArgs.messages.find((m: any) => m.role === "system")?.content ?? "";
    expect(sysMsg).toContain("CoolAirCo");
  });

  it("should handle missing estimateAmount gracefully", async () => {
    const result = await generateFollowupMessage({
      promptInstructions: "Be friendly",
      tone: "friendly",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Grace",
      serviceDescription: "Plumbing",
      businessName: "PlumbCo",
      // estimateAmount omitted
    });
    expect(typeof result).toBe("string");
  });

  it("should return empty string if LLM returns non-string content", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });
    const result = await generateFollowupMessage({
      promptInstructions: "Be friendly",
      tone: "friendly",
      maxChars: 320,
      forbiddenPhrases: [],
      attemptNumber: 1,
      customerName: "Henry",
      serviceDescription: "Electrical",
      businessName: "ElecCo",
    });
    expect(result).toBe("");
  });
});
