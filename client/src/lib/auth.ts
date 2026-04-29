import { trpc } from "./trpc";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const logoutMutation = trpc.auth.logout.useMutation();

  const signIn = () => {
    const callbackUrl = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(window.location.pathname);
    const authUrl = new URL(`${window.location.origin}/api/auth`);
    authUrl.searchParams.set("redirectUri", callbackUrl);
    authUrl.searchParams.set("state", state);
    window.location.href = authUrl.toString();
  };

  const signOut = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };
}

export function useRequireAuth(redirectPath: string = "/") {
  const { user, isLoading, isAuthenticated, signIn } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    redirectOnUnauthenticated: !isLoading && !isAuthenticated,
  };
}
