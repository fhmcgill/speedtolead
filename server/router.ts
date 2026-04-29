import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure; // In production, add auth middleware

// ============================================================
// Auth Router
// ============================================================
const authRouter = t.router({
  me: publicProcedure.query(async () => {
    // Returns the current authenticated user
    return null;
  }),
  logout: publicProcedure.mutation(async () => {
    return { success: true };
  }),
});

// ============================================================
// Business Router
// ============================================================
const businessRouter = t.router({
  get: protectedProcedure.query(async () => {
    return null;
  }),
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        timezone: z.string().optional(),
        serviceCategories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { id: "1", ...input };
    }),
  update: protectedProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        timezone: z.string().optional(),
        serviceCategories: z.array(z.string()).optional(),
        availabilityMode: z.string().optional(),
        aiTone: z.string().optional(),
        aiContext: z.string().optional(),
        aiPromptInstructions: z.string().optional(),
        aiResponseRules: z.array(z.string()).optional(),
        aiUnsupportedReply: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// Leads Router
// ============================================================
const leadsRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { id: "1", ...input, status: "new_lead" };
    }),
  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
  assign: protectedProcedure
    .input(z.object({ id: z.string(), assigneeId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// Conversations Router
// ============================================================
const conversationsRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return null;
    }),
  sendMessage: protectedProcedure
    .input(z.object({ conversationId: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
  toggleAI: protectedProcedure
    .input(z.object({ conversationId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// AI Router
// ============================================================
const aiRouter = t.router({
  generateReply: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input }) => {
      return { reply: "" };
    }),
  simulateInquiry: protectedProcedure.mutation(async () => {
    return { leadId: "1", conversationId: "1" };
  }),
});

// ============================================================
// Availability Router
// ============================================================
const availabilityRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  create: protectedProcedure
    .input(
      z.object({
        day: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return { id: "1", ...input };
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// Follow-Ups Router
// ============================================================
const followUpsRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        steps: z.array(
          z.object({
            delayMinutes: z.number(),
            messageTemplate: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return { id: "1", ...input, active: true };
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        active: z.boolean().optional(),
        steps: z
          .array(
            z.object({
              delayMinutes: z.number(),
              messageTemplate: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// KPI Router
// ============================================================
const kpiRouter = t.router({
  stats: protectedProcedure.query(async () => {
    return {
      totalLeads: 0,
      avgResponseTime: "—",
      bookingRate: 0,
      activeConversations: 0,
    };
  }),
});

// ============================================================
// Team Router
// ============================================================
const teamRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  create: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.string() }))
    .mutation(async ({ input }) => {
      return { id: "1", ...input };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.string(), role: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// Sources Router
// ============================================================
const sourcesRouter = t.router({
  list: protectedProcedure.query(async () => {
    return [];
  }),
  create: protectedProcedure
    .input(z.object({ type: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { id: "1", ...input };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================
// Billing Router
// ============================================================
const billingRouter = t.router({
  getSubscription: protectedProcedure.query(async () => {
    return {
      subscriptionPlan: null,
      subscriptionStatus: "inactive",
    };
  }),
  createCheckout: protectedProcedure
    .input(
      z.object({
        planKey: z.string(),
        interval: z.enum(["monthly", "yearly"]),
        origin: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return { url: "#" };
    }),
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ input }) => {
      return { url: "#" };
    }),
});

// ============================================================
// App Router
// ============================================================
export const appRouter = t.router({
  auth: authRouter,
  business: businessRouter,
  leads: leadsRouter,
  conversations: conversationsRouter,
  ai: aiRouter,
  availability: availabilityRouter,
  followUps: followUpsRouter,
  kpi: kpiRouter,
  team: teamRouter,
  sources: sourcesRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
