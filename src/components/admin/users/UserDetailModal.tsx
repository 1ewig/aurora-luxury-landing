/**
 * Aurora — src/components/admin/users/UserDetailModal.tsx
 *
 * Slide-over detail panel for a single user — profile, linked accounts,
 * active sessions, and verify/delete actions.
 */

"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { UserRow } from "@/hooks/useUsersManagement";
import type { SessionRow } from "@/hooks/useUserSessions";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

interface UserDetailModalProps {
  user: UserRow | null;
  sessions: SessionRow[];
  sessionsLoading: boolean;
  onClose: () => void;
  onToggleVerify: (user: UserRow, newStatus: boolean) => Promise<void>;
  onRoleChange: (user: UserRow, newRole: string) => Promise<void>;
  onDelete: (user: UserRow) => void;
  isAdmin: boolean;
  updatingVerifyId: string | null;
}

/** User detail modal showing profile, linked accounts, sessions, and admin actions. */
export function UserDetailModal({
  user,
  sessions,
  sessionsLoading,
  onClose,
  onToggleVerify,
  onRoleChange,
  onDelete,
  isAdmin,
  updatingVerifyId,
}: UserDetailModalProps) {
  useBodyScrollLock(!!user);

  useEffect(() => {
    if (!user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className="fixed inset-0 z-[100] p-3 pb-6 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Content */}
      <div className="relative w-full max-w-2xl bg-bg-secondary border border-border-subtle rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden z-10">
        
        {/* ================= BARE MINIMUM HEADER ================= */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border-subtle bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-accent-primary shrink-0" />
            <h2 id="user-details-title" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-text-primary truncate">
              User Details
            </h2>
            <span className="font-mono text-[11px] font-semibold text-text-secondary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md truncate max-w-[150px] sm:max-w-[220px] shrink-0">
              {user.email}
            </span>
            <span
              className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                user.emailVerified
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}
            >
              {user.emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-full hover:bg-bg-primary shrink-0 ml-2"
            aria-label="Close user details"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile verified badge */}
        <div className="flex sm:hidden items-center justify-between px-5 py-2 border-b border-border-subtle bg-bg-primary/20 text-xs">
          <span className="text-text-muted text-[11px]">Email Status</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              user.emailVerified
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            {user.emailVerified ? "Verified" : "Unverified"}
          </span>
        </div>

        {/* ================= SCROLLABLE BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Profile Card */}
          <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bg-primary border border-border-subtle flex items-center justify-center text-text-secondary text-base sm:text-lg font-bold uppercase shrink-0 overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || user.email}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                (user.name || user.email)[0]
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-text-primary text-sm sm:text-base truncate">
                  {user.name || <span className="text-text-muted italic">No display name</span>}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md text-text-secondary">
                  {user.role || "user"}
                </span>
              </div>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-mono truncate">{user.email}</p>
              <p className="text-text-muted text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>Joined {formatDate(user.createdAt)}</span>
                {user.createdAt !== user.updatedAt && (
                  <>
                    <span>&middot;</span>
                    <span>Updated {formatDate(user.updatedAt)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* User Role Card */}
          <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Access Role & Permissions
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">
                Controls administrative capabilities and dashboard access.
              </p>
            </div>

            {isAdmin ? (
              <div className="relative shrink-0">
                <select
                  value={user.role || "user"}
                  onChange={(e) => onRoleChange(user, e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 bg-bg-secondary border border-border-medium rounded-xl text-xs font-semibold text-text-primary focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none pr-9 hover:border-text-muted"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
            ) : (
              <span className="text-xs font-mono font-bold uppercase tracking-wider bg-bg-primary border border-border-subtle px-2.5 py-1 rounded-lg">
                {user.role || "user"}
              </span>
            )}
          </div>

          {/* Email Verification Card */}
          <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Email Verification
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">
                Controls whether this account&rsquo;s email address has been verified.
              </p>
            </div>

            {isAdmin ? (
              <div className="relative shrink-0">
                <select
                  value={user.emailVerified ? "verified" : "unverified"}
                  disabled={updatingVerifyId === user.id}
                  onChange={(e) => onToggleVerify(user, e.target.value === "verified")}
                  className="w-full sm:w-auto px-4 py-2 bg-bg-secondary border border-border-medium rounded-xl text-xs font-semibold text-text-primary focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none pr-9 hover:border-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                >
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            ) : (
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${
                  user.emailVerified
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}
              >
                {user.emailVerified ? "Verified" : "Unverified"}
              </span>
            )}
          </div>

          {/* Linked Accounts */}
          <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Linked Authentication Accounts
            </h4>
            {user.accounts.length === 0 ? (
              <p className="text-xs text-text-muted italic py-1">No linked authentication providers.</p>
            ) : (
              <div className="space-y-2">
                {user.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between bg-bg-secondary border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono font-semibold text-text-primary uppercase tracking-wider">
                        {acc.providerId === "credential" ? "Email & Password" : acc.providerId}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted font-mono">{formatDate(acc.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Active Sessions
              </h4>
              <span className="text-[11px] text-text-muted font-mono">{user.sessionCount} total</span>
            </div>

            {sessionsLoading ? (
              <div className="text-xs text-text-muted text-center py-4 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-text-muted italic py-1">No active sessions found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto border border-border-subtle rounded-xl bg-bg-secondary">
                  <table className="w-full text-xs">
                    <thead className="bg-bg-primary/40 border-b border-border-subtle text-text-secondary">
                      <tr>
                        <th className="px-3.5 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Created</th>
                        <th className="px-3.5 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Expires</th>
                        <th className="px-3.5 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">IP Address</th>
                        <th className="px-3.5 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {sessions.map((s) => {
                        const expired = new Date(s.expiresAt) < new Date();
                        return (
                          <tr key={s.id} className={`hover:bg-bg-primary/20 transition-colors ${expired ? "opacity-40" : ""}`}>
                            <td className="px-3.5 py-2 font-mono text-[11px] whitespace-nowrap">{formatDate(s.createdAt)}</td>
                            <td className="px-3.5 py-2 font-mono text-[11px] whitespace-nowrap">
                              <span className={expired ? "text-error" : "text-emerald-500"}>
                                {formatDate(s.expiresAt)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 font-mono text-[11px] max-w-[110px] truncate">{s.ipAddress || "—"}</td>
                            <td className="px-3.5 py-2 max-w-[180px] truncate text-text-muted text-[11px]">{s.userAgent || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile session cards */}
                <div className="sm:hidden space-y-2">
                  {sessions.map((s) => {
                    const expired = new Date(s.expiresAt) < new Date();
                    return (
                      <div
                        key={s.id}
                        className={`bg-bg-secondary p-3 rounded-xl border border-border-subtle space-y-1.5 text-xs ${
                          expired ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-text-primary">{s.ipAddress || "Unknown IP"}</span>
                          <span className={`text-[10px] font-semibold uppercase ${expired ? "text-error" : "text-emerald-500"}`}>
                            {expired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">{s.userAgent || "No user agent"}</p>
                        <div className="flex justify-between text-[10px] text-text-muted font-mono pt-1 border-t border-border-subtle">
                          <span>Created: {formatDate(s.createdAt)}</span>
                          <span>Expires: {formatDate(s.expiresAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 border-t border-border-subtle bg-bg-secondary flex items-center justify-between gap-3">
          {isAdmin ? (
            <Button
              type="button"
              onClick={() => onDelete(user)}
              variant="ghost"
              size="sm"
              className="border-error text-error hover:bg-error hover:text-white hover:border-error"
            >
              Delete User
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="bg-bg-primary hover:bg-border-subtle text-text-primary border-border-subtle"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
