/**
 * Aurora — src/hooks/useUsersManagement.ts
 *
 * Admin user management hook: search, paginate, verify, change roles, and delete users.
 * Wraps TanStack Query mutations with local UI state for confirmations and loading.
 */

"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useAdminUsersQuery,
  useAdminUserSessionsQuery,
  useToggleUserVerifyMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  type AdminUserRow,
} from "@/hooks/queries";

export type UserRow = AdminUserRow;
export type SortKey = "name" | "email" | "emailVerified" | "createdAt" | "sessionCount";
export type FilterVerified = "all" | "verified" | "unverified";

export function useUsersManagement(
  page: number,
  search: string,
  verified: string,
  sortBy: string,
  sortDir: string,
) {
  const isAdmin = useAuthStore((s) => s.user?.isAdmin ?? false);
  const { data, isLoading, isFetching, error, refetch } = useAdminUsersQuery({
    page,
    limit: 20,
    search,
    verified: verified === 'all' ? undefined : verified,
    sortBy,
    sortDir,
  });
  const toggleVerifyMutation = useToggleUserVerifyMutation();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const deleteMutation = useDeleteUserMutation();

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingVerify, setUpdatingVerify] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useAdminUserSessionsQuery(selectedUser?.id ?? null);

  const handleToggleVerify = async (user: UserRow, newStatus: boolean) => {
    setUpdatingVerify(user.id);
    try {
      await toggleVerifyMutation.mutateAsync({ userId: user.id, emailVerified: newStatus });
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, emailVerified: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update verification status");
    } finally {
      setUpdatingVerify(null);
    }
  };

  const handleRoleChange = async (user: UserRow, newRole: string) => {
    setUpdatingRole(user.id);
    try {
      await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update user role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      if (selectedUser?.id === confirmDelete.id) setSelectedUser(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    loading: isLoading || isFetching,
    error: error?.message ?? null,
    selectedUser,
    setSelectedUser,
    confirmDelete,
    setConfirmDelete,
    deleting,
    updatingVerify,
    updatingRole,
    sessions,
    sessionsLoading,
    isAdmin,
    fetchUsers: refetch,
    handleToggleVerify,
    handleRoleChange,
    handleDelete,
  };
}
