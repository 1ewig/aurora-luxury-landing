/**
 * Aurora — src/hooks/useProductFilter.ts
 *
 * URL-synced product listing filters for the storefront.
 * Uses the URL search params (useSearchParams) as the single source of truth
 * for page, sortBy, and search. Local input state (searchQuery) is kept
 * separate from the URL parameter to allow editing without triggering
 * a navigation on every keystroke — the user submits to commit.
 *
 * Bidirectional sync:
 *  - URL → local: initial read + useEffect when searchParam changes (back nav).
 *  - Local → URL: on submit/clear/apply via router.push.
 *
 * Category changes navigate between /products and /products/category/[slug]
 * to keep the URL semantically meaningful for SEO and sharing.
 */

import { useState } from "react";
import { usePaginatedProductsQuery, useCategoriesQuery } from "@/hooks/queries";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface UseProductFilterOptions {
  initialCategory?: string;
  onCategoryChange?: (category: string) => void;
}

/** Manages category, sort, and search filters for the products listing page with server-side pagination and URL sync. */
export function useProductFilter(options: UseProductFilterOptions = {}) {
  const {
    initialCategory = "All",
    onCategoryChange,
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [prevInitialCategory, setPrevInitialCategory] = useState(initialCategory);

  if (prevInitialCategory !== initialCategory) {
    setPrevInitialCategory(initialCategory);
    setActiveCategory(initialCategory);
  }
  
  // Read current filters directly from URL search parameters as the source of truth
  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sortBy") || "featured";
  const searchParam = searchParams.get("search") || "";

  /*
   * Local input state: tracks what the user has typed in the search box.
   * Separate from searchParam (the committed URL value) so we don't
   * navigate on every keystroke — only on submit or clear.
   */
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);

  if (prevSearchParam !== searchParam) {
    setPrevSearchParam(searchParam);
    setSearchQuery(searchParam);
  }

  // Update page via router navigation
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(pathname + "?" + params.toString());
  };

  // Submit search query to the URL
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim() !== "") {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset page to 1
    router.push(pathname + "?" + params.toString());
  };

  // Clear search query and reload results
  const handleClearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1"); // Reset page to 1
    router.push(pathname + "?" + params.toString());
  };

  /*
   * Apply both category and sorting concurrently to avoid double navigation.
   * Changing category changes the pathname, so we build the full URL
   * including the new category path and the existing sortBy/page params.
   */
  const applyFilters = (category: string, newSortBy: string) => {
    const slug = category === "All" ? "" : category.toLowerCase();
    const url = slug ? `/products/category/${slug}` : "/products";

    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSortBy);
    params.set("page", "1"); // Reset page to 1

    router.push(`${url}?${params.toString()}`);
    onCategoryChange?.(category);
  };

  // Fetch paginated, filtered, and sorted products from server
  const { data, isLoading } = usePaginatedProductsQuery({
    category: activeCategory,
    page,
    limit: 12,
    search: searchParam, // Query using the committed URL parameter
    sortBy,
  });

  const filtered = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);

  const handleCategoryChange = (category: string) => {
    const slug = category === "All" ? "" : category.toLowerCase();
    const url = slug ? `/products/category/${slug}` : "/products";

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset page to 1

    router.push(`${url}?${params.toString()}`);
    onCategoryChange?.(category);
  };

  const { data: dbCategories = [] } = useCategoriesQuery();

  return {
    activeCategory,
    setActiveCategory,
    handleCategoryChange,
    sortBy,
    applyFilters,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    handleClearSearch,
    filtered,
    isLoading,
    total,
    totalPages,
    currentPage: page,
    onPageChange: handlePageChange,
    categories: ["All", ...dbCategories.map((c) => c.name)],
  };
}

