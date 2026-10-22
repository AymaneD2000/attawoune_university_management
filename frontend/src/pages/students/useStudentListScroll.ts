import * as React from 'react';

const positions = new Map<string, number>();

export const useStudentListScroll = (key: string, ready: boolean) => {
  const restoredKey = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    restoredKey.current = null;

    return () => {
      if (restoredKey.current === key) {
        positions.set(key, window.scrollY);
      }
    };
  }, [key]);

  React.useLayoutEffect(() => {
    if (!ready) return;

    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      window.scrollTo({ top: positions.get(key) || 0 });
      restoredKey.current = key;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [key, ready]);
};
