"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, CircleAlert, Download } from "lucide-react";
import * as XLSX from "xlsx-js-style";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { DataTablePagination } from "@/components/data-table-pagination";
import { TableState } from "@/components/table-state";
import { LoadingState } from "@/components/loading-state";
import { apiFetch } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { useAutoRefresh } from "@/lib/use-auto-refresh";

type ReportRow = {
  code: string;
  label: string;
  present: number;
  late: number;
  absent: number;
  permission: number;
  unknown: number;
};

type ReportResult = {
  rows: ReportRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

function stripCode(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export default function EmployeeReportPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const PAGE_SIZE = 10;

  const pageToUse = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (pageToUse - 1) * PAGE_SIZE + 1;
  const end = Math.min(pageToUse * PAGE_SIZE, total);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("type", "employee");
        params.set("page", String(pageToUse));
        params.set("per_page", String(PAGE_SIZE));
        const data = await apiFetch<ReportResult>(
          `/v1/reports?${params.toString()}`,
        );
        if (!active) return;
        setRows(data?.rows ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(Math.max(1, data?.total_pages ?? 1));
      } catch (err) {
        console.error("Gagal mengambil laporan karyawan:", err);
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat laporan karyawan",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pageToUse, reloadKey]);

  useRealtime(["checkin", "unknown", "recognition"], () =>
    setReloadKey((k) => k + 1)
  );

  useAutoRefresh(() => setReloadKey((k) => k + 1));

  function handleExport() {
    const headers = [
      "Karyawan",
      "Hadir",
      "Terlambat",
      "Absen",
      "Izin",
    ];
    const data = rows.map((r) => [
      stripCode(r.label),
      r.present,
      r.late,
      r.absent,
      r.permission,
    ]);

    const aoa = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wch: 22 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
    ];

    const headerCell = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
    };
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      ws[addr] = { ...ws[addr], ...headerCell };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Karyawan");
    XLSX.writeFile(wb, "laporan-karyawan.xlsx");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan Karyawan"
        description="Hadir, terlambat, dan absen per karyawan"
        icon={<Users className="size-6" />}
      >
        <Button
          variant="outline"
          className="cursor-pointer"
          nativeButton={false}
          render={<Link href="/superadmin/reports" />}
        >
          <ArrowLeft />
          Kembali
        </Button>
        <Button className="cursor-pointer" onClick={handleExport}>
          <Download />
          Ekspor Excel
        </Button>
      </PageHeader>

      {loading && <LoadingState message="Memuat laporan karyawan..." />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <CircleAlert className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="cursor-pointer"
            nativeButton={false}
            render={<Link href="/superadmin/reports" />}
          >
            Kembali ke Reports
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-md border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead className="text-right">Hadir</TableHead>
                <TableHead className="text-right">Terlambat</TableHead>
                <TableHead className="text-right">Absen</TableHead>
                <TableHead className="text-right">Izin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                loading={false}
                empty={rows.length === 0}
                colSpan={5}
                emptyText="Tidak ada data karyawan."
              />
              {rows.map((r) => (
                <TableRow key={r.code}>
                  <TableCell>
                    <span className="font-medium">{stripCode(r.label)}</span>
                  </TableCell>
                  <TableCell className="text-right">{r.present}</TableCell>
                  <TableCell className="text-right">{r.late}</TableCell>
                  <TableCell className="text-right">{r.absent}</TableCell>
                  <TableCell className="text-right">{r.permission}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DataTablePagination
            page={pageToUse}
            pageCount={totalPages}
            total={total}
            start={start}
            end={end}
            itemLabel="karyawan"
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
