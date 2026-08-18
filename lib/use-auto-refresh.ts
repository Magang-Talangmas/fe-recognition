"use client";

import { useEffect, useRef } from "react";

type AutoRefreshOptions = {
  intervalMs?: number;
};

export function useAutoRefresh(
  onTick: () => void,
  { intervalMs = 15000 }: AutoRefreshOptions = {}
) {
  const tickRef = useRef(onTick);

  useEffect(() => {
    tickRef.current = onTick;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      tickRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}