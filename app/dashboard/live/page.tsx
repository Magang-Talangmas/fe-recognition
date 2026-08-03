"use client";

import { useState } from "react";
import {
  MonitorPlay,
  Video,
  VideoOff,
  Radar,
  ScanFace,
  CircleAlert,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Feed = {
  id: string;
  name: string;
  location: string;
  online: boolean;
};

type Recognition = {
  id: string;
  name: string;
  camera: string;
  time: string;
  confidence: number;
  status: "Verified" | "Unknown";
};

const feeds: Feed[] = [
  { id: "CAM-01", name: "Pintu Masuk", location: "Lantai 1 - Lobby", online: true },
  { id: "CAM-02", name: "Lobby Utama", location: "Lantai 1 - Lobby", online: true },
  { id: "CAM-03", name: "Ruang Kerja A", location: "Lantai 2 - Area Karyawan", online: true },
  { id: "CAM-04", name: "Ruang Kerja B", location: "Lantai 2 - Area Karyawan", online: true },
  { id: "CAM-05", name: "Cafeteria", location: "Lantai 1 - Kantin", online: false },
  { id: "CAM-06", name: "Pantry", location: "Lantai 2 - Pantry", online: true },
];

const recognitions: Recognition[] = [
  { id: "REC-01", name: "Andi Pratama", camera: "CAM-01", time: "08:02:11", confidence: 96.4, status: "Verified" },
  { id: "REC-02", name: "Siti Rahma", camera: "CAM-02", time: "08:05:33", confidence: 95.1, status: "Verified" },
  { id: "REC-03", name: "Budi Santoso", camera: "CAM-03", time: "08:11:04", confidence: 92.8, status: "Verified" },
  { id: "REC-04", name: "Unknown", camera: "CAM-01", time: "08:14:52", confidence: 41.3, status: "Unknown" },
  { id: "REC-05", name: "Dewi Lestari", camera: "CAM-02", time: "08:17:20", confidence: 94.7, status: "Verified" },
  { id: "REC-06", name: "Rizky Ananda", camera: "CAM-04", time: "08:21:09", confidence: 93.2, status: "Verified" },
];

export default function LiveMonitoringPage() {
  const [live, setLive] = useState<Recognition[]>(recognitions);
  const [refreshing, setRefreshing] = useState(false);

  const onlineCount = feeds.filter((f) => f.online).length;

  function refresh() {
    setRefreshing(true);
    const now = new Date().toLocaleTimeString("id-ID", { hour12: false });
    setLive((prev) => [
      {
        id: `REC-${Date.now()}`,
        name: prev[0]?.name ?? "Unknown",
        camera: prev[0]?.camera ?? "CAM-01",
        time: now,
        confidence: 90 + Math.round(Math.random() * 9),
        status: "Verified" as const,
      },
      ...prev,
    ].slice(0, 8));
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <MonitorPlay className="size-6" />
            Live Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau feed CCTV & hasil pengenalan wajah secara langsung
          </p>
        </div>
        <Button className="cursor-pointer" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            {feeds.map((f) => (
              <Card key={f.id} className="overflow-hidden rounded-lg">
                <div className="relative flex aspect-video items-center justify-center bg-zinc-900">
                  {f.online ? (
                    <>
                      <Video className="size-10 text-zinc-600" />
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
              {live.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.camera} · {r.time}
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

          <Card className="rounded-lg border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CircleAlert className="size-4 text-destructive" />
                Peringatan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-muted-foreground">
                Kamera <span className="font-medium text-foreground">CAM-05</span>{" "}
                offline. Wajah tidak terdeteksi di area Cafeteria.
              </p>
              <p className="text-muted-foreground">
                Wajah <span className="font-medium text-foreground">tidak dikenal</span>{" "}
                terdeteksi di CAM-01.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}