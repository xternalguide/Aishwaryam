import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Resets the scroll position to the top on every route change.
 * The app's primary scroll container is the #root div (overflow-y: auto),
 * so we target both it and window for full coverage.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the #root container (primary scroll host in this app)
    const root = document.getElementById('root');
    if (root) {
      root.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // Also reset window scroll as a fallback
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};
