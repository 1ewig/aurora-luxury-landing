/**
 * Aurora — src/stores/useAuthStore.ts
 *
 * Zustand store for all authentication state and operations.
 * Acts as a thin wrapper around the Better Auth browser client,
 * exposing a unified API with:
 *  - Human-readable error mapping (mapBetterAuthError)
 *  - Automatic role fetching after sign-in/sign-up
 *  - React Context provider (AuthProvider) for SSR-safe store instances
 *  - Fallback store for when useAuthStore is called outside AuthProvider
 *
 * Architecture: Uses createStore (vanilla Zustand) + React Context rather
 * than zustand/react's create() hook, to support server-side rendering
 * and request-scoped store instances.
 */

"use client";

import { createStore, useStore } from 'zustand';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authClient } from '@/lib/auth-client';
import { fetchUserRole, buildUserState } from '@/utils/auth';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean | null;
  image?: string | null;
  isAdmin?: boolean | null;
  role?: string | null;
}

export interface Profile {
  displayName: string;
}

/**
 * Maps Better Auth error codes, statuses, and message patterns to
 * user-friendly strings. Checks are ordered from most specific to
 * most generic to avoid false matches (e.g. "account not found" vs
 * "no account found with this email").
 */
function mapBetterAuthError(error: any): string {
  if (!error) return "Something went wrong.";
  const msg = (error.message || "").toLowerCase();
  const status = error.status;
  const code = (error.code || "").toLowerCase();

  // Specific error codes from Better Auth SDK
  if (status === 403 || code === "email_not_verified") return "Please verify your email before signing in.";
  if (code === "user_not_found") return "No account found with this email address.";
  if (code === "invalid_password") return "Incorrect password. Try again or reset your password.";
  if (code === "invalid_token" || msg.includes("invalid token")) return "This link is invalid or has expired.";
  if (code === "invalid_email" || msg.includes("invalid email")) return "This email address is not valid.";
  if (code === "weak_password" || msg.includes("password is too short")) return "Password must be at least 8 characters.";
  if (code === "rate_limit" || msg.includes("rate limit") || msg.includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";

  // Message-pattern matching for cases where there's no structured error code
  if (msg.includes("already") && (msg.includes("exist") || msg.includes("registered") || msg.includes("taken"))) return "An account with this email already exists.";
  if (msg.includes("account") && msg.includes("not found")) return "No account found with this email address.";
  if (msg.includes("reset") && msg.includes("password") && msg.includes("expired")) return "This password reset link has expired. Please request a new one.";

  return error.message || "Something went wrong.";
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: any }>;
  verifyEmail: (email: string, token: string) => Promise<{ error: any }>;
  resendVerification: (email: string) => Promise<{ error: any }>;
  sendResetPasswordEmail: (email: string) => Promise<{ error: any }>;
  resetPassword: (newPassword: string, token: string) => Promise<{ error: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  clearError: () => void;
}

/** Create vanilla auth store instance. */
export const createAuthStore = (initialUser: User | null = null) => {
  return createStore<AuthState>((set, get) => ({
  user: initialUser,
  profile: initialUser ? { displayName: initialUser.name || "" } : null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  /*
   * Each async action follows the same pattern:
   *  1. set({ loading: true, error: null })
   *  2. Call the authClient method
   *  3. On error: mapBetterAuthError, set error
   *  4. On success: fetch role, build state, set user/profile
   *  5. On exception: fallback error message
   */

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) {
        const message = mapBetterAuthError(error);
        // Detect email-not-verified specifically so the UI can prompt resend
        const isUnverified = error.status === 403 || (error.message || "").toLowerCase().includes("verify");
        set({ loading: false, error: message });
        return { error, needsVerification: isUnverified };
      }

      if (data?.user) {
        // Fetch role (admin/user) from the server to populate isAdmin
        const role = await fetchUserRole();
        const state = buildUserState(data.user, role);
        set({ ...state, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
      return { error: null, needsVerification: false };
    } catch (err: any) {
      const message = err.message || "Failed to sign in.";
      set({ loading: false, error: message });
      return { error: { message }, needsVerification: false };
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await authClient.signUp.email({ email, password, name: name || "" });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error: message, needsVerification: false };
      }

      // If email verification is disabled, the user is logged in immediately
      if (data?.user && data.user.emailVerified) {
        const role = await fetchUserRole();
        const state = buildUserState(data.user, role);
        set({ ...state, loading: false });
        return { error: null, needsVerification: false };
      }

      // Email verification required — user needs to check their inbox
      set({ loading: false });
      return { error: null, needsVerification: true };
    } catch (err: any) {
      const message = mapBetterAuthError(err);
      set({ loading: false, error: message });
      return { error: message, needsVerification: false };
    }
  },

  signOut: async () => {
    try {
      await authClient.signOut();
    } catch {
      // Proceed with local cleanup even if the API call fails
    }
    set({ user: null, profile: null, error: null });
  },

  updateProfile: async (updatedFields) => {
    try {
      const currentProfile = get().profile;
      const displayName = updatedFields.displayName || currentProfile?.displayName || '';
      const res = await authClient.updateUser({ name: displayName });
      if (res.error) {
        return { error: res.error };
      }
      set({ profile: { displayName } });
      return { error: null };
    } catch (err: any) {
      set({ error: err.message });
      return { error: err };
    }
  },

  verifyEmail: async (_email, token) => {
    if (!token) {
      set({ error: "No verification token provided.", loading: false });
      return { error: { message: "No verification token provided." } };
    }
    set({ loading: true, error: null });
    try {
      const { error } = await authClient.verifyEmail({ query: { token } });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error: message };
      }
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      const message = mapBetterAuthError(err);
      set({ loading: false, error: message });
      return { error: { message } };
    }
  },

  resendVerification: async (email) => {
    set({ loading: true, error: null });
    try {
      // The callback URL tells Better Auth where to redirect after verification
      const callbackURL = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || window.location.origin}/profile`;
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error };
      }
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false, error: err.message });
      return { error: err };
    }
  },

  sendResetPasswordEmail: async (email) => {
    set({ loading: true, error: null });
    try {
      // The redirectTo is the page where the user will enter their new password
      const redirectTo = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || window.location.origin}/reset-password`;
      const { error } = await authClient.requestPasswordReset({ email, redirectTo });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error: message };
      }
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false, error: err.message });
      return { error: err };
    }
  },

  resetPassword: async (newPassword, token) => {
    set({ loading: true, error: null });
    try {
      const { error } = await authClient.resetPassword({ newPassword, token });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error: message };
      }
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false, error: err.message });
      return { error: err };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword });
      if (error) {
        const message = mapBetterAuthError(error);
        set({ loading: false, error: message });
        return { error: message };
      }
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false, error: err.message });
      return { error: err };
    }
  },
  }));
};

// React Context for request-scoped store instances
export const AuthStoreContext = createContext<ReturnType<typeof createAuthStore> | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  /*
   * Store instance is created lazily on the first render and persists
   * via useState (no re-creation on re-renders). This is the SSR-safe
   * pattern recommended by Zustand for use with React Context.
   */
  const [store] = useState(() => createAuthStore(initialUser));

  /*
   * On mount, if no initialUser was provided (e.g. SSR without session),
   * attempt to recover the session from the client-side auth cookie.
   * This handles the case where the user refreshes the page and the
   * server component didn't have access to the session cookie.
   */
  useEffect(() => {
    if (initialUser) return;

    async function recoverSession() {
      try {
        const { data: sessionData } = await authClient.getSession();
        if (!sessionData?.user) return;

        const role = await fetchUserRole();
        const state = buildUserState(sessionData.user, role);
        store.setState({ ...state });
      } catch {
        // Silent — the server-side role query may have failed transiently
        // or the user simply isn't logged in.
      }
    }

    recoverSession();
  }, [initialUser, store]);

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

// Fallback store instance for static method access (tests, utilities, or unguarded usage)
const fallbackStore = createAuthStore(null);

/**
 * Custom hook with overloaded selector support and a fallback guard.
 * If called outside of AuthProvider, it logs a dev warning and uses the
 * fallback singleton store (which starts with user=null).
 */
export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T): T | AuthState {
  const store = useContext(AuthStoreContext);
  if (!store) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useAuthStore called outside of AuthProvider. ' +
        'Wrap your component tree with <AuthInitializer> or <AuthProvider>. ' +
        'Falling back to default store.'
      );
    }
    if (selector) {
      return useStore(fallbackStore, selector);
    }
    return useStore(fallbackStore);
  }
  if (selector) {
    return useStore(store, selector);
  }
  return useStore(store);
}


