/**
 * Aurora — src/components/admin/users/UsersClient.tsx
 *
 * Client-side component for administering user accounts, role definitions,
 * email verification toggles, and account deletions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Pagination } from "@/components/ui/Pagination";
import { AdminHeaderPanel } from "@/components/ui/AdminHeaderPanel";
import { UsersSearchFilters } from "./UsersSearchFilters";
import { UsersTable } from "./UsersTable";
import { UsersSkeleton } from "./UsersSkeleton";
import { useUsersManagement } from "@/hooks/useUsersManagement";
import type { SortKey } from "@/hooks/useUsersManagement";

const UserDetailModal = dynamic(
  () => import("./UserDetailModal").then((m) => m.UserDetailModal),
  { ssr: false }
);
const ConfirmDialog = dynamic(
  () => import("@/components/ui/ConfirmDialog").then((m) => m.ConfirmDialog),
  { ssr: false }
);

export type { UserRow, SortKey, FilterVerified } from "@/hooks/useUsersManagement";

export function UsersClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const urlSearch = searchParams.get('search') || '';
  const verified = searchParams.get('verified') || 'all';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDirParam = searchParams.get('sortDir') || 'desc';

  const {
    users,
    total,
    totalPages,
    loading,
    error,
    selectedUser,
    setSelectedUser,
    confirmDelete,
    setConfirmDelete,
    deleting,
    updatingVerify,
    sessions,
    sessionsLoading,
    isAdmin,
    fetchUsers,
    handleToggleVerify,
    handleRoleChange,
    handleDelete,
  } = useUsersManagement(page, urlSearch, verified, sortBy, sortDirParam);

  const [localSearch, setLocalSearch] = useState(urlSearch);

  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== urlSearch) {
        const p = new URLSearchParams(searchParams.toString());
        p.set('search', localSearch);
        p.set('page', '1');
        router.replace(`${pathname}?${p.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const updateParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    if (key !== 'page') p.set('page', '1');
    router.replace(`${pathname}?${p.toString()}`);
  }, [searchParams, pathname, router]);

  const handleSort = (key: SortKey) => {
    const currentSortBy = searchParams.get('sortBy') || 'createdAt';
    const currentSortDir = searchParams.get('sortDir') || 'desc';
    if (key === currentSortBy) {
      updateParam('sortDir', currentSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      updateParam('sortBy', key);
      updateParam('sortDir', 'asc');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {loading && users.length === 0 ? (
        <UsersSkeleton />
      ) : error ? (
        <div className="p-8 text-center text-error border border-border-subtle rounded-2xl bg-white">
          {error}
        </div>
      ) : (
        <>
          <AdminHeaderPanel
            title="User Management"
            description="View and manage registered accounts, sessions, and authentication methods."
          />

          <UsersSearchFilters
            searchQuery={localSearch}
            onSearchChange={setLocalSearch}
            filterVerified={verified as any}
            onFilterChange={(val) => updateParam('verified', val)}
            onRefresh={fetchUsers}
            loading={loading}
          />

          <UsersTable
            users={users}
            total={total}
            loading={loading}
            sortKey={sortBy as SortKey}
            sortDir={sortDirParam as "asc" | "desc"}
            onSort={handleSort}
            onViewUser={setSelectedUser}
          />

          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}
        </>
      )}

      <UserDetailModal
        user={selectedUser}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        onClose={() => setSelectedUser(null)}
        onToggleVerify={handleToggleVerify}
        onRoleChange={handleRoleChange}
        onDelete={(u) => setConfirmDelete(u)}
        isAdmin={isAdmin}
        updatingVerifyId={updatingVerify}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${
          confirmDelete?.name || confirmDelete?.email
        }? This will permanently remove the user, their sessions, and linked accounts.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Forever"}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        disabled={deleting}
        loading={deleting}
      />
    </div>
  );
}
