"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labelMap: Record<string, string> = {
  "/superadmin": "Dashboard",
  "/superadmin/employee": "Employee",
  "/superadmin/attendance": "Attendance",
  "/superadmin/recognition": "Face Recognition",
  "/superadmin/live": "Live Monitoring",
  "/superadmin/cctv": "CCTV",
  "/superadmin/reports": "Reports",
  "/superadmin/notifications": "Notifications",
  "/superadmin/schedule": "Work Schedule",
  "/superadmin/settings": "Settings",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const isHome = pathname === "/superadmin";
  const label = labelMap[pathname] ?? "Dashboard";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/superadmin">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {!isHome && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
