/**
 * messaging.test.ts — Unit tests for the Plivo SMS delivery layer
 *
 * Uses vi.hoisted() to ensure mock functions are available before module
 * imports are hoisted by Vitest's mock system.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mock functions so they're available during vi.mock() hoisting ──────
const { plivoMockCreate, getDbMock } = vi.hoisted(() => {
  return {
    plivoMockCreate: vi.fn(),
    getDbMock: vi.fn(),
  };
});

// ─── Mock plivo ───────────────────────────────────────────────────────────────
vi.mock("plivo", () => {
  function Client() {
    return { messages: { create: plivoMockCreate } };
  }
  const mod = { Client };
  return { default: mod, ...mod };
});

// ─── Mock getDb ───────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: getDbMock,
}));

// ─── Mock ENV ─────────────────────────────────────────────────────────────────
vi.mock("./_core/env", () => ({
  ENV: {
    plivoAuthId: "test-auth-id",
    plivoAuthToken: "test-auth-token",
    plivoFromNumber: "16785361017",
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeDb(optedOutNumbers: string[] = []) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve(
              optedOutNumbers !== null
                ? [{ optedOutNumbers, optOutKeywords: ["STOP"], smsEnabled: true, fromNumber: "16785361017", dailySendLimit: 200 }]
                : []
            ),
        }),
      }),
    }),
    insert: () => ({
      values: () => Promise.resolve([{ insertId: 42 }]),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  };
}

// ─── Import after mocks ───────────────────────────────────────────────────────
import { normalisePhone, sendSms, isOptedOut } from "./messaging";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("normalisePhone", () => {
  it("leaves an 11-digit US number unchanged", () => {
    expect(normalisePhone("16785361017")).toBe("16785361017");
  });

  it("prepends 1 to a 10-digit number", () => {
    expect(normalisePhone("6785361017")).toBe("16785361017");
  });

  it("strips formatting characters", () => {
    expect(normalisePhone("(678) 536-1017")).toBe("16785361017");
  });

  it("strips dashes and spaces", () => {
    expect(normalisePhone("678-536-1017")).toBe("16785361017");
  });
});

describe("messaging module exports", () => {
  it("exports normalisePhone as a function", () => {
    expect(typeof normalisePhone).toBe("function");
  });

  it("exports sendSms as a function", () => {
    expect(typeof sendSms).toBe("function");
  });

  it("exports isOptedOut as a function", () => {
    expect(typeof isOptedOut).toBe("function");
  });
});

describe("sendSms — opt-out guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure when number is opted out", async () => {
    getDbMock.mockResolvedValue(makeDb(["16785361017"]));

    const result = await sendSms({
      businessId: 1,
      toNumber: "16785361017",
      body: "Hello",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/opted out/i);
  });
});

describe("sendSms — Plivo success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with a message UUID when Plivo responds OK", async () => {
    getDbMock.mockResolvedValue(makeDb([]));
    plivoMockCreate.mockResolvedValueOnce({ messageUuid: ["test-uuid-123"] });

    const result = await sendSms({
      businessId: 1,
      toNumber: "16785361017",
      body: "Test message",
    });

    expect(result.success).toBe(true);
    expect(result.plivoMessageUuid).toBe("test-uuid-123");
  });
});

describe("sendSms — Plivo failure path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure with error message when Plivo throws", async () => {
    getDbMock.mockResolvedValue(makeDb([]));
    plivoMockCreate.mockRejectedValueOnce(new Error("Plivo API error: invalid number"));

    const result = await sendSms({
      businessId: 1,
      toNumber: "16785361017",
      body: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Plivo API error/i);
  });
});
