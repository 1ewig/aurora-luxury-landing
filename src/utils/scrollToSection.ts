/**
 * Aurora — src/utils/scrollToSection.ts
 *
 * Smooth-scrolls to a page section by id. Landing sections are mounted
 * lazily via LazySection, so when the target is missing from the DOM the
 * utility watches for its mount (MutationObserver) and scrolls once it
 * appears, with a timeout fallback.
 *
 * Manages programmatic scroll state so navbar announcement bar animations
 * don't interrupt active smooth scrolls.
 */

let isScrollingToSection = false;
let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;

export function isProgrammaticScrollActive(): boolean {
  return isScrollingToSection;
}

export function setProgrammaticScroll(active: boolean): void {
  isScrollingToSection = active;
}

const MOUNT_WAIT_MS = 2500;

export function scrollToSection(id: string): void {
  if (typeof window === "undefined") return;

  isScrollingToSection = true;
  if (scrollEndTimer) clearTimeout(scrollEndTimer);

  const cleanup = () => {
    isScrollingToSection = false;
    window.removeEventListener("scrollend", cleanup);
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    }
  };

  window.addEventListener("scrollend", cleanup, { once: true });
  // Fallback timer in case scrollend doesn't fire or scroll duration is short
  scrollEndTimer = setTimeout(cleanup, 1200);

  if (id === "hero") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const scrollWithNavOffset = (el: HTMLElement) => {
    const navbar = document.querySelector("header");
    const navHeight = navbar ? navbar.getBoundingClientRect().height : 80;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  };

  const target = document.getElementById(id);
  if (target) {
    scrollWithNavOffset(target);
    return;
  }

  const startedAt = Date.now();
  const observer = new MutationObserver(() => {
    const found = document.getElementById(id);
    if (!found) return;
    observer.disconnect();
    scrollWithNavOffset(found);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.setTimeout(() => {
    observer.disconnect();
  }, MOUNT_WAIT_MS - (Date.now() - startedAt));
}