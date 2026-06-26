export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Anthropic Claude API (replaces Forge for AI lead replies / follow-ups)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  // Google Ads API (Local Services Ads lead sync + reply)
  // These four are global -- one HammerApp-owned manager account (MCC) and
  // developer token serve every connected client business. Per-business
  // identifiers (the client's own Google Ads customer ID, and the OAuth
  // refresh token granting access to it) live in lead_sources.config instead,
  // since those vary per business -- see server/googleLsaSync.ts.
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID ?? "",
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
  googleAdsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
  googleAdsLoginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? "",
  // Shared secret checked on cron-triggered endpoints (e.g. the LSA sync route)
  // so they can be safely called by an external scheduler without a user session.
  cronSecret: process.env.CRON_SECRET ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // ServiceTitan
  serviceTitanAppKey: process.env.SERVICETITAN_APP_KEY ?? "",
  serviceTitanClientId: process.env.SERVICETITAN_CLIENT_ID ?? "",
  serviceTitanClientSecret: process.env.SERVICETITAN_CLIENT_SECRET ?? "",
  serviceTitanTenantId: process.env.SERVICETITAN_TENANT_ID ?? "",
  serviceTitanAppId: process.env.SERVICETITAN_APP_ID ?? "",
  // Plivo SMS
  plivoAuthId: process.env.PLIVO_AUTH_ID ?? "",
  plivoAuthToken: process.env.PLIVO_AUTH_TOKEN ?? "",
  plivoFromNumber: process.env.PLIVO_FROM_NUMBER ?? "",
};
