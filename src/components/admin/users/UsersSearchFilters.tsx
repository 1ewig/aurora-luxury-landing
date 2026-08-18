/**
 * Aurora — src/components/admin/users/UsersSearchFilters.tsx
 *
 * Component for searching, filtering, and refreshing the users list.
 */

"use client";

import { Button } from "@/components/ui/Button";
import type { FilterVerified } from "@/hooks/useUsersManagement";

interface UsersSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterVerified: FilterVerified;
  onFilterChange: (value: FilterVerified) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function UsersSearchFilters({
  searchQuery,
  onSearchChange,
  filterVerified,
  onFilterChange,
  onRefresh,
  loading,
}: UsersSearchFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-md">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-medium rounded-full focus:border-accent-primary focus:outline-none text-sm transition-colors"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          value={filterVerified}
          onChange={(e) => onFilterChange(e.target.value as FilterVerified)}
          className="block flex-1 min-w-0 px-5 py-3 pr-12 bg-bg-secondary border border-border-medium rounded-full text-sm focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1rem",
          }}
        >
          <option value="all">All Users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <Button variant="ghost" size="md" onClick={onRefresh} disabled={loading} className="py-3">
          {loading ? <>Refreshing<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /></> : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
