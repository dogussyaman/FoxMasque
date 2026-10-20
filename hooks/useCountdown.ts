import { useEffect, useState } from 'react';

export function useCountdown(seconds: number, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const start = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, seconds - (Date.now() - start) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  return remaining;
}
