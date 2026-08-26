/**
 * Aurora — src/utils/admin.ts
 *
 * Server-only authorization helpers with role-based access control (RBAC).
 * Each role maps to a numeric level (user=0, admin=10).
 * Guards query the DB-backed `role` column in better_auth."user" and
 * compare the user's level against the required minimum.
 *
 * Exports:
 *  - requireRole(minLevel): returns user + role, or an error NextResponse.
 *  - requireAdmin(): convenience wrapper around requireRole(10).
 *  - getServerAuthUser(): memoized per-request (React.cache) user fetch
 *    for server components that need the current user.
 */

import 'server-only';

import { cache } from 'react';
import { auth } from '@/lib/auth';
import { pool } from '@/utils/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/utils/auth';
import { rethrowIfDynamicServerError } from '@/utils/errors';
import type { User } from '@/stores/useAuthStore';

export const ROLE_LEVELS: Record<string, number> = {
  user: 0,
  admin: 10,
};

const UNAUTHORIZED = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const FORBIDDEN = NextResponse.json({ error: 'Forbidden' }, { status: 403 });

/**
 * Fetches the current session and verifies the user's role level meets
 * the required minimum. Queries the DB-backed `role` column.
 * Memoized per-request via React.cache() so multiple guards within
 * the same request reuse the authentication check.
 *
 * @param minLevel — minimum role level required (defaults to admin=10)
 */
export const requireRole = cache(
  async (
    minLevel: number = 10
  ): Promise<{ user: any; role: string; error?: NextResponse }> => {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) {
        return { user: null, role: 'user', error: UNAUTHORIZED };
      }

      // Query the user's role directly from the database
      const userResult = await pool.query(
        `SELECT role FROM better_auth."user" WHERE id = $1`,
        [session.user.id]
      );
      const dbRole = userResult.rows[0]?.role || 'user';
      const role = isAdmin(session.user.email, dbRole) ? 'admin' : dbRole;
      const level = ROLE_LEVELS[role] ?? 0;

      if (level < minLevel) {
        return { user: null, role, error: FORBIDDEN };
      }

      return { user: session.user, role };
    } catch (err: unknown) {
      rethrowIfDynamicServerError(err);
      console.error('requireRole error:', err);
      return {
        user: null,
        role: 'user',
        error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      };
    }
  }
);

/**
 * Convenience wrapper — requires admin level (10).
 * Memoized per-request via React.cache().
 */
export const requireAdmin = cache(
  async (): Promise<{ user: any; error?: NextResponse }> => {
    const result = await requireRole(10);
    return { user: result.user, error: result.error };
  }
);

/**
 * Fetches the current session and role server-side.
 * Memoized per-request via React.cache() so multiple calls within
 * the same request reuse the result without additional DB queries.
 * Returns a client-safe User object or null if unauthenticated.
 */
export const getServerAuthUser = cache(async (): Promise<User | null> => {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err: unknown) {
    rethrowIfDynamicServerError(err);
    console.error('getServerAuthUser: session fetch failed:', err);
    return null;
  }

  if (!session?.user) {
    return null;
  }

  // Default to 'user' role if the DB query fails
  let dbRole = 'user';
  try {
    const userResult = await pool.query(
      `SELECT role FROM better_auth."user" WHERE id = $1`,
      [session.user.id]
    );
    dbRole = userResult.rows[0]?.role || 'user';
  } catch (err: unknown) {
    rethrowIfDynamicServerError(err);
    console.error('getServerAuthUser: role query failed, defaulting to user:', err);
  }

  const role = isAdmin(session.user.email, dbRole) ? 'admin' : dbRole;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
    emailVerified: session.user.emailVerified ?? false,
    image: session.user.image ?? "",
    role,
    isAdmin: isAdmin(session.user.email, role),
  };
});
