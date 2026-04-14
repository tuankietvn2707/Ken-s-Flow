import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsedItem = JSON.parse(item);
      
      // Safety check: if initialValue is an array, parsedItem must be an array
      if (Array.isArray(initialValue) && !Array.isArray(parsedItem)) {
        console.warn(`[useLocalStorage] Data mismatch for key "${key}": expected array but got ${typeof parsedItem}. Resetting to initial value.`);
        return initialValue;
      }
      
      return parsedItem;
    } catch (error) {
      console.error(`[useLocalStorage] Error parsing localStorage key "${key}":`, error);
      // Reset to default value on error
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`[useLocalStorage] Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
