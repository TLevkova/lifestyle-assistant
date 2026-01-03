"use client";

import { useEffect, useState } from "react";
import { liveQuery, type Observable } from "dexie";

/**
 * React hook that subscribes to a Dexie liveQuery observable
 * @param querier Function that returns a Dexie query or promise
 * @param deps Optional dependency array for the querier function
 * @returns The current value from the live query, or undefined while loading
 */
export function useLiveQuery<T>(
  querier: () => Promise<T> | Observable<T> | T,
  deps?: React.DependencyList
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const observable = liveQuery(querier);
    const subscription = observable.subscribe({
      next: (result) => {
        setValue(result);
      },
      error: (error) => {
        console.error("LiveQuery error:", error);
        setValue(undefined);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}


