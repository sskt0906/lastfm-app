// src/hooks/useDebounce.js
import { useEffect, useState } from 'react';
export default function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
