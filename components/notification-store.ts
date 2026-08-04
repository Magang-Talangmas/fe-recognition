"use client";

import { useSyncExternalStore } from "react";

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
  time: string;
  read: boolean;
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

export function useNotifications(): Notification[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function pushNotification(
  n: Omit<Notification, "id" | "time" | "read">
) {
  notifications = [
    { ...n, id: `N-${Date.now()}`, time: nowLabel(), read: false },
    ...notifications,
  ].slice(0, 50);
  emit();
}

export function markNotificationRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  emit();
}

export function toggleNotificationRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: !n.read } : n
  );
  emit();
}

export function markAllNotificationsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
}
