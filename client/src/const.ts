export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // If these aren't configured, fall back to a safe path instead of throwing.
  // A broken login button is recoverable; a crashed landing page is not --
  // this function used to be called unconditionally on every render (even
  // for logged-out visitors who never click "Sign In"), so any failure here
  // used to take down the entire public site, not just the login flow.
  if (!oauthPortalUrl || !appId) {
    console.error(
      "[Auth] VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not configured -- login is unavailable."
    );
    return "/";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  let url: URL;
  try {
    url = new URL(`${oauthPortalUrl}/app-auth`);
  } catch {
    console.error(`[Auth] VITE_OAUTH_PORTAL_URL is not a valid URL: "${oauthPortalUrl}"`);
    return "/";
  }

  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
