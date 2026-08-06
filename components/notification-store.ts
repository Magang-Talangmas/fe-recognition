"use client";

import { useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";

export type NotificationType =
  | "checkin"
  | "unknown"
  | "cctv"
  | "recognition"
  | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string; // label relatif ("2 menit lalu")
  read: boolean;
  createdAt?: string; // ISO dari backend, untuk format relatif & urutan
};

let notifications: Notification[] = [
  {
    id: "N-01",
    type: "unknown",
    title: "Wajah Tidak Dikenal",
    description: "Wajah unknown terdeteksi di CAM-01 (confidence 41.3%).",
    time: "2 menit lalu",
    read: false,
  },
  {
    id: "N-02",
    type: "cctv",
    title: "CCTV Offline",
    description: "CAM-05 (Cafeteria) tidak merespons selama 15 menit.",
    time: "5 menit lalu",
    read: false,
  },
  {
    id: "N-03",
    type: "checkin",
    title: "Belum Check In",
    description: "Eko Nugroho belum melakukan check in hari ini.",
    time: "15 menit lalu",
    read: false,
  },
  {
    id: "N-04",
    type: "recognition",
    title: "Pengenalan Berhasil",
    description: "Andi Pratama diverifikasi di CAM-01 (confidence 96.8%).",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "N-05",
    type: "cctv",
    title: "CCTV Kembali Online",
    description: "CAM-04 kembali terhubung setelah gangguan.",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "N-06",
    type: "checkin",
    title: "Terlambat Masuk",
    description: "Hendra Wijaya check-in pukul 10:05 (terlambat 1j 5m).",
    time: "2 jam lalu",
    read: false,
  },
  {
    id: "N-07",
    type: "recognition",
    title: "Pengenalan Berhasil",
    description: "Siti Rahma diverifikasi di CAM-02 (confidence 95.1%).",
    time: "2 jam lalu",
    read: true,
  },
  {
    id: "N-08",
    type: "system",
    title: "Pembaruan Sistem",
    description: "Threshold recognition diperbarui ke 80%.",
    time: "3 jam lalu",
    read: true,
  },
  {
    id: "N-09",
    type: "unknown",
    title: "Wajah Tidak Dikenal",
    description: "Wajah unknown terdeteksi di CAM-03 (confidence 38.7%).",
    time: "5 jam lalu",
    read: true,
  },
  {
    id: "N-10",
    type: "checkin",
    title: "Check Out",
    description: "Budi Santoso check-out pukul 17:02 (8j 10m).",
    time: "kemarin",
    read: true,
  },
  {
    id: "N-11",
    type: "cctv",
    title: "CCTV Offline",
    description: "CAM-02 (Lobby Utama) gangguan sinyal.",
    time: "kemarin",
    read: true,
  },
  {
    id: "N-12",
    type: "system",
    title: "Pembaruan Jadwal",
    description: "Jadwal shift bulan ini telah dimuat ulang.",
    time: "kemarin",
    read: true,
  },
];

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return notifications;
}

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", { hour12: false });
}

export function formatRelativeTime(
  iso?: string,
  fallback?: string
): string {
  if (!iso) return fallback ?? "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return fallback ?? "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Kemarin";
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID");
}

export function useNotifications(): Notification[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function pushNotification(
  n: Omit<Notification, "id" | "time" | "read"> & { id?: string }
) {
  const entry: Notification = {
    ...n,
    id: n.id ?? `N-${Date.now()}`,
    time: n.createdAt ? formatRelativeTime(n.createdAt) : nowLabel(),
    read: false,
  };
  notifications = [
    entry,
    ...notifications.filter((x) => x.id !== entry.id),
  ].slice(0, 50);
  emit();
}

export function markNotificationRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  emit();
  apiFetch(`/v1/live/notifications/${id}/read`, {
    method: "PATCH",
  }).catch(() => {});
}

export function toggleNotificationRead(id: string) {
  let updated: Notification | undefined;
  notifications = notifications.map((n) => {
    if (n.id !== id) return n;
    updated = { ...n, read: !n.read };
    return updated;
  });
  emit();
  if (updated?.read) {
    apiFetch(`/v1/live/notifications/${id}/read`, {
      method: "PATCH",
    }).catch(() => {});
  }
}

export function markAllNotificationsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
  apiFetch("/v1/live/notifications/read-all", {
    method: "PATCH",
  }).catch(() => {});
}

export function seedNotifications(list: Notification[]) {
  const normalized = list.map((n) => ({
    ...n,
    time: formatRelativeTime(n.createdAt, n.time),
  }));
  const map = new Map<string, Notification>();
  for (const n of [...normalized, ...notifications]) {
    if (!map.has(n.id)) map.set(n.id, n);
  }
  notifications = Array.from(map.values())
    .sort((a, b) => {
      const ta = a.createdAt ? +new Date(a.createdAt) : 0;
      const tb = b.createdAt ? +new Date(b.createdAt) : 0;
      return tb - ta;
    })
    .slice(0, 50);
  emit();
}

export function setNotificationRead(id: string, read: boolean) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read } : n
  );
  emit();
  if (read) {
    apiFetch(`/v1/live/notifications/${id}/read`, {
      method: "PATCH",
    }).catch(() => {});
  }
}

export async function loadNotifications() {
  try {
    const data = await apiFetch<{ items: Notification[]; total: number }>(
      "/v1/live/notifications?limit=50"
    );
    if (data?.items) seedNotifications(data.items);
  } catch (err) {
    console.error("Gagal mengambil notifikasi:", err);
  }
}
