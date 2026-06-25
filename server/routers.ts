import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { sendSms, getOrCreateMessagingSettings, normalisePhone } from "./messaging";
import {
  getTemplatesForBusiness,
  saveTemplate,
  getVariantsForTemplate,
  saveVariant,
  generateFollowupMessage,
  enqueueFollowup,
  getQueue,
  approveQueueItem,
  rejectQueueItem,
  updateGeneratedMessage,
  getFollowupStats,
} from "./followupEngine";
import { smsLogs, messagingSettings } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Business Profile ──────────────────────────────────────────────────────
  business: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getBusinessByOwnerId(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      serviceCategories: z.array(z.string()).optional(),
      timezone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await db.getBusinessByOwnerId(ctx.user.id);
      if (existing) throw new Error("Business already exists");
      return db.createBusiness({ ...input, ownerId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      serviceCategories: z.array(z.string()).optional(),
      workingHours: z.record(z.string(), z.object({ start: z.string(), end: z.string(), enabled: z.boolean() })).optional(),
      timezone: z.string().optional(),
      aiContext: z.string().optional(),
      aiTone: z.string().optional(),
      aiPromptInstructions: z.string().optional(),
      aiResponseRules: z.array(z.string()).optional(),
      aiUnsupportedReply: z.string().optional(),
      availabilityMode: z.enum(["manual", "servicetitan", "jobber"]).optional(),
      serviceTitanConfig: z.object({ tenantId: z.string().optional(), clientId: z.string().optional(), clientSecret: z.string().optional() }).optional(),
      jobberConfig: z.object({ accessToken: z.string().optional(), refreshToken: z.string().optional() }).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBusiness(id, data as any);
      return { success: true };
    }),
  }),

  // ─── Team Members ──────────────────────────────────────────────────────────
  team: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      return db.getTeamMembersByBusiness(input.businessId);
    }),
    create: protectedProcedure.input(z.object({
      businessId: z.number(),
      name: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(["owner", "team_member"]).optional(),
    })).mutation(async ({ input }) => {
      return db.createTeamMember(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(["owner", "team_member"]).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTeamMember(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTeamMember(input.id);
      return { success: true };
    }),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure.input(z.object({
      businessId: z.number(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      return db.getLeadsByBusiness(input.businessId, input.status);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getLeadById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      businessId: z.number(),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
      serviceNeeded: z.string().optional(),
      sourceType: z.enum(["yelp", "thumbtack", "google_lsa", "website", "manual"]).optional(),
    })).mutation(async ({ input }) => {
      const lead = await db.createLead(input);
      // Create conversation for this lead
      const conv = await db.createConversation({
        leadId: lead.id,
        businessId: input.businessId,
        channel: input.sourceType || "website",
        aiActive: true,
        lastMessageAt: new Date(),
      });
      return { leadId: lead.id, conversationId: conv.id };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["new", "qualified", "booked", "lost"]),
    })).mutation(async ({ input }) => {
      const updateData: any = { status: input.status };
      if (input.status === "booked") {
        updateData.bookedAt = new Date();
        // Cancel pending follow-ups when booked
        await db.cancelFollowUpTasksForLead(input.id);
      }
      if (input.status === "lost") {
        await db.cancelFollowUpTasksForLead(input.id);
      }
      await db.updateLead(input.id, updateData);
      return { success: true };
    }),
    assign: protectedProcedure.input(z.object({
      id: z.number(),
      assignedToId: z.number().nullable(),
    })).mutation(async ({ input }) => {
      await db.updateLead(input.id, { assignedToId: input.assignedToId });
      return { success: true };
    }),
  }),

  // ─── Conversations & Messages ──────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      const convs = await db.getConversationsByBusiness(input.businessId);
      // Enrich with lead data and last message
      const enriched = await Promise.all(convs.map(async (conv) => {
        const lead = await db.getLeadById(conv.leadId);
        const msgs = await db.getMessagesByConversation(conv.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        return { ...conv, lead, lastMessage: lastMsg, messageCount: msgs.length };
      }));
      return enriched;
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const conv = await db.getConversationById(input.id);
      if (!conv) return null;
      const lead = await db.getLeadById(conv.leadId);
      const msgs = await db.getMessagesByConversation(conv.id);
      return { ...conv, lead, messages: msgs };
    }),
    sendMessage: protectedProcedure.input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
      senderType: z.enum(["customer", "ai", "team_member"]),
      senderId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const msg = await db.createMessage({
        conversationId: input.conversationId,
        content: input.content,
        senderType: input.senderType,
        senderId: input.senderId,
      });
      await db.updateConversation(input.conversationId, { lastMessageAt: new Date() });

      // If team member sends a message, pause AI and cancel follow-ups
      if (input.senderType === "team_member") {
        const conv = await db.getConversationById(input.conversationId);
        if (conv) {
          await db.updateConversation(input.conversationId, { aiActive: false });
          await db.updateLead(conv.leadId, { aiActive: false });
          await db.cancelFollowUpTasksForLead(conv.leadId);
        }
      }

      // If customer responds, cancel pending follow-ups
      if (input.senderType === "customer") {
        const conv = await db.getConversationById(input.conversationId);
        if (conv) {
          await db.cancelFollowUpTasksForLead(conv.leadId);
        }
      }

      return msg;
    }),
    toggleAI: protectedProcedure.input(z.object({
      conversationId: z.number(),
      aiActive: z.boolean(),
    })).mutation(async ({ input }) => {
      await db.updateConversation(input.conversationId, { aiActive: input.aiActive });
      const conv = await db.getConversationById(input.conversationId);
      if (conv) {
        await db.updateLead(conv.leadId, { aiActive: input.aiActive });
      }
      return { success: true };
    }),
  }),

  // ─── AI Reply ──────────────────────────────────────────────────────────────
  ai: router({
    generateReply: protectedProcedure.input(z.object({
      conversationId: z.number(),
      businessId: z.number(),
    })).mutation(async ({ input }) => {
      const business = await db.getBusinessById(input.businessId);
      if (!business) throw new Error("Business not found");

      const conv = await db.getConversationById(input.conversationId);
      if (!conv) throw new Error("Conversation not found");

      const msgs = await db.getMessagesByConversation(input.conversationId);
      const lead = await db.getLeadById(conv.leadId);

      // Optionally fetch live ServiceTitan availability to include in the prompt
      let liveAvailability: string | undefined;
      if (business.availabilityMode === "servicetitan") {
        try {
          const { getAvailability } = await import("./servicetitan");
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          const fmt = (d: Date) => d.toISOString().split("T")[0];
          const slots = await getAvailability(fmt(today), fmt(nextWeek), 120);
          if (slots.length > 0) {
            const slotLines = slots
              .filter(s => s.available)
              .slice(0, 8)
              .map(s => `  - ${s.date} ${s.startTime}–${s.endTime}`);
            if (slotLines.length > 0) {
              liveAvailability = `Available appointment windows (next 7 days):\n${slotLines.join("\n")}`;
            }
          }
        } catch {
          // Non-fatal: proceed without live availability
        }
      }

      // Build system prompt from business context
      const systemPrompt = buildSystemPrompt(business, lead, liveAvailability);
      const chatMessages = msgs.map(m => ({
        role: m.senderType === "customer" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
      });

      const aiReply = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : '';

      // Save AI message
      if (aiReply) {
        await db.createMessage({
          conversationId: input.conversationId,
          content: aiReply,
          senderType: "ai",
        });
        await db.updateConversation(input.conversationId, { lastMessageAt: new Date() });

        // Record response time for first AI reply
        if (lead && !lead.responseTimeMs) {
          const responseTimeMs = Date.now() - new Date(lead.createdAt).getTime();
          await db.updateLead(lead.id, { responseTimeMs });
        }

        // Auto-send AI reply via SMS if lead has a phone number
        if (lead?.customerPhone) {
          try {
            await sendSms({
              businessId: input.businessId,
              toNumber: lead.customerPhone,
              body: aiReply,
              leadId: lead.id,
              conversationId: input.conversationId,
              messageType: "ai_reply",
            });
          } catch {
            // Non-fatal: SMS delivery failure should not break the reply flow
          }
        }
      }

      return { reply: aiReply, smsSent: !!(lead?.customerPhone) };
    }),

    simulateInquiry: protectedProcedure.input(z.object({
      businessId: z.number(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceNeeded: z.string(),
      sourceType: z.enum(["yelp", "thumbtack", "google_lsa", "website", "manual"]).optional(),
    })).mutation(async ({ input }) => {
      // Create lead
      const lead = await db.createLead({
        businessId: input.businessId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        serviceNeeded: input.serviceNeeded,
        sourceType: input.sourceType || "website",
        status: "new",
        aiActive: true,
      });

      // Create conversation
      const conv = await db.createConversation({
        leadId: lead.id,
        businessId: input.businessId,
        channel: input.sourceType || "website",
        aiActive: true,
        lastMessageAt: new Date(),
      });

      // Create customer message
      await db.createMessage({
        conversationId: conv.id,
        content: input.serviceNeeded,
        senderType: "customer",
      });

      // Generate AI reply
      const business = await db.getBusinessById(input.businessId);
      if (!business) throw new Error("Business not found");

      const leadData = await db.getLeadById(lead.id);
      const systemPrompt = buildSystemPrompt(business, leadData);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.serviceNeeded },
        ],
      });

      const aiReply = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : 'Thank you for reaching out! We received your inquiry and will get back to you shortly.';

      await db.createMessage({
        conversationId: conv.id,
        content: aiReply,
        senderType: "ai",
      });

      const responseTimeMs = Date.now() - new Date(leadData!.createdAt).getTime();
      await db.updateLead(lead.id, { responseTimeMs });

      await db.updateConversation(conv.id, { lastMessageAt: new Date() });

      return { leadId: lead.id, conversationId: conv.id, aiReply };
    }),
  }),

  // ─── Lead Sources ──────────────────────────────────────────────────────────
  sources: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      return db.getLeadSourcesByBusiness(input.businessId);
    }),
    create: protectedProcedure.input(z.object({
      businessId: z.number(),
      sourceType: z.enum(["yelp", "thumbtack", "google_lsa", "website", "manual"]),
      config: z.record(z.string(), z.string()).optional(),
    })).mutation(async ({ input }) => {
      return db.createLeadSource(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      isConnected: z.boolean().optional(),
      config: z.record(z.string(), z.string()).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLeadSource(id, data);
      return { success: true };
    }),
  }),

  // ─── Follow-Up Sequences ───────────────────────────────────────────────────
  followUps: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      return db.getFollowUpSequencesByBusiness(input.businessId);
    }),
    create: protectedProcedure.input(z.object({
      businessId: z.number(),
      name: z.string().min(1),
      steps: z.array(z.object({
        delayMinutes: z.number(),
        messageTemplate: z.string(),
      })),
    })).mutation(async ({ input }) => {
      return db.createFollowUpSequence(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      isActive: z.boolean().optional(),
      steps: z.array(z.object({
        delayMinutes: z.number(),
        messageTemplate: z.string(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFollowUpSequence(id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteFollowUpSequence(input.id);
      return { success: true };
    }),

    // Enqueue follow-up tasks for a lead based on a sequence
    enqueue: protectedProcedure.input(z.object({
      leadId: z.number(),
      sequenceId: z.number(),
    })).mutation(async ({ input }) => {
      const sequence = await db.getFollowUpSequenceById(input.sequenceId);
      if (!sequence || !sequence.isActive) throw new Error("Sequence not found or inactive");
      const steps = (sequence.steps || []) as Array<{ delayMinutes: number; messageTemplate: string }>;
      const now = Date.now();
      const created = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const scheduledAt = new Date(now + step.delayMinutes * 60 * 1000);
        const task = await db.createFollowUpTask({
          leadId: input.leadId,
          sequenceId: input.sequenceId,
          stepIndex: i,
          scheduledAt,
          status: "pending",
        });
        created.push(task);
      }
      return { tasksCreated: created.length };
    }),

    // Execute pending follow-up tasks (called by cron/scheduled endpoint)
    executePending: protectedProcedure.mutation(async () => {
      const pendingTasks = await db.getPendingFollowUpTasks();
      let sent = 0;
      let cancelled = 0;
      for (const task of pendingTasks) {
        // Check if lead is still eligible (not booked/lost, no customer response)
        const lead = await db.getLeadById(task.leadId);
        if (!lead || lead.status === "booked" || lead.status === "lost") {
          await db.cancelFollowUpTasksForLead(task.leadId);
          cancelled++;
          continue;
        }
        // Check if customer has responded (any customer message after task was created)
        const convs = await db.getConversationsByBusiness(lead.businessId);
        const leadConv = convs.find(c => c.leadId === task.leadId);
        if (leadConv) {
          const msgs = await db.getMessagesByConversation(leadConv.id);
          const customerReplied = msgs.some(m => m.senderType === "customer" && new Date(m.createdAt) > new Date(task.createdAt));
          if (customerReplied) {
            await db.cancelFollowUpTasksForLead(task.leadId);
            cancelled++;
            continue;
          }
        }
        // Get the sequence step message
        const sequence = await db.getFollowUpSequenceById(task.sequenceId);
        const steps = (sequence?.steps || []) as Array<{ delayMinutes: number; messageTemplate: string }>;
        const step = steps[task.stepIndex ?? 0];
        if (step && leadConv) {
          // Send the follow-up message
          const messageContent = step.messageTemplate
            .replace("{{name}}", lead.customerName || "there")
            .replace("{{service}}", lead.serviceNeeded || "your request");
          await db.createMessage({
            conversationId: leadConv.id,
            content: messageContent,
            senderType: "ai",
          });
          await db.updateConversation(leadConv.id, { lastMessageAt: new Date() });
          await db.markFollowUpTaskSent(task.id);
          sent++;
        }
      }
      return { sent, cancelled, total: pendingTasks.length };
    }),

    // Get tasks for a specific lead
    tasksForLead: protectedProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
      return db.getFollowUpTasksByLead(input.leadId);
    }),
  }),

  // ─── Availability ──────────────────────────────────────────────────────────
  availability: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      return db.getAvailabilitySlotsByBusiness(input.businessId);
    }),
    create: protectedProcedure.input(z.object({
      businessId: z.number(),
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      maxBookings: z.number().optional(),
    })).mutation(async ({ input }) => {
      return db.createAvailabilitySlot(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      maxBookings: z.number().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAvailabilitySlot(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAvailabilitySlot(input.id);
      return { success: true };
    }),
  }),

  // ─── Bookings ──────────────────────────────────────────────────────────────
  bookings: router({
    list: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      return db.getBookingsByBusiness(input.businessId);
    }),
    create: protectedProcedure.input(z.object({
      leadId: z.number(),
      businessId: z.number(),
      scheduledDate: z.string(),
      scheduledTime: z.string(),
      serviceType: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const booking = await db.createBooking(input);
      // Mark lead as booked
      await db.updateLead(input.leadId, { status: "booked", bookedAt: new Date() });
      await db.cancelFollowUpTasksForLead(input.leadId);
      return booking;
    }),
  }),

  // ─── KPI / Dashboard ──────────────────────────────────────────────────────
  kpi: router({
    stats: protectedProcedure.input(z.object({ businessId: z.number() })).query(async ({ input }) => {
      const leadStats = await db.getLeadStats(input.businessId);
      const bookingStats = await db.getBookingStats(input.businessId);
      const bookingRate = leadStats.total > 0 ? (leadStats.booked / leadStats.total) * 100 : 0;
      const avgResponseSec = leadStats.avgResponseMs / 1000;
      return {
        leadVolume: leadStats.total,
        newLeads: leadStats.new,
        qualifiedLeads: leadStats.qualified,
        bookedLeads: leadStats.booked,
        lostLeads: leadStats.lost,
        avgResponseTimeSec: Math.round(avgResponseSec),
        bookingRate: Math.round(bookingRate * 10) / 10,
        totalBookings: bookingStats.total,
        confirmedBookings: bookingStats.confirmed,
        completedBookings: bookingStats.completed,
      };
    }),
  }),

  // ─── Billing & Subscription ──────────────────────────────────────────────
  billing: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscription(ctx.user.id);
    }),

    createCheckout: protectedProcedure.input(z.object({
      planKey: z.enum(["starter", "professional", "enterprise"]),
      interval: z.enum(["month", "year"]),
      origin: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const { createCheckoutSession } = await import("./stripe-handler");
      const { PLANS } = await import("./stripe-products");
      const plan = PLANS[input.planKey];
      if (!plan) throw new Error("Invalid plan");
      const priceAmount = input.interval === "month" ? plan.priceMonthly : plan.priceYearly;
      const url = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email || "",
        userName: ctx.user.name || "",
        planKey: input.planKey,
        priceAmount,
        planName: plan.name,
        interval: input.interval,
        origin: input.origin,
      });
      return { checkoutUrl: url };
    }),

    createPortal: protectedProcedure.input(z.object({
      origin: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const sub = await db.getUserSubscription(ctx.user.id);
      if (!sub?.stripeCustomerId) throw new Error("No active subscription found");
      const { createPortalSession } = await import("./stripe-handler");
      const url = await createPortalSession(sub.stripeCustomerId, input.origin);
      return { portalUrl: url };
    }),
  }),

  // ─── Contact Form ──────────────────────────────────────────────────────────
  contact: router({
    submit: publicProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        trade: z.string().optional(),
        reason: z.string().optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { notifyOwner } = await import("./_core/notification");
        const subject = `New LeadHammer Inquiry from ${input.firstName}${input.lastName ? ' ' + input.lastName : ''}`;
        const content = [
          `Name: ${input.firstName}${input.lastName ? ' ' + input.lastName : ''}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          input.company ? `Company: ${input.company}` : null,
          input.trade ? `Trade: ${input.trade}` : null,
          input.reason ? `Reason: ${input.reason}` : null,
          ``,
          `Message:`,
          input.message,
        ].filter(Boolean).join('\n');
        await notifyOwner({ title: subject, content });
        return { success: true };
      }),
  }),

  // ─── ServiceTitan Live Integration ─────────────────────────────────────────
  servicetitan: router({
    // Test connection and validate credentials
    testConnection: protectedProcedure.mutation(async () => {
      const { validateCredentials } = await import("./servicetitan");
      return validateCredentials();
    }),

    // Fetch live availability from ServiceTitan
    getAvailability: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        jobDuration: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getAvailability } = await import("./servicetitan");
        const slots = await getAvailability(
          input.startDate,
          input.endDate,
          input.jobDuration ?? 120
        );
        return { slots, source: "servicetitan" as const };
      }),

    // Create a booking in ServiceTitan
    createBooking: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        businessId: z.number(),
        customerName: z.string(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
        serviceType: z.string().optional(),
        scheduledStart: z.string(),
        notes: z.string().optional(),
        address: z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { createBooking } = await import("./servicetitan");

        const contacts: Array<{ type: "Phone" | "Email" | "MobilePhone"; value: string }> = [];
        if (input.customerPhone) contacts.push({ type: "Phone", value: input.customerPhone });
        if (input.customerEmail) contacts.push({ type: "Email", value: input.customerEmail });

        const stBooking = await createBooking({
          name: input.customerName,
          summary: input.serviceType ?? "Service Request from LeadHammer",
          externalId: `leadhammer-lead-${input.leadId}`,
          contacts,
          address: input.address,
          start: input.scheduledStart,
          source: "LeadHammer",
          isSendConfirmationEmail: !!input.customerEmail,
        });

        // Record booking locally and mark lead as booked
        await db.createBooking({
          leadId: input.leadId,
          businessId: input.businessId,
          scheduledDate: input.scheduledStart.split("T")[0],
          scheduledTime: input.scheduledStart.split("T")[1]?.slice(0, 5) ?? "09:00",
          serviceType: input.serviceType,
          notes: input.notes,
        });
        await db.updateLead(input.leadId, { status: "booked", bookedAt: new Date() });
        await db.cancelFollowUpTasksForLead(input.leadId);

        return { success: true, serviceTitanBookingId: stBooking.id };
      }),

    // Sync a lead to ServiceTitan CRM
    syncLead: protectedProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) throw new Error("Lead not found");

        const { createLead } = await import("./servicetitan");

        const contacts: Array<{ type: "Phone" | "Email" | "MobilePhone"; value: string }> = [];
        if (lead.customerPhone) contacts.push({ type: "Phone", value: lead.customerPhone });
        if (lead.customerEmail) contacts.push({ type: "Email", value: lead.customerEmail });

        const stLead = await createLead({
          name: lead.customerName ?? "Unknown",
          source: lead.sourceType ?? "LeadHammer",
          contacts,
          message: lead.serviceNeeded ?? undefined,
        });

        return { success: true, serviceTitanLeadId: stLead.id };
      }),
  }),

  // ─── Messaging (Plivo SMS) ──────────────────────────────────────────────────
  messaging: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return getOrCreateMessagingSettings(business.id);
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        smsEnabled: z.boolean().optional(),
        fromNumber: z.string().optional(),
        dailySendLimit: z.number().min(1).max(1000).optional(),
        optOutKeywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) throw new Error("Business not found");
        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database unavailable");
        await getOrCreateMessagingSettings(business.id);
        await dbConn
          .update(messagingSettings)
          .set({
            ...(input.smsEnabled !== undefined && { smsEnabled: input.smsEnabled }),
            ...(input.fromNumber !== undefined && { fromNumber: normalisePhone(input.fromNumber) }),
            ...(input.dailySendLimit !== undefined && { dailySendLimit: input.dailySendLimit }),
            ...(input.optOutKeywords !== undefined && { optOutKeywords: input.optOutKeywords }),
          })
          .where(eq(messagingSettings.businessId, business.id));
        return { success: true };
      }),

    sendSms: protectedProcedure
      .input(z.object({
        toNumber: z.string().min(10),
        body: z.string().min(1).max(1600),
        leadId: z.number().optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) throw new Error("Business not found");
        return sendSms({
          businessId: business.id,
          toNumber: input.toNumber,
          body: input.body,
          leadId: input.leadId,
          conversationId: input.conversationId,
        });
      }),

    testSend: protectedProcedure
      .input(z.object({ toNumber: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) throw new Error("Business not found");
        return sendSms({
          businessId: business.id,
          toNumber: input.toNumber,
          body: `LeadHammer test message from ${business.name}. Your SMS delivery is working correctly! Reply STOP to opt out.`,
        });
      }),

    getLogs: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        leadId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) throw new Error("Business not found");
        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database unavailable");
        const conditions = [eq(smsLogs.businessId, business.id)];
        if (input.leadId) conditions.push(eq(smsLogs.leadId, input.leadId));
        const logs = await dbConn
          .select()
          .from(smsLogs)
          .where(and(...conditions))
          .orderBy(desc(smsLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        return logs;
      }),

    removeOptOut: protectedProcedure
      .input(z.object({ phoneNumber: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByOwnerId(ctx.user.id);
        if (!business) throw new Error("Business not found");
        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database unavailable");
        const settings = await getOrCreateMessagingSettings(business.id);
        const normalised = normalisePhone(input.phoneNumber);
        const optedOut: string[] = (settings.optedOutNumbers as string[]) ?? [];
        await dbConn
          .update(messagingSettings)
          .set({ optedOutNumbers: optedOut.filter((n) => n !== normalised) })
          .where(eq(messagingSettings.businessId, business.id));
        return { success: true };
      }),
  }),

});
// appRouter is now closed above; followup router is merged via re-export below
// ─── Helper: Build System Prompt ──────────────────────────────────────────────
function buildSystemPrompt(business: any, lead: any, liveAvailability?: string): string {
  const categories = business.serviceCategories?.length > 0
    ? business.serviceCategories.join(", ")
    : "general home services";

  const workingHoursText = business.workingHours
    ? Object.entries(business.workingHours)
        .filter(([_, v]: any) => v.enabled)
        .map(([day, v]: any) => `${day}: ${v.start} - ${v.end}`)
        .join(", ")
    : "standard business hours";

  let prompt = `You are an AI assistant for ${business.name}, a home service company specializing in ${categories}.

Your role is to respond to customer inquiries about repair and service needs. You should be helpful, knowledgeable, and aim to qualify leads and book appointments.

Business Information:
- Company: ${business.name}
- Services: ${categories}
- Working Hours: ${workingHoursText}
- Timezone: ${business.timezone || "Eastern Time"}
${business.phone ? `- Phone: ${business.phone}` : ""}
${business.address ? `- Address: ${business.address}` : ""}

Communication Style: ${business.aiTone || "professional"} tone. Be warm, empathetic, and solution-oriented.`;

  if (business.aiContext) {
    prompt += `\n\nAdditional Business Context:\n${business.aiContext}`;
  }

  if (business.aiPromptInstructions) {
    prompt += `\n\nSpecial Instructions:\n${business.aiPromptInstructions}`;
  }

  if (business.aiResponseRules?.length > 0) {
    prompt += `\n\nResponse Rules:\n${business.aiResponseRules.map((r: string) => `- ${r}`).join("\n")}`;
  }

  if (business.aiUnsupportedReply) {
    prompt += `\n\nFor services you don't offer, respond with: ${business.aiUnsupportedReply}`;
  }

  prompt += `\n\nGuidelines:
- Respond quickly and professionally
- Ask qualifying questions to understand the issue
- Offer to schedule an appointment when appropriate
- If the customer describes an emergency, prioritize urgency
- Keep responses concise but helpful (2-4 sentences typically)
- Never make up pricing — say you'll provide a quote after assessment
- If you cannot help with a request, politely explain and suggest alternatives`;

  if (liveAvailability) {
    prompt += `\n\nLive Scheduling Availability:\n${liveAvailability}\nWhen the customer asks about scheduling, use these real-time windows to offer specific dates and times.`;
  }

  if (lead) {
    prompt += `\n\nCurrent Customer: ${lead.customerName || "Unknown"}`;
    if (lead.serviceNeeded) prompt += `\nTheir inquiry: ${lead.serviceNeeded}`;
  }

  return prompt;
}

// ─── Messaging ────────────────────────────────────────────────────────────────
const messagingRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) throw new Error("Business not found");
    return getOrCreateMessagingSettings(business.id);
  }),

  updateSettings: protectedProcedure
    .input(z.object({
      smsEnabled: z.boolean().optional(),
      fromNumber: z.string().optional(),
      dailySendLimit: z.number().min(1).max(1000).optional(),
      optOutKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      const existing = await getOrCreateMessagingSettings(business.id);
      await dbConn
        .update(messagingSettings)
        .set({
          ...(input.smsEnabled !== undefined && { smsEnabled: input.smsEnabled }),
          ...(input.fromNumber !== undefined && { fromNumber: normalisePhone(input.fromNumber) }),
          ...(input.dailySendLimit !== undefined && { dailySendLimit: input.dailySendLimit }),
          ...(input.optOutKeywords !== undefined && { optOutKeywords: input.optOutKeywords }),
        })
        .where(eq(messagingSettings.businessId, business.id));
      return { success: true };
    }),

  sendSms: protectedProcedure
    .input(z.object({
      toNumber: z.string().min(10),
      body: z.string().min(1).max(1600),
      leadId: z.number().optional(),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return sendSms({
        businessId: business.id,
        toNumber: input.toNumber,
        body: input.body,
        leadId: input.leadId,
        conversationId: input.conversationId,
      });
    }),

  testSend: protectedProcedure
    .input(z.object({
      toNumber: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return sendSms({
        businessId: business.id,
        toNumber: input.toNumber,
        body: `LeadHammer test message from ${business.name}. Your SMS delivery is working correctly!`,
      });
    }),

  getLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
      leadId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      const conditions = [eq(smsLogs.businessId, business.id)];
      if (input.leadId) conditions.push(eq(smsLogs.leadId, input.leadId));
      const logs = await dbConn
        .select()
        .from(smsLogs)
        .where(and(...conditions))
        .orderBy(desc(smsLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return logs;
    }),

  removeOptOut: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      const settings = await getOrCreateMessagingSettings(business.id);
      const normalised = normalisePhone(input.phoneNumber);
      const optedOut: string[] = (settings.optedOutNumbers as string[]) ?? [];
      await dbConn
        .update(messagingSettings)
        .set({ optedOutNumbers: optedOut.filter((n) => n !== normalised) })
        .where(eq(messagingSettings.businessId, business.id));
      return { success: true };
    }),
});

// ─── Follow-Up Engine Router ─────────────────────────────────────────────────
const followupRouter = router({
  // Get all templates for the current business (seeds defaults if none exist)
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) throw new Error("Business not found");
    return getTemplatesForBusiness(business.id);
  }),

  // Save (create or update) a template
  saveTemplate: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      attemptNumber: z.number().min(1).max(10),
      name: z.string().min(1),
      promptInstructions: z.string().min(1),
      tone: z.enum(["friendly", "professional", "urgent"]),
      maxChars: z.number().min(50).max(1600).default(320),
      forbiddenPhrases: z.array(z.string()).default([]),
      approvalRequired: z.boolean().default(false),
      delayHours: z.number().min(1).max(720).default(24),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return saveTemplate(business.id, input);
    }),

  // Get A/B variants for a template
  getVariants: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => getVariantsForTemplate(input.templateId)),

  // Save an A/B variant
  saveVariant: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      templateId: z.number(),
      variantLabel: z.enum(["A", "B"]),
      promptInstructions: z.string().min(1),
    }))
    .mutation(async ({ input }) => saveVariant(input.templateId, input)),

  // Preview: generate a sample AI message from a template
  previewMessage: protectedProcedure
    .input(z.object({
      promptInstructions: z.string(),
      tone: z.enum(["friendly", "professional", "urgent"]),
      maxChars: z.number().default(320),
      forbiddenPhrases: z.array(z.string()).default([]),
      attemptNumber: z.number().default(1),
      customerName: z.string().default("John Smith"),
      serviceDescription: z.string().default("HVAC tune-up and filter replacement"),
      estimateAmount: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      const businessName = business?.name ?? "Your Company";
      const message = await generateFollowupMessage({
        ...input,
        businessName,
      });
      return { message };
    }),

  // Get the follow-up queue (all or filtered by status)
  getQueue: protectedProcedure
    .input(z.object({
      status: z.enum(["pending_approval", "approved", "sent", "rejected", "failed"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return getQueue(business.id, input.status);
    }),

  // Approve a queued item (sends the SMS)
  approveItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      return approveQueueItem(input.id, business.id);
    }),

  // Reject a queued item
  rejectItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      const ok = await rejectQueueItem(input.id, business.id);
      return { success: ok };
    }),

  // Edit the generated message before approving
  editMessage: protectedProcedure
    .input(z.object({ id: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");
      const ok = await updateGeneratedMessage(input.id, business.id, input.message);
      return { success: ok };
    }),

  // Get stats (total, sent, pending, converted, conversion rate)
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const business = await db.getBusinessByOwnerId(ctx.user.id);
    if (!business) throw new Error("Business not found");
    return getFollowupStats(business.id);
  }),

  // Manually enqueue a follow-up (for testing or manual triggers)
  enqueue: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      customerName: z.string(),
      customerPhone: z.string(),
      serviceDescription: z.string(),
      estimateAmount: z.string().optional(),
      estimateId: z.string().optional(),
      leadId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await db.getBusinessByOwnerId(ctx.user.id);
      if (!business) throw new Error("Business not found");

      const templates = await getTemplatesForBusiness(business.id);
      const template = templates.find((t) => t.id === input.templateId);
      if (!template) throw new Error("Template not found");

      const message = await generateFollowupMessage({
        promptInstructions: template.promptInstructions,
        tone: template.tone ?? "friendly",
        maxChars: template.maxChars ?? 320,
        forbiddenPhrases: (template.forbiddenPhrases as string[]) ?? [],
        customerName: input.customerName,
        serviceDescription: input.serviceDescription,
        estimateAmount: input.estimateAmount,
        attemptNumber: template.attemptNumber,
        businessName: business.name,
      });

      const item = await enqueueFollowup({
        businessId: business.id,
        leadId: input.leadId,
        templateId: template.id,
        attemptNumber: template.attemptNumber,
        estimateId: input.estimateId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        estimateAmount: input.estimateAmount,
        serviceDescription: input.serviceDescription,
        generatedMessage: message,
        approvalRequired: template.approvalRequired ?? false,
        scheduledAt: new Date(),
      });

      return { item, message };
    }),
});

// Merge followup router into the exported app router
export const mergedAppRouter = router({
  ...appRouter._def.procedures,
  followup: followupRouter,
});

export type AppRouter = typeof mergedAppRouter;
export { messagingRouter, followupRouter };
