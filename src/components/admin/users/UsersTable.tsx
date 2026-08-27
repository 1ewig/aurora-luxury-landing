/**
 * Aurora — src/components/admin/users/UsersTable.tsx
 *
 * Tabular display of users with sorting column headers, layout-specific alignments,
 * loading overlay states, and verification/actions matching the admin table design system.
 */

"use client";

import type { UserRow, SortKey } from "@/hooks/useUsersManagement";

interface UsersTableProps {
  users: UserRow[];
  total: number;
  loading: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  onViewUser: (user: UserRow) => void;
}

export function UsersTable({
  users,
  total,
  loading,
  sortKey,
  sortDir,
  onSort,
  onViewUser,
}: UsersTableProps) {
  const SortHeader = ({
    label,
    sortKey: k,
    align = "left",
  }: {
    label: string;
    sortKey: SortKey;
    align?: "left" | "center" | "right";
  }) => (
    <th
      className={`px-6 py-4 cursor-pointer hover:text-text-primary select-none whitespace-nowrap ${
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(k)}
    >
      <span>{label}</span>
      {sortKey === k && (
        <span className="ml-1 text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border-subtle rounded-[24px] bg-bg-secondary shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-primary/50 uppercase tracking-wider text-[10px] font-semibold text-text-secondary">
              <SortHeader label="Name" sortKey="name" align="left" />
              <SortHeader label="Email" sortKey="email" align="left" />
              <SortHeader label="Verified" sortKey="emailVerified" align="left" />
              <th className="px-6 py-4 text-left">
                Auth
              </th>
              <SortHeader label="Sessions" sortKey="sessionCount" align="left" />
              <SortHeader label="Joined" sortKey="createdAt" align="left" />
              <th className="px-6 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-border-subtle transition-opacity duration-200 ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-20 text-center text-text-secondary text-sm">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-primary/25 transition-colors">
                  <td className="px-6 py-4 text-text-primary font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {user.name || <span className="text-text-muted italic font-normal">No name</span>}
                      </span>
                      {user.role && user.role !== "user" && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            user.role === "admin"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-full">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {user.accounts.map((acc) => (
                        <span
                          key={acc.id}
                          className="text-[10px] font-mono uppercase tracking-wider bg-bg-primary text-text-secondary border border-border-subtle px-2 py-0.5 rounded-md"
                          title={acc.providerId}
                        >
                          {acc.providerId === "credential" ? "Email" : acc.providerId}
                        </span>
                      ))}
                      {user.accounts.length === 0 && (
                        <span className="text-[10px] text-text-muted italic">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center justify-center min-w-[2rem] text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        user.sessionCount > 0
                          ? "bg-accent-primary/10 text-accent-vivid border-accent-primary/20"
                          : "bg-bg-primary text-text-muted border-border-subtle"
                      }`}
                    >
                      {user.sessionCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewUser(user)}
                      className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted text-right">
        {users.length} of {total} user{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
