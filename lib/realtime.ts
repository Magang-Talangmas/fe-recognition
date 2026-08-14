"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export type RealtimeEventType =
  | "recognition"
  | "unknown"
  | "camera_online"
  | "camera_offline"
  | "checkin";

export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "disconnected";

type Listener = (event: RealtimeEventType, data: unknown) => void;

const listeners = new Set<Listener>();

let status: RealtimeStatus = "disconnected";
const statusListeners = new Set<() => void>();

function setStatus(next: RealtimeStatus) {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) listener();
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function dispatchRealtime(event: RealtimeEventType, data: unknown) {
  for (const listener of listeners) listener(event, data);
}

export function setRealtimeStatus(next: RealtimeStatus) {
  setStatus(next);
}

export function subscribeRealtime(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribeStatus, () => status, () => status);
}

export function useRealtime(
  events: RealtimeEventType[],
  handler: (event: RealtimeEventType, data: unknown) => void
) {
  const handlerRef = useRef(handler);
  const eventsKey = events.join("|");

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listener: Listener = (event, data) => {
      if (eventsKey.includes(event)) handlerRef.current(event, data);
    };
    return subscribeRealtime(listener);
  }, [eventsKey]);
}