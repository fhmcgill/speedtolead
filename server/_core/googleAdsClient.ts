/**
 * googleAdsClient.ts — Lazy Google Ads API client for Local Services Ads sync.
 *
 * Architecture note on multi-tenancy:
 * One Google Ads Manager account (MCC) + developer token, owned by HammerApp,
 * serves every connected client business. The four GOOGLE_ADS_* env vars below
 * are global for that reason. What's per-business is the *client's own* Google
 * Ads customer ID and the OAuth refresh token that grants access to it — those
 * live in lead_sources.config (see googleLsaSync.ts), not env vars, since every
 * connected business has its own.
 *
 * This file never constructs the GoogleAdsApi client at import time -- only on
 * first actual use, and only if the required env vars are present. An eagerly
 * constructed client with missing config crashed this app's Plivo integration
 * once already (see useAuth.ts / messaging.ts history); this pattern avoids
 * repeating that mistake for a second external service.
 */

import { GoogleAdsApi, type Customer } from "google-ads-api";
import { ENV } from "./env";

let _client: GoogleAdsApi | null = null;

function getClient(): GoogleAdsApi {
  if (_client) return _client;

  if (!ENV.googleAdsClientId || !ENV.googleAdsClientSecret || !ENV.googleAdsDeveloperToken) {
    throw new Error(
      "Google Ads API is not configured. Set GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, " +
        "and GOOGLE_ADS_DEVELOPER_TOKEN to enable Local Services Ads sync."
    );
  }

  _client = new GoogleAdsApi({
    client_id: ENV.googleAdsClientId,
    client_secret: ENV.googleAdsClientSecret,
    developer_token: ENV.googleAdsDeveloperToken,
  });

  return _client;
}

/**
 * Get a Customer instance scoped to one connected business's Google Ads
 * account. `customerId` and `refreshToken` come from that business's
 * lead_sources.config -- see googleLsaSync.ts for where those are read.
 */
export function getGoogleAdsCustomer(opts: {
  customerId: string;
  refreshToken: string;
}): Customer {
  if (!ENV.googleAdsLoginCustomerId) {
    throw new Error(
      "GOOGLE_ADS_LOGIN_CUSTOMER_ID is not configured. This must be the manager " +
        "account (MCC) ID that the client's account is linked under."
    );
  }

  const client = getClient();

  return client.Customer({
    customer_id: opts.customerId,
    login_customer_id: ENV.googleAdsLoginCustomerId,
    refresh_token: opts.refreshToken,
  });
}
