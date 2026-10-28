import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(duration = 2800) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const notify = useCallback((nextMessage) => {
    setMessage(nextMessage);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), duration);
  }, [duration]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { message, setMessage, notify };
}
