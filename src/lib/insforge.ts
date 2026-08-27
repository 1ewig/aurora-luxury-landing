/**
 * Aurora — src/lib/insforge.ts
 *
 * React hook (useInsforgeClient) that provides an authenticated InsForge
 * browser client. The JWT bridge token is fetched from the server endpoint
 * (/api/insforge-token) on mount and refreshed every 50 minutes.
 *
 * The bridge JWT is signed server-side with the user's Better Auth session
 * and allows the client SDK to authenticate with InsForge Storage and
 * edge functions.
 *
 * SDK API variance: newer versions use setAccessToken(), older versions
 * need setAuthToken() on the HTTP client + realtime token manager.
 * Both paths are handled here.
 */

'use client';

import { createClient, type InsForgeClient } from '@insforge/sdk';
import { authClient } from './auth-client';
import { useEffect, useMemo, useState } from 'react';

const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

/**
 * Sets the auth token on the InsForge client.
 * Handles SDK version differences:
 * - V2+: setAccessToken() directly on the client.
 * - V1: getHttpClient().setAuthToken() + realtime token manager.
 */
function setBridgeToken(client: InsForgeClient, token: string | null) {
  if (typeof (client as unknown as { setAccessToken?: unknown }).setAccessToken === 'function') {
    (client as unknown as { setAccessToken: (t: string | null) => void }).setAccessToken(token);
    return;
  }
  client.getHttpClient().setAuthToken(token);
  (client.realtime as unknown as { tokenManager: { setAccessToken: (t: string | null) => void } })
    .tokenManager.setAccessToken(token);
}

/** Provides an InsForge client with automatic JWT bridging for the current user session. */
export function useInsforgeClient(): { client: InsForgeClient; isReady: boolean } {
  const session = authClient.useSession();
  const userId = session.data?.user?.id;
  const [isReady, setIsReady] = useState(false);
  const [prevUserId, setPrevUserId] = useState(userId);

  const client = useMemo(
    () =>
      createClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
        anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      }),
    [],
  );

  if (prevUserId !== userId) {
    setPrevUserId(userId);
    if (!userId) {
      setBridgeToken(client, null);
      setIsReady(false);
    }
  }

  /*
   * When the user session changes, fetch a fresh JWT bridge token.
   * Token is refreshed every 50 minutes via setInterval to prevent
   * expiry during long sessions. The cancelled flag prevents setting
   * state after unmount.
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch('/api/insforge-token', { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`bridge ${res.status}`);
        const { token } = await res.json();
        if (cancelled) return;
        if (typeof token !== 'string' || !token) throw new Error('bridge: no token in response');
        setBridgeToken(client, token);
        setIsReady(true);
      } catch {
        if (cancelled) return;
        setBridgeToken(client, null);
        setIsReady(false);
      }
    };

    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, userId]);

  return { client, isReady };
}
