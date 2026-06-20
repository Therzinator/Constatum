import { useEffect, useState } from 'react';

// Komt overeen met updateOnlineStatus() uit docs/index.html — pure hook
// i.p.v. directe DOM-manipulatie.
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  return online;
}
