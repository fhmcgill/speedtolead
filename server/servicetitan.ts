/**
 * ServiceTitan API Client
 * Handles OAuth2 token management and all API interactions for LeadHammer.
 *
 * ServiceTitan uses Client Credentials OAuth2 flow:
 * POST https://auth.servicetitan.io/connect/token
 * with client_id, client_secret, grant_type=client_credentials
 *
 * All API calls go to: https://api.servicetitan.io/{namespace}/v2/tenant/{tenantId}/...
 */

import { ENV } from "./_core/env";

const ST_AUTH_URL = "https://auth.servicetitan.io/connect/token";
const ST_API_BASE = "https://api.servicetitan.io";

// ─── Token Cache ───────────────────────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getServiceTitanToken(): Promise<string> {
  const now = Date.now();
  // Reuse cached token if it has more than 60 seconds remaining
  if (cachedToken && cachedToken.expiresAt - now > 60_000) {
    return cachedToken.token;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: ENV.serviceTitanClientId,
    client_secret: ENV.serviceTitanClientSecret,
  });

  const response = await fetch(ST_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ServiceTitan auth failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.token;
}

// ─── Generic API Request Helper ────────────────────────────────────────────────
async function stRequest<T>(
  namespace: string,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<T> {
  const token = await getServiceTitanToken();
  const tenantId = ENV.serviceTitanTenantId;
  const appKey = ENV.serviceTitanAppKey;

  let url = `${ST_API_BASE}/${namespace}/v2/tenant/${tenantId}${path}`;

  // Append query params
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "ST-App-Key": appKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `ServiceTitan API error ${response.status} on ${options.method ?? "GET"} ${path}: ${text}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface STBusinessHours {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  openTime: string;  // "08:00"
  closeTime: string; // "17:00"
  isOpen: boolean;
}

export interface STAvailabilitySlot {
  date: string;       // "2026-05-02"
  startTime: string;  // "09:00"
  endTime: string;    // "11:00"
  available: boolean;
  technicianCount?: number;
}

export interface STBookingPayload {
  name: string;
  summary?: string;
  isFirstTimeClient?: boolean;
  externalId?: string;
  contacts: Array<{
    type: "Phone" | "Email" | "MobilePhone";
    value: string;
    memo?: string;
  }>;
  address?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  start?: string; // ISO datetime
  jobTypeId?: number;
  campaignId?: number;
  businessUnitId?: number;
  source?: string;
  isSendConfirmationEmail?: boolean;
}

export interface STBookingResult {
  id: number;
  status: string;
  externalId?: string;
}

export interface STLeadPayload {
  name: string;
  source?: string;
  contacts: Array<{
    type: "Phone" | "Email" | "MobilePhone";
    value: string;
  }>;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  message?: string;
  campaignId?: number;
}

export interface STLeadResult {
  id: number;
  status: string;
}

// ─── API Methods ───────────────────────────────────────────────────────────────

/**
 * Fetch business hours / capacity windows from ServiceTitan.
 * Uses the Capacity endpoint to get available windows for a date range.
 */
export async function getAvailability(
  startDate: string,
  endDate: string,
  jobDuration = 120
): Promise<STAvailabilitySlot[]> {
  try {
    // Try the scheduling capacity endpoint
    const result = await stRequest<{
      data?: Array<{
        start: string;
        end: string;
        availableCapacity?: number;
        totalCapacity?: number;
      }>;
    }>("scheduling", "/capacity", {
      params: {
        startsOnOrAfter: startDate,
        endsOnOrBefore: endDate,
        jobDuration,
      },
    });

    if (result.data && result.data.length > 0) {
      return result.data.map((slot) => {
        const start = new Date(slot.start);
        const end = new Date(slot.end);
        return {
          date: start.toISOString().split("T")[0],
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          available: (slot.availableCapacity ?? 1) > 0,
          technicianCount: slot.availableCapacity,
        };
      });
    }

    return [];
  } catch (err) {
    // Fall back to business hours if capacity endpoint is not available
    console.warn("[ServiceTitan] Capacity endpoint failed, falling back to business hours:", err);
    return getAvailabilityFromBusinessHours(startDate, endDate);
  }
}

/**
 * Fetch business hours and derive available slots from them.
 */
export async function getAvailabilityFromBusinessHours(
  startDate: string,
  endDate: string
): Promise<STAvailabilitySlot[]> {
  const result = await stRequest<{
    data?: Array<{
      dayOfWeek: number; // 0=Sunday, 1=Monday...
      openTime: string;
      closeTime: string;
      isOpen: boolean;
    }>;
  }>("settings", "/business-hours");

  const hours = result.data ?? [];
  const slots: STAvailabilitySlot[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0=Sunday
    const businessDay = hours.find((h) => h.dayOfWeek === dayOfWeek);

    if (businessDay?.isOpen) {
      const dateStr = d.toISOString().split("T")[0];
      // Create morning and afternoon slots
      const openHour = parseInt(businessDay.openTime.split(":")[0]);
      const closeHour = parseInt(businessDay.closeTime.split(":")[0]);
      const midpoint = Math.floor((openHour + closeHour) / 2);

      slots.push({
        date: dateStr,
        startTime: businessDay.openTime,
        endTime: `${String(midpoint).padStart(2, "0")}:00`,
        available: true,
      });

      if (closeHour - midpoint >= 2) {
        slots.push({
          date: dateStr,
          startTime: `${String(midpoint).padStart(2, "0")}:00`,
          endTime: businessDay.closeTime,
          available: true,
        });
      }
    }
  }

  return slots;
}

/**
 * Create a booking in ServiceTitan.
 */
export async function createBooking(payload: STBookingPayload): Promise<STBookingResult> {
  const result = await stRequest<STBookingResult>("jpm", "/bookings", {
    method: "POST",
    body: payload,
  });
  return result;
}

/**
 * Create a lead in ServiceTitan CRM.
 */
export async function createLead(payload: STLeadPayload): Promise<STLeadResult> {
  const result = await stRequest<STLeadResult>("crm", "/leads", {
    method: "POST",
    body: payload,
  });
  return result;
}

/**
 * Validate credentials by obtaining an OAuth2 access token.
 * A successful token fetch is sufficient proof that the credentials are valid.
 * We avoid calling a specific tenant endpoint because the exact path varies
 * by ServiceTitan account configuration and may return 404 even for valid tenants.
 */
export async function validateCredentials(): Promise<{
  valid: boolean;
  tenantName?: string;
  error?: string;
}> {
  try {
    const token = await getServiceTitanToken();
    if (!token) {
      return { valid: false, error: "Failed to obtain access token" };
    }
    // Token obtained successfully — credentials are valid.
    // Attempt a lightweight settings call to get the tenant name, but treat
    // any API error as non-fatal (credentials are still valid if token works).
    try {
      const result = await stRequest<{ name?: string; id?: number }>(
        "settings",
        "/tenant"
      );
      return {
        valid: true,
        tenantName: result.name ?? `Tenant ${ENV.serviceTitanTenantId}`,
      };
    } catch {
      // Tenant endpoint not available for this account — still valid
      return {
        valid: true,
        tenantName: `Tenant ${ENV.serviceTitanTenantId}`,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ServiceTitan] Validation result:", { valid: false, error: message });
    return { valid: false, error: message };
  }
}
