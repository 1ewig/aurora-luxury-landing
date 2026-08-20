/**
 * Aurora — src/utils/scrollToSection.ts
 *
 * Smooth-scrolls to a page section by id. Landing sections are mounted
 * lazily via LazySection, so when the target is missing from the DOM the
 * utility watches for its mount (MutationObserver) and scrolls once it
 * appears, with a timeout fallback.
 */

const MOUNT_WAIT_MS = 2500;

export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const startedAt = Date.now();
  const observer = new MutationObserver(() => {
    const found = document.getElementById(id);
    if (!found) return;
    observer.disconnect();
    found.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.setTimeout(() => {
    observer.disconnect();
  }, MOUNT_WAIT_MS - (Date.now() - startedAt));
}