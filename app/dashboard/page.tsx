import {
  Users,
  Clock,
  Coffee,
  PauseCircle,
  UserCircle,
  UserX,
  Video,
  VideoOff,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    label: "Total Employees",
    value: 128,
    icon: Users,
    tone: "text-blue-600 bg-blue-100",
  },
  {
    label: "Checked In",
    value: 96,
    icon: Clock,
    tone: "text-green-600 bg-green-100",
  },
  {
    label: "On Break",
    value: 18,
    icon: Coffee,
    tone: "text-amber-600 bg-amber-100",
  },
  {
    label: "Tracking Pause",
    value: 7,
    icon: PauseCircle,
    tone: "text-orange-600 bg-orange-100",
  },
  {
    label: "Checked Out",
    value: 5,
    icon: UserCircle,
    tone: "text-purple-600 bg-purple-100",
  },
  {
    label: "Unknown Face",
    value: 12,
    icon: UserX,
    tone: "text-red-600 bg-red-100",
  },
  {
    label: "CCTV Online",
    value: 14,
    icon: Video,
    tone: "text-green-600 bg-green-100",
  },
  {
    label: "CCTV Offline",
    value: 2,
    icon: VideoOff,
    tone: "text-red-600 bg-red-100",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan keseluruhan sistem kehadiran & pengenalan wajah
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-lg">
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-md ${s.tone}`}
              >
                <s.icon className="size-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-semibold">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Live Recognition Feed</CardTitle>
          </CardHeader>
          <CardContent className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            Umpan CCTV live muncul di sini
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Recent Recognition Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {[
              {
                name: "Andi Pratama",
                time: "08:02",
                status: "Checked In",
                variant: "secondary" as const,
              },
              {
                name: "Siti Rahma",
                time: "08:05",
                status: "Checked In",
                variant: "secondary" as const,
              },
              {
                name: "Budi Santoso",
                time: "08:11",
                status: "On Break",
                variant: "outline" as const,
              },
              {
                name: "Unknown",
                time: "08:14",
                status: "Unknown",
                variant: "destructive" as const,
              },
            ].map((r) => (
              <div
                key={r.time + r.name}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Camera {r.time}
                  </span>
                </div>
                <Badge variant={r.variant}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
