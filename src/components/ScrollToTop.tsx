import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Resets scroll position to the top on every route change.
 *
 * Why the aggressive approach:
 * Each screen renders its own inner `overflowY: auto` div as the real scroll
 * host (flex: 1 child inside a 100vh wrapper). Simply scrolling #root or
 * window has no effect on those inner containers. We therefore walk the entire
 * DOM and reset every element that is actually scrolled.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Reset window / document-level scroll (covers SSR fallback)
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (_) {}

    // 2. Reset #root (global scroll host defined in index.css)
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;

    // 3. Find EVERY element in the page that has a non-zero scrollTop
    //    (i.e. inner screen scroll containers) and reset them immediately.
    const resetAll = () => {
      document.querySelectorAll('*').forEach((el) => {
        const element = el as HTMLElement;
        if (element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
    };

    // Run immediately for same-tick elements already in the DOM
    resetAll();

    // Run again after React has painted the new route's DOM tree
    const raf = requestAnimationFrame(resetAll);

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
};
