"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ScanFace,
  MonitorPlay,
  Camera,
  FileBarChart,
  Bell,
  CalendarRange,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employee", href: "/dashboard/employee", icon: Users },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { label: "Face Recognition", href: "/dashboard/recognition", icon: ScanFace },
  { label: "Live Monitoring", href: "/dashboard/live", icon: MonitorPlay },
  { label: "CCTV", href: "/dashboard/cctv", icon: Camera },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Work Schedule", href: "/dashboard/schedule", icon: CalendarRange },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 items-center gap-3 px-4">
        <Image
          src="/images/logo-talangmas.png"
          alt="Logo Talangmas"
          width={40}
          height={40}
          className="h-9 w-auto object-contain"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3 py-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href + "/") ||
                      pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-3 py-1">
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />}>
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
