import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteFocusManager: React.FC<{ targetId: string }> = ({ targetId }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const target = document.getElementById(targetId);
    target?.focus({ preventScroll: true });
  }, [pathname, targetId]);

  return null;
};

export default RouteFocusManager;
