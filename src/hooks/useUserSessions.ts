/**
 * Aurora — src/hooks/useUserSessions.ts
 *
 * Fetches and exposes active sessions for a given user (admin user detail view).
 */

"use client";

import { useState, useEffect } from "react";

export interface SessionRow {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

/** Fetches active sessions for a user. Used in the admin user detail modal. */
export function useUserSessions(userId: string | null) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [prevUserId, setPrevUserId] = useState(userId);
  const [loading, setLoading] = useState(false);

  if (prevUserId !== userId) {
    setPrevUserId(userId);
    if (!userId) {
      setSessions([]);
    }
  }

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}?include=sessions`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSessions(data.sessions || []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  return { sessions, loading };
}
