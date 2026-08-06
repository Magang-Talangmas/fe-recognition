"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MonitorPlay,
  VideoOff,
  Radar,
  ScanFace,
  CircleAlert,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  pushNotification,
  seedNotifications,
  type Notification,
} from "@/components/notification-store";
import { PageHeader } from "@/components/page-header";
import { API_URL, apiFetch, getToken } from "@/lib/api";

type Feed = {
  id: string;
  name: string;
  location: string;
  online: boolean;
  rtspUrl: string | null;
  snapshotUrl: string | null;
  streamUrl: string | null;
};

type Recognition = {
  id: string;
  employeeId: string | null;
  name: string | null;
  cameraId: string;
  cameraName: string;
  time: string;
  timestamp: string;
  confidence: number;
  status: "Verified" | "Unknown";
  thumbnail: string | null;
};

type RecognitionList = {
  items: Recognition[];
  total: number;
};

type NotifList = {
  items: Notification[];
  total: number;
};

export default function LiveMonitoringPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [live, setLive] = useState<Recognition[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [loadingRec, setLoadingRec] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sseConnected, setSseConnected] = useState(false);
  const [failedFeeds, setFailedFeeds] = useState<Set<string>>(new Set());
  const esRef = useRef<EventSource | null>(null);

  const onlineCount = feeds.filter((f) => f.online).length;
  const unknownCount = live.filter((r) => r.status === "Unknown").length;
  const offlineFeeds = feeds.filter((f) => !f.online);

  const loadFeeds = useCallback(async () => {
    try {
      const data = await apiFetch<Feed[]>("/v1/live/feeds");
      setFeeds(data ?? []);
    } catch (err) {
      console.error("Gagal mengambil feed CCTV:", err);
      setError(err instanceof Error ? err.message : "Gagal mengambil feed CCTV");
    } finally {
      setLoadingFeeds(false);
    }
  }, []);

  const loadRecognitions = useCallback(async () => {
    try {
      const data = await apiFetch<RecognitionList>("/v1/live/recognitions?limit=8");
      setLive(data?.items ?? []);
    } catch (err) {
      console.error("Gagal mengambil hasil pengenalan:", err);
      setError(err instanceof Error ? err.message : "Gagal mengambil hasil pengenalan");
    } finally {
      setLoadingRec(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<NotifList>("/v1/live/notifications?limit=20");
      if (data?.items) seedNotifications(data.items);
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    }
  }, []);

  function prependRecognition(r: Recognition) {
    setLive((prev) => [r, ...prev].slice(0, 8));
  }

  function setFeedOnline(cameraId: string, online: boolean) {
    setFeeds((prev) =>
      prev.map((f) => (f.id === cameraId ? { ...f, online } : f))
    );
  }

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        loadFeeds(),
        loadRecognitions(),
        loadNotifications(),
      ]);
    };
    load();
  }, [loadFeeds, loadRecognitions, loadNotifications]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const es = new EventSource(
      `${API_URL}/v1/live/events?token=${encodeURIComponent(token)}`
    );
    esRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    es.addEventListener("recognition", (e) => {
      try {
        const d = JSON.parse(e.data) as Recognition;
        prependRecognition(d);
        pushNotification({
          type: "recognition",
          title: "Pengenalan Berhasil",
          description: `${d.name ?? "Karyawan"} diverifikasi di ${
            d.cameraName ?? d.cameraId
          } (confidence ${d.confidence.toFixed(1)}%).`,
        });
      } catch (err) {
        console.error("Gagal memproses event recognition:", err);
      }
    });

    es.addEventListener("unknown", (e) => {
      try {
        const d = JSON.parse(e.data) as Recognition;
        prependRecognition({ ...d, status: "Unknown" });
        pushNotification({
          type: "unknown",
          title: "Wajah Tidak Dikenal",
          description: `Wajah unknown terdeteksi di ${
            d.cameraName ?? d.cameraId
          } (confidence ${d.confidence.toFixed(1)}%).`,
        });
      } catch (err) {
        console.error("Gagal memproses event unknown:", err);
      }
    });

    es.addEventListener("camera_online", (e) => {
      try {
        const d = JSON.parse(e.data) as { cameraId: string; name: string };
        setFeedOnline(d.cameraId, true);
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
        setFeedOnline(d.cameraId, false);
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
        pushNotification({
          type: "checkin",
          title: d.isLate ? "Terlambat Masuk" : "Check In",
          description: `${d.name} ${d.type === "CHECK_OUT" ? "check-out" : "check-in"} pukul ${d.time}${
            d.isLate ? " (terlambat)" : ""
          }.`,
        });
      } catch (err) {
        console.error("Gagal memproses event checkin:", err);
      }
    });

    return () => {
      es.close();
      esRef.current = null;
      setSseConnected(false);
    };
  }, []);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([loadFeeds(), loadRecognitions(), loadNotifications()]);
    setTimeout(() => setRefreshing(false), 400);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Live Monitoring"
        description="Pantau feed CCTV & hasil pengenalan wajah secara langsung"
        icon={<MonitorPlay className="size-6" />}
      >
        <Badge
          variant={sseConnected ? "secondary" : "outline"}
          className="h-8"
        >
          <span
            className={`size-1.5 rounded-full ${
              sseConnected
                ? "bg-green-500 animate-pulse"
                : "bg-zinc-400"
            }`}
          />
          {sseConnected ? "Live" : "Terputus"}
        </Badge>
        <Button
          className="cursor-pointer"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Radar className="size-4 text-primary" />
              Live CCTV Feed
            </div>
            <Badge variant="outline">
              {onlineCount} dari {feeds.length} kamera online
            </Badge>
          </div>

          {loadingFeeds ? (
            <Card className="rounded-lg">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Memuat feed kamera...
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {feeds.map((f) => (
                <Card key={f.id} className="overflow-hidden rounded-lg">
                  <div className="relative flex aspect-video items-center justify-center bg-zinc-900">
                    {f.online ? (
                      <>
                        {failedFeeds.has(f.id) ? (
                          <VideoOff className="size-10 text-zinc-600" />
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_URL}${f.streamUrl ?? f.snapshotUrl}`}
                              alt={`Live CCTV ${f.name}`}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                              onError={() =>
                                setFailedFeeds((prev) => {
                                  const next = new Set(prev);
                                  next.add(f.id);
                                  return next;
                                })
                              }
                            />
                            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                              <span className="size-1.5 animate-pulse rounded-full bg-white" />
                              LIVE
                            </span>
                            <span className="absolute bottom-3 right-3 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                              {f.id}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <VideoOff className="size-10 text-zinc-600" />
                        <span className="absolute left-3 top-3 rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-300">
                          OFFLINE
                        </span>
                      </>
                    )}
                  </div>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.location}
                      </span>
                    </div>
                    <Badge variant={f.online ? "secondary" : "outline"}>
                      {f.online ? "Online" : "Offline"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="size-4 text-primary" />
                Hasil Pengenalan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {loadingRec && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Memuat hasil pengenalan...
                </div>
              )}
              {!loadingRec && live.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada hasil pengenalan.
                </div>
              )}
              {live.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">
                      {r.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.cameraName || r.cameraId} · {r.time}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {r.confidence.toFixed(1)}%
                    </span>
                    <Badge
                      variant={r.status === "Verified" ? "secondary" : "destructive"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card
            className={`rounded-lg ${
              offlineFeeds.length > 0 || unknownCount > 0
                ? "border-destructive/40"
                : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CircleAlert className="size-4 text-destructive" />
                Peringatan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {offlineFeeds.length === 0 && unknownCount === 0 && (
                <p className="text-muted-foreground">
                  Tidak ada peringatan aktif.
                </p>
              )}
              {offlineFeeds.map((f) => (
                <p key={f.id} className="text-muted-foreground">
                  Kamera{" "}
                  <span className="font-medium text-foreground">{f.id}</span>{" "}
                  offline. Wajah tidak terdeteksi di area {f.name}.
                </p>
              ))}
              {unknownCount > 0 && (
                <p className="text-muted-foreground">
                  {unknownCount} wajah{" "}
                  <span className="font-medium text-foreground">
                    tidak dikenal
                  </span>{" "}
                  terdeteksi baru-baru ini.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
