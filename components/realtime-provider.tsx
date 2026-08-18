"use client";

import { useEffect } from "react";
import { API_URL, getToken } from "@/lib/api";
import {
  dispatchRealtime,
  setRealtimeStatus,
} from "@/lib/realtime";
import { pushNotification } from "@/components/notification-store";
import { formatTimeHM } from "@/lib/utils";

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setRealtimeStatus("connecting");

    const es = new EventSource(
      `${API_URL}/v1/live/events?token=${encodeURIComponent(token)}`
    );

    es.onopen = () => setRealtimeStatus("connected");
    es.onerror = () => setRealtimeStatus("disconnected");

    es.addEventListener("recognition", (e) => {
      try {
        const d = JSON.parse(e.data) as {
          name: string | null;
          employeeId: string | null;
          cameraName: string;
          cameraId: string;
          confidence: number;
          timestamp?: string;
        };
        dispatchRealtime("recognition", d);
        pushNotification({
          type: "recognition",
          title: "Pengenalan Berhasil",
          description: `${d.name ?? "Karyawan"} diverifikasi di ${
            d.cameraName ?? d.cameraId
          } (confidence ${d.confidence?.toFixed(1) ?? "?"}%).`,
          createdAt: d.timestamp,
        });
      } catch (err) {
        console.error("Gagal memproses event recognition:", err);
      }
    });

    es.addEventListener("unknown", (e) => {
      try {
        const d = JSON.parse(e.data) as {
          name: string | null;
          employeeId: string | null;
          cameraName: string;
          cameraId: string;
          confidence: number;
          timestamp?: string;
        };
        dispatchRealtime("unknown", d);
        pushNotification({
          type: "unknown",
          title: "Wajah Tidak Dikenal",
          description: `${d.name ?? "Wajah tidak dikenal"} terdeteksi di ${
            d.cameraName ?? d.cameraId
          } (confidence ${d.confidence?.toFixed(1) ?? "?"}%).`,
          createdAt: d.timestamp,
        });
      } catch (err) {
        console.error("Gagal memproses event unknown:", err);
      }
    });

    es.addEventListener("camera_online", (e) => {
      try {
        const d = JSON.parse(e.data) as { cameraId: string; name: string };
        dispatchRealtime("camera_online", d);
        pushNotification({
          type: "cctv",
          title: "CCTV Kembali Online",
          description: `${d.name} kembali terhubung setelah gangguan.`,
        });
      } catch (err) {
        console.error("Gagal memproses event camera_online:", err);
      }
    });

    es.addEventListener("camera_offline", (e) => {
      try {
        const d = JSON.parse(e.data) as {
          cameraId: string;
          name: string;
          since: string;
        };
        dispatchRealtime("camera_offline", d);
        pushNotification({
          type: "cctv",
          title: "CCTV Offline",
          description: `${d.name} tidak merespons sejak ${new Date(
            d.since
          ).toLocaleString("id-ID")}.`,
        });
      } catch (err) {
        console.error("Gagal memproses event camera_offline:", err);
      }
    });

    es.addEventListener("checkin", (e) => {
      try {
        const d = JSON.parse(e.data) as {
          employeeId: string;
          name: string;
          type: string;
          isLate: boolean;
          time: string;
        };
        dispatchRealtime("checkin", d);
        pushNotification({
          type: "checkin",
          title: d.isLate ? "Terlambat Masuk" : "Check In",
          description: `${d.name} ${
            d.type === "CHECK_OUT" ? "check-out" : "check-in"
          } pukul ${formatTimeHM(d.time)}${d.isLate ? " (terlambat)" : ""}.`,
        });
      } catch (err) {
        console.error("Gagal memproses event checkin:", err);
      }
    });

    return () => {
      es.close();
      setRealtimeStatus("disconnected");
    };
  }, []);

  return <>{children}</>;
}