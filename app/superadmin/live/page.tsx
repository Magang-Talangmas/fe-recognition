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
  seedNotifications,
  type Notification,
} from "@/components/notification-store";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { HlsPlayer } from "@/components/hls-player";
import { WebRtcPlayer } from "@/components/webrtc-player";
import { useRealtime, useRealtimeStatus } from "@/lib/realtime";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { API_URL, apiFetch } from "@/lib/api";
import { formatTimeHM } from "@/lib/utils";

type Feed = {
  id: string;
  name: string;
  location: string;
  online: boolean;
  rtspUrl: string | null;
  snapshotUrl: string | null;
  streamUrl: string | null;
  hlsUrl: string | null;
  whepUrl: string | null;
};

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LiveBboxMessage = {
  camera_id?: string;
  frame_width?: number;
  frame_height?: number;
  bounding_boxes?: Array<{ bounding_box?: BoundingBox; name?: string }>;
};

type BboxState = {
  boxes: BoundingBox[];
  frame: { width: number; height: number };
  receivedAt: number;
};

// The RTSP stream consumed by the detector is currently 704x480. These are
// source-frame coordinates, not the dimensions of the responsive browser card.
const DETECTION_FRAME = { width: 704, height: 480 };

function streamPathFromHlsUrl(hlsUrl: string | null): string | null {
  if (!hlsUrl) return null;
  try {
    const segments = new URL(hlsUrl).pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

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
  notificationId: string | null;
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
  const [failedFeeds, setFailedFeeds] = useState<Set<string>>(new Set());
  const [bboxesByStream, setBboxesByStream] = useState<Record<string, BboxState>>({});
  const realtimeStatus = useRealtimeStatus();
  const unknownRefetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onlineCount = feeds.filter((f) => f.online).length;

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
    const stream = new EventSource("/api/live-bboxes");

    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveBboxMessage;
        if (!payload.camera_id || !payload.bounding_boxes) return;

        const boxes = payload.bounding_boxes.flatMap((item) =>
          item.bounding_box
            ? [item.bounding_box]
            : [],
        );
        const width = payload.frame_width && payload.frame_width > 0
          ? payload.frame_width
          : DETECTION_FRAME.width;
        const height = payload.frame_height && payload.frame_height > 0
          ? payload.frame_height
          : DETECTION_FRAME.height;
        setBboxesByStream((previous) => ({
          ...previous,
          [payload.camera_id!]: { boxes, frame: { width, height }, receivedAt: Date.now() },
        }));
      } catch {
        // Ignore the initial connection event and malformed transient messages.
      }
    };

    return () => stream.close();
  }, []);

  useRealtime(["recognition"], (_event, data) => {
    prependRecognition(data as Recognition);
  });

  useRealtime(["unknown"], (_event, data) => {
    prependRecognition({ ...(data as Recognition), status: "Unknown" });
    if (unknownRefetchRef.current) {
      clearTimeout(unknownRefetchRef.current);
    }
    unknownRefetchRef.current = setTimeout(() => {
      loadRecognitions();
    }, 1500);
  });

  useRealtime(["camera_online"], (_event, data) => {
    setFeedOnline((data as { cameraId: string }).cameraId, true);
  });

  useRealtime(["camera_offline"], (_event, data) => {
    setFeedOnline((data as { cameraId: string }).cameraId, false);
  });

  useAutoRefresh(() => {
    loadFeeds();
    loadRecognitions();
    loadNotifications();
  }, { intervalMs: 10000 });

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
          variant={realtimeStatus === "connected" ? "secondary" : "outline"}
          className="h-8"
        >
          <span
            className={`size-1.5 rounded-full ${
              realtimeStatus === "connected"
                ? "bg-green-500 animate-pulse"
                : "bg-zinc-400"
            }`}
          />
          {realtimeStatus === "connected"
            ? "Live"
            : realtimeStatus === "connecting"
              ? "Menghubungkan..."
              : "Terputus"}
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
              <LoadingState message="Memuat feed kamera..." />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {feeds.map((f) => (
                <Card key={f.id} className="overflow-hidden rounded-lg">
                  <div className="relative flex aspect-video items-center justify-center bg-zinc-900">
                    {f.online ? (
                      <>
                        {f.hlsUrl ? (
                          <>
                            <HlsPlayer
                              hlsUrl={f.hlsUrl}
                              className="absolute inset-0 h-full w-full"
                            />
                            {(() => {
                              const streamPath = streamPathFromHlsUrl(f.hlsUrl);
                              const latest = streamPath ? bboxesByStream[streamPath] : undefined;
                              if (!latest || Date.now() - latest.receivedAt > 1000) return null;

                              return (
                                <div
                                  className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2"
                                  style={{ aspectRatio: `${latest.frame.width} / ${latest.frame.height}` }}
                                >
                                  {latest.boxes.map((boundingBox, index) => (
                                    <div
                                      key={`${index}-${boundingBox.x}-${boundingBox.y}`}
                                      className="absolute border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                                      style={{
                                        left: `${(boundingBox.x / latest.frame.width) * 100}%`,
                                        top: `${(boundingBox.y / latest.frame.height) * 100}%`,
                                        width: `${(boundingBox.width / latest.frame.width) * 100}%`,
                                        height: `${(boundingBox.height / latest.frame.height) * 100}%`,
                                      }}
                                    />
                                  ))}
                                </div>
                              );
                            })()}
                            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                              <span className="size-1.5 animate-pulse rounded-full bg-white" />
                              LIVE
                            </span>
                            <span className="absolute bottom-3 right-3 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                              {f.id}
                            </span>
                          </>
                        ) : f.whepUrl ? (
                          <>
                            <WebRtcPlayer
                              whepUrl={f.whepUrl}
                              className="absolute inset-0 h-full w-full"
                            />
                            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                              <span className="size-1.5 animate-pulse rounded-full bg-white" />
                              LIVE
                            </span>
                            <span className="absolute bottom-3 right-3 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                              {f.id}
                            </span>
                          </>
                        ) : (
                          <>
                            {f.streamUrl && f.streamUrl.startsWith("http") ? (
                              <img
                                src={f.streamUrl}
                                alt={`Live CCTV ${f.name}`}
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={() =>
                                  setFailedFeeds((prev) => {
                                    const next = new Set(prev);
                                    next.add(f.id);
                                    return next;
                                  })
                                }
                              />
                            ) : failedFeeds.has(f.id) ? (
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
              {loadingRec && <LoadingState message="Memuat hasil pengenalan..." />}
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
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">
                      {r.name ?? r.employeeId ?? "Unknown"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.cameraName || r.cameraId} · {formatTimeHM(r.time)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
