/**
 * Aurora — src/hooks/queries/admin.ts
 *
 * Admin dashboard, paginated queries, and mutation hooks.
 *
 * Paginated queries (useAdminProductsQuery, useAdminOrdersQuery,
 * useAdminUsersQuery, useAdminAuditLogsQuery) all share the same
 * pattern: they accept params with page/limit/search/filter fields,
 * build a URLSearchParams string, fetch from the admin API, and
 * return a paginated response type.
 *
 * Mutations (useUpdateOrderStatusMutation, useSaveProductMutation,
 * useDeleteProductMutation, etc.) perform an API call then
 * invalidate specific React Query cache prefixes to refresh data
 * without a manual refetch.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
  DashboardMetrics,
  RecentOrder,
  OrderData,
  ProductData,
} from '@/stores/useAdminStore';

// ── Dashboard ───────────────────────────────────────────────────────────

/** Fetches admin dashboard metrics and recent orders. */
export function useAdminDashboardQuery() {
  return useQuery<{ metrics: DashboardMetrics; recentOrders: RecentOrder[] }>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      return res.json();
    },
    staleTime: 30_000,
  });
}

// ── Types ───────────────────────────────────────────────────────────────

export interface AdminPaginatedProductsResponse {
  products: ProductData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOrdersResponse {
  orders: OrderData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  accounts: Array<{ id: string; providerId: string; createdAt: string }>;
  sessionCount: number;
  lastSessionAt: string | null;
}

export interface PaginatedUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

interface AdminOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  verified?: string;
  sortBy?: string;
  sortDir?: string;
}

// ── Paginated queries ───────────────────────────────────────────────────

/**
 * Generic pattern for all admin paginated queries:
 * - Params are serialized to URLSearchParams.
 * - keepPreviousData provides smooth pagination transitions.
 * - staleTime=30s avoids redundant roundtrips on tab switching while mutations invalidate.
 */

/** Fetches paginated products for inventory management. */
export function useAdminProductsQuery(params: AdminProductsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async (): Promise<AdminPaginatedProductsResponse> => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', String(params.page));
      if (params.limit) sp.set('limit', String(params.limit));
      if (params.search) sp.set('search', params.search);
      if (params.category) sp.set('category', params.category);
      const qs = sp.toString();
      const res = await fetch(`/api/admin/products${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load products');
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Fetches paginated orders for admin order processing. */
export function useAdminOrdersQuery(params: AdminOrdersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async (): Promise<PaginatedOrdersResponse> => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', String(params.page));
      if (params.limit) sp.set('limit', String(params.limit));
      if (params.search) sp.set('search', params.search);
      if (params.status && params.status !== 'all') sp.set('status', params.status);
      const qs = sp.toString();
      const res = await fetch(`/api/admin/orders${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load orders');
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Fetches paginated users for admin user management. */
export function useAdminUsersQuery(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async (): Promise<PaginatedUsersResponse> => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', String(params.page));
      if (params.limit) sp.set('limit', String(params.limit));
      if (params.search) sp.set('search', params.search);
      if (params.verified) sp.set('verified', params.verified);
      if (params.sortBy) sp.set('sortBy', params.sortBy);
      if (params.sortDir) sp.set('sortDir', params.sortDir);
      const qs = sp.toString();
      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Fetches sessions for a specific user (admin user detail modal). */
export function useAdminUserSessionsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'sessions'],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/admin/users/${userId}?include=sessions`);
      if (!res.ok) throw new Error('Failed to load user sessions');
      const data = await res.json();
      return data.sessions || [];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// ── Admin mutations ─────────────────────────────────────────────────────

/**
 * Mutation pattern: each mutation performs a fetch call on mutateFn,
 * then invalidates relevant query cache(s) on success so the UI
 * reflects the new data without manual refetch.
 */

/** Updates an order's status, then invalidates orders + dashboard. */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

/**
 * Creates or updates a product.
 * If `id` is provided, uses PUT (update); otherwise POST (create).
 * Invalidates all product-related cache prefixes so the storefront
 * and admin list both refresh.
 */
export function useSaveProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product, id }: { product: Partial<ProductData>; id?: string }) => {
      const url = id ? `/api/admin/products/${id}` : "/api/admin/products";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save product");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both admin and public product caches
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

/** Deletes a product, then invalidates the product list. */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

/** Toggles a user's email verification status. */
export function useToggleUserVerifyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, emailVerified }: { userId: string; emailVerified: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/** Updates a user's role (user | admin). */
export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface PaginatedAuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminAuditLogsParams {
  page?: number;
  limit?: number;
  targetType?: string;
  action?: string;
  search?: string;
}

export function useAdminAuditLogsQuery(params: AdminAuditLogsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: async (): Promise<PaginatedAuditLogsResponse> => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', String(params.page));
      if (params.limit) sp.set('limit', String(params.limit));
      if (params.targetType) sp.set('targetType', params.targetType);
      if (params.action) sp.set('action', params.action);
      if (params.search) sp.set('search', params.search);
      const qs = sp.toString();
      const res = await fetch(`/api/admin/audit${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Deletes a user. */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
