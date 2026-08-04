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
  "/dashboard": "Dashboard",
  "/dashboard/employee": "Employee",
  "/dashboard/attendance": "Attendance",
  "/dashboard/recognition": "Face Recognition",
  "/dashboard/live": "Live Monitoring",
  "/dashboard/cctv": "CCTV",
  "/dashboard/reports": "Reports",
  "/dashboard/notifications": "Notifications",
  "/dashboard/schedule": "Work Schedule",
  "/dashboard/settings": "Settings",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const label = labelMap[pathname] ?? "Dashboard";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
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
