export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
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
