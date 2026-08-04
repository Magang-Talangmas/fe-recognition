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
  { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
  { label: "Employee", href: "/superadmin/employee", icon: Users },
  { label: "Attendance", href: "/superadmin/attendance", icon: CalendarCheck },
  { label: "Face Recognition", href: "/superadmin/recognition", icon: ScanFace },
  { label: "Live Monitoring", href: "/superadmin/live", icon: MonitorPlay },
  { label: "CCTV", href: "/superadmin/cctv", icon: Camera },
  { label: "Reports", href: "/superadmin/reports", icon: FileBarChart },
  { label: "Work Schedule", href: "/superadmin/schedule", icon: CalendarRange },
  { label: "Settings", href: "/superadmin/settings", icon: Settings },
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
                  item.href === "/superadmin"
                    ? pathname === "/superadmin"
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
