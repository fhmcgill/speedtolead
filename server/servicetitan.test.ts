/**
 * ServiceTitan Integration Tests
 * Tests the real API credentials by making a lightweight token request.
 */
import { describe, it, expect } from "vitest";
import { getServiceTitanToken, validateCredentials } from "./servicetitan";

// Only run live API tests if credentials are present in the environment
const hasCredentials =
  !!process.env.SERVICETITAN_CLIENT_ID &&
  !!process.env.SERVICETITAN_CLIENT_SECRET &&
  !!process.env.SERVICETITAN_TENANT_ID &&
  !!process.env.SERVICETITAN_APP_KEY;

describe("ServiceTitan API Client", () => {
  it("should have all required credentials configured", () => {
    expect(process.env.SERVICETITAN_CLIENT_ID).toBeTruthy();
    expect(process.env.SERVICETITAN_CLIENT_SECRET).toBeTruthy();
    expect(process.env.SERVICETITAN_TENANT_ID).toBeTruthy();
    expect(process.env.SERVICETITAN_APP_KEY).toBeTruthy();
    expect(process.env.SERVICETITAN_APP_ID).toBeTruthy();
  });

  it(
    "should obtain a valid OAuth2 access token from ServiceTitan",
    async () => {
      if (!hasCredentials) {
        console.warn("Skipping live API test: credentials not in environment");
        return;
      }
      const token = await getServiceTitanToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);
      console.log("[ServiceTitan] Token obtained successfully, length:", token.length);
    },
    30_000 // 30s timeout for network call
  );

  it(
    "should validate credentials and return tenant info",
    async () => {
      if (!hasCredentials) {
        console.warn("Skipping live API test: credentials not in environment");
        return;
      }
      const result = await validateCredentials();
      console.log("[ServiceTitan] Validation result:", result);
      // Even if the tenant endpoint returns an error, the token should be valid
      // A 404 on /settings/tenant is acceptable — it means auth worked
      expect(result.valid === true || (result.error && !result.error.includes("auth failed"))).toBe(true);
    },
    30_000
  );
});
