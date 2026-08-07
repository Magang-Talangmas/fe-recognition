"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  ScanFace,
  UserX,
  VideoOff,
  CalendarCheck,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
  loadNotifications,
  type NotificationType,
} from "@/components/notification-store";

const iconMap: Record<NotificationType, typeof Bell> = {
  checkin: CalendarCheck,
  unknown: UserX,
  cctv: VideoOff,
  recognition: ScanFace,
  system: BellRing,
};

const toneMap: Record<NotificationType, string> = {
  checkin: "text-green-600 bg-green-100 dark:bg-green-500/15",
  unknown: "text-red-600 bg-red-100 dark:bg-red-500/15",
  cctv: "text-orange-600 bg-orange-100 dark:bg-orange-500/15",
  recognition: "text-blue-600 bg-blue-100 dark:bg-blue-500/15",
  system: "text-purple-600 bg-purple-100 dark:bg-purple-500/15",
};

export function NotificationBell() {
  const all = useNotifications();
  const items = all.filter((n) => n.type === "checkin");
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer text-muted-foreground"
            aria-label="Notifikasi"
          />
        }
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                Notifikasi
                {unread > 0 && (
                  <Badge variant="destructive">{unread} baru</Badge>
                )}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="cursor-pointer text-xs"
                onClick={markAllNotificationsRead}
              >
                <CheckCheck />
                Tandai dibaca
              </Button>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {items.length === 0 && (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi.
            </div>
          )}
          {items.slice(0, 6).map((n) => {
            const Icon = iconMap[n.type];
            return (
              <DropdownMenuItem
                key={n.id}
                className="cursor-pointer items-start gap-3 px-2 py-2"
                onClick={() => markNotificationRead(n.id)}
              >
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${toneMap[n.type]}`}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{n.title}</span>
                    {!n.read && (
                      <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {n.description}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {n.time}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/superadmin/notifications" />}
          className="cursor-pointer justify-center text-center"
        >
          Lihat semua notifikasi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}