/**
 * Aurora — src/components/admin/activity/ActivityClient.tsx
 *
 * Client-side component for rendering the admin activity audit log.
 * Handles server-side pagination, search queries, filter states, and renders
 * a paginated audit trail table of admin events.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdminHeaderPanel } from "@/components/ui/AdminHeaderPanel";
import { Pagination } from "@/components/ui/Pagination";
import { useAdminAuditLogsQuery } from "@/hooks/queries/admin";
import { ActivitySkeleton } from "./ActivitySkeleton";
import { ActivitySearchFilters } from "./ActivitySearchFilters";

export function ActivityClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const urlSearch = searchParams.get('search') || '';
  const targetType = searchParams.get('targetType') || '';

  const { data, isLoading, isFetching, error, refetch } = useAdminAuditLogsQuery({
    page,
    limit: 20,
    targetType: targetType || undefined,
    search: urlSearch || undefined,
  });

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);

  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch);
    setLocalSearch(urlSearch);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== urlSearch) {
        const p = new URLSearchParams(searchParams.toString());
        if (localSearch) {
          p.set('search', localSearch);
        } else {
          p.delete('search');
        }
        p.set('page', '1');
        router.replace(`${pathname}?${p.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, urlSearch, searchParams, router, pathname]);

  const updateParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    if (key !== 'page') p.set('page', '1');
    router.replace(`${pathname}?${p.toString()}`);
  }, [searchParams, pathname, router]);

  const formatAction = (action: string) =>
    action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {isLoading && logs.length === 0 ? (
        <ActivitySkeleton />
      ) : error ? (
        <div className="p-8 text-center text-error border border-border-subtle rounded-2xl bg-white">
          Failed to load audit logs
        </div>
      ) : (
        <>
          <AdminHeaderPanel
            title="Activity Log"
            description="Audit trail of admin actions across the system."
          />

          <ActivitySearchFilters
            searchQuery={localSearch}
            onSearchChange={setLocalSearch}
            targetType={targetType}
            onTargetTypeChange={(val) => updateParam('targetType', val)}
            onRefresh={refetch}
            loading={isLoading || isFetching}
          />

          <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-text-muted text-sm">No audit logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-secondary/50">
                      <th className="text-left px-6 py-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Time</th>
                      <th className="text-left px-6 py-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Action</th>
                      <th className="text-left px-6 py-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Target</th>
                      <th className="text-left px-6 py-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Admin</th>
                      <th className="text-left px-6 py-4 font-semibold text-text-secondary uppercase tracking-wider text-xs">Target ID</th>
                    </tr>
                  </thead>
                  <tbody className={`transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap text-xs font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-text-primary font-medium whitespace-nowrap">
                          {formatAction(log.action)}
                        </td>
                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                          {log.target_type}
                        </td>
                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                          {log.admin_email}
                        </td>
                        <td className="px-6 py-4 text-text-muted font-mono text-xs whitespace-nowrap">
                          {log.target_id.length > 12 ? `${log.target_id.slice(0, 12)}…` : log.target_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}
        </>
      )}
    </div>
  );
}
