/**
 * Aurora — src/components/admin/users/UsersSkeleton.tsx
 *
 * Loading skeleton representation of the admin user accounts directory.
 */

export function UsersSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      {/* AdminHeaderPanel Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="space-y-2">
          <div className="h-10 w-80 bg-bg-secondary rounded" />
          <div className="h-4 w-56 bg-bg-secondary rounded" />
        </div>
      </div>

      {/* Search/Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-12 w-full sm:max-w-md bg-bg-secondary rounded-full" />
        <div className="h-12 w-44 bg-bg-secondary rounded-full" />
        <div className="h-12 w-28 bg-bg-secondary rounded-full" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto border border-border-subtle rounded-[24px] bg-bg-secondary shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-primary/50">
              {["Name", "Email", "Verified", "Accounts", "Sessions", "Created"].map((h) => (
                <th key={h} className="px-6 py-4">
                  <div className="h-3 w-16 bg-bg-secondary rounded" />
                </th>
              ))}
              <th className="px-6 py-4 text-right">
                <div className="h-3 w-12 bg-bg-secondary rounded ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-28 bg-bg-primary rounded" />
                    <div className="h-4 w-12 bg-bg-primary rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-44 bg-bg-primary rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-20 bg-bg-primary rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-14 bg-bg-primary rounded" />
                    <div className="h-5 w-14 bg-bg-primary rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-5 w-8 bg-bg-primary rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-3 w-24 bg-bg-primary rounded" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="h-7 w-14 bg-bg-primary rounded-full inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Count Skeleton */}
      <div className="h-3 w-32 bg-bg-secondary rounded ml-auto" />
    </div>
  );
}
