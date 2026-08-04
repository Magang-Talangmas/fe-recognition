"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck,
  UserX,
  VideoOff,
  ScanFace,
  BellRing,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  markAllNotificationsRead,
  toggleNotificationRead,
  useNotifications,
  type NotificationType,
} from "@/components/notification-store";

const typeMeta: Record<
  NotificationType,
  { label: string; icon: typeof Bell; tone: string }
> = {
  checkin: {
    label: "Kehadiran",
    icon: CalendarCheck,
    tone: "text-green-600 bg-green-100 dark:bg-green-500/15",
  },
  unknown: {
    label: "Tidak Dikenal",
    icon: UserX,
    tone: "text-red-600 bg-red-100 dark:bg-red-500/15",
  },
  cctv: {
    label: "CCTV",
    icon: VideoOff,
    tone: "text-orange-600 bg-orange-100 dark:bg-orange-500/15",
  },
  recognition: {
    label: "Pengenalan",
    icon: ScanFace,
    tone: "text-blue-600 bg-blue-100 dark:bg-blue-500/15",
  },
  system: {
    label: "Sistem",
    icon: BellRing,
    tone: "text-purple-600 bg-purple-100 dark:bg-purple-500/15",
  },
};

export default function NotificationsPage() {
  const items = useNotifications();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return typeFilter === "all"
      ? items
      : items.filter((n) => n.type === typeFilter);
  }, [items, typeFilter]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Notifikasi kehadiran, wajah tidak dikenal, CCTV, dan sistem"
        icon={<Bell className="size-6" />}
      >
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={markAllNotificationsRead}
          disabled={unread === 0}
        >
          <CheckCheck />
          Tandai semua dibaca
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v ?? "all")}
        >
          <SelectTrigger className="h-10">
            <span className="flex flex-1 items-center text-left">
              {typeFilter === "all"
                ? "Semua Jenis"
                : typeMeta[typeFilter as NotificationType].label}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {(Object.keys(typeMeta) as NotificationType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {typeMeta[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline">{unread} belum dibaca</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <Card className="rounded-lg">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi.
            </CardContent>
          </Card>
        )}
        {filtered.map((n) => {
          const meta = typeMeta[n.type];
          const Icon = meta.icon;
          return (
            <Card
              key={n.id}
              className={`cursor-pointer rounded-lg transition-colors hover:bg-muted/40 ${
                n.read ? "opacity-70" : ""
              }`}
              onClick={() => toggleNotificationRead(n.id)}
            >
              <CardContent className="flex items-start gap-4">
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <Badge variant="outline">{meta.label}</Badge>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {n.description}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    {n.time}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
