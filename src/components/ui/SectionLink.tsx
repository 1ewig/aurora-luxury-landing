/**
 * Aurora — src/components/ui/SectionLink.tsx
 *
 * Link wrapper that smooth-scrolls to same-page section anchors instead of
 * relying on Next.js hash navigation (which fails while LazySection sections
 * are still unmounted). Cross-page and path-only links behave like Link.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps, type MouseEvent } from "react";
import { scrollToSection } from "@/utils/scrollToSection";

interface SectionLinkProps extends ComponentProps<typeof Link> {}

export function SectionLink({ href, onClick, ...props }: SectionLinkProps) {
  const pathname = usePathname();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const hrefString = typeof href === "string" ? href : href.pathname ?? "";
    const [path, hash] = hrefString.split("#");
    if (!hash) return;

    const targetPath = path || "/";
    if (pathname === targetPath) {
      event.preventDefault();
      scrollToSection(hash);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}