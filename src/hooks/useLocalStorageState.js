import { useEffect, useState } from 'react';

/** Persist non-sensitive UI preferences only. Do not use for emergency records or credentials. */
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const raw = window.localStorage.getItem(key); return raw == null ? initialValue : JSON.parse(raw); }
    catch { return initialValue; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ } }, [key, value]);
  return [value, setValue];
}
