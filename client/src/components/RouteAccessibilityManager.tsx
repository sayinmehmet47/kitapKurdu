import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteAccessibilityManager() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState('');
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    let observer: MutationObserver | undefined;
    let focused = false;
    setAnnouncement('');

    const focusRoute = () => {
      if (focused) return true;

      const main = Array.from(document.querySelectorAll<HTMLElement>('main[data-route-path]')).find(
        (element) => element.dataset.routePath === pathname
      );
      if (!main) return false;

      const heading = main.querySelector<HTMLElement>('h1');
      const target = heading ?? main;
      target.tabIndex = -1;
      target.focus();
      focused = true;
      observer?.disconnect();
      setAnnouncement(heading?.textContent?.trim() ?? '');
      return true;
    };

    if (!focusRoute()) {
      const root = document.getElementById('root');

      if (root && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(focusRoute);
        observer.observe(root, { childList: true, subtree: true });
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, [pathname]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}
