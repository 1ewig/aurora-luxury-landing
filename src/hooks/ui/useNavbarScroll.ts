import { useState } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

/** Returns motion values and visibility state for navbar and announcement strip. */
export function useNavbarScroll() {
  const { scrollY } = useScroll();
  const [showBanner, setShowBanner] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    // At the very top of the page, always keep the announcement strip visible
    if (latest <= 10) {
      setShowBanner(true);
      return;
    }

    // Scroll down threshold (> 5px) -> hide
    if (diff > 5) {
      setShowBanner(false);
    }
    // Scroll up threshold (< -5px) from anywhere -> reveal
    else if (diff < -5) {
      setShowBanner(true);
    }
  });

  const navBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(247,247,245,0)", "rgba(247,247,245,0.92)"]
  );
  const navBorder = useTransform(
    scrollY,
    [0, 80],
    ["rgba(232,232,228,0)", "rgba(232,232,228,1)"]
  );
  const navBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(16px)"]);

  return { navBg, navBorder, navBlur, showBanner };
}
