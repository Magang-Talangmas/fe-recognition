"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  Coffee,
  UserX,
  Video,
  VideoOff,
  Camera,
  ScanFace,
  Building2,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { LoadingState } from "@/components/loading-state";
import { apiFetch, API_URL } from "@/lib/api";

type Summary = {
  totalEmployees: number;
  active: number;
  inactive: number;
  faceRegistered: number;
  presentToday: number;
  departments: number;
  recentActivity: number;
};

type Activity = {
  employeeName: string;
  time: string;
  status: string;
  camera: string;
};

type Feed = {
  id: string;
  name: string;
  location: string;
  online: boolean;
  rtspUrl: string | null;
  snapshotUrl: string | null;
  streamUrl: string | null;
};

const statDefs = [
  {
    key: "totalEmployees",
    label: "Total Employees",
    icon: Users,
    tone: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/15",
  },
  {
    key: "active",
    label: "Active",
    icon: Clock,
    tone: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15",
  },
  {
    key: "inactive",
    label: "Inactive",
    icon: UserX,
    tone: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/15",
  },
  {
    key: "faceRegistered",
    label: "Face Terdaftar",
    icon: ScanFace,
    tone: "text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-500/15",
  },
  {
    key: "presentToday",
    label: "Hadir Hari Ini",
    icon: Coffee,
    tone: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/15",
  },
  {
    key: "departments",
    label: "Departemen",
    icon: Building2,
    tone: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/15",
  },
  {
    key: "recentActivity",
    label: "Aktivitas Terkini",
    icon: Video,
    tone: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/15",
  },
] as const;

const statusBadgeVariant = (
  status: string,
): "secondary" | "outline" | "destructive" => {
  if (status === "Unknown") return "destructive";
  if (status === "Checked In") return "secondary";
  if (status === "Checked Out") return "secondary";
  return "outline";
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({
    totalEmployees: 0,
    active: 0,
    inactive: 0,
    faceRegistered: 0,
    presentToday: 0,
    departments: 0,
    recentActivity: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [summaryRes, activityRes, feedsRes] = await Promise.all([
          apiFetch<Summary>("/v1/dashboard/summary"),
          apiFetch<Activity[]>("/v1/dashboard/recent-activity"),
          apiFetch<Feed[]>("/v1/live/feeds"),
        ]);
        if (!active) return;
        if (summaryRes) setSummary(summaryRes);
        if (activityRes) setActivities(activityRes);
        if (feedsRes) setFeeds(feedsRes);
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan keseluruhan sistem kehadiran & pengenalan wajah
          </p>
        </div>
        <Badge variant="outline">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Memuat...
            </span>
          ) : (
            "Live"
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statDefs.map((s) => (
          <StatCard
            key={s.key}
            icon={<s.icon className="size-5" />}
            tone={s.tone}
            label={s.label}
            value={summary[s.key]}
          />
        ))}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              Live CCTV Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? (
              <LoadingState message="Memuat feed kamera..." />
            ) : feeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <VideoOff className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  CCTV belum terhubung — menunggu integrasi kamera.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {feeds.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-lg border border-border/60"
                  >
                    <div className="relative flex aspect-video items-center justify-center bg-zinc-900">
                      {f.online && (f.streamUrl || f.snapshotUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${API_URL}${f.streamUrl ?? f.snapshotUrl}`}
                          alt={`Live CCTV ${f.name}`}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <VideoOff className="size-6 text-zinc-600" />
                      )}
                      {f.online && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          <span className="size-1 animate-pulse rounded-full bg-white" />
                          LIVE
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {f.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {f.location}
                        </span>
                      </div>
                      <Badge variant={f.online ? "secondary" : "outline"}>
                        {f.online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <Link
                href="/superadmin/live"
                className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                Lihat selengkapnya
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-lg">
          <CardHeader>
            <CardTitle>Recent Recognition Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {activities.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Belum ada aktivitas pengenalan.
              </p>
            )}
            {activities.slice(0, 4).map((r, i) => (
              <div
                key={`${r.camera}-${r.time}-${i}`}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{r.employeeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.camera} · {r.time}
                  </span>
                </div>
                <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <Link
                href="/superadmin/attendance"
                className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                Lihat selengkapnya
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
